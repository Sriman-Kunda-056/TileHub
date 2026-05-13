const { query, withTransaction } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/inventory
const getInventory = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      p.id AS product_id, p.name, p.sku, p.price_per_sqft,
      c.name AS category,
      i.available_boxes, i.reserved_boxes, i.delivered_boxes,
      i.returned_boxes, i.reorder_point, i.max_stock,
      i.warehouse_location, i.last_restocked_at,
      CASE
        WHEN i.available_boxes <= 0 THEN 'out_of_stock'
        WHEN i.available_boxes <= i.reorder_point THEN 'critical'
        WHEN i.available_boxes <= i.reorder_point * 2 THEN 'low'
        ELSE 'ok'
      END AS stock_status,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS image
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
    ORDER BY i.available_boxes ASC
  `);

  res.json(result.rows);
});

// GET /api/inventory/:productId
const getProductInventory = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const [inv, logs] = await Promise.all([
    query(`
      SELECT i.*, p.name, p.sku FROM inventory i
      JOIN products p ON p.id = i.product_id
      WHERE i.product_id = $1
    `, [productId]),
    query(`
      SELECT il.*, u.name AS changed_by_name
      FROM inventory_logs il
      LEFT JOIN users u ON u.id = il.changed_by
      WHERE il.product_id = $1
      ORDER BY il.created_at DESC
      LIMIT 50
    `, [productId]),
  ]);

  if (inv.rows.length === 0) return res.status(404).json({ error: 'Inventory record not found' });

  res.json({ inventory: inv.rows[0], logs: logs.rows });
});

// POST /api/inventory/adjust
const adjustStock = asyncHandler(async (req, res) => {
  const { product_id, quantity_change, reason, note } = req.body;

  if (quantity_change === 0) {
    return res.status(400).json({ error: 'Quantity change cannot be zero' });
  }

  const result = await withTransaction(async (client) => {
    // Lock the inventory row
    const inv = await client.query(
      'SELECT available_boxes FROM inventory WHERE product_id = $1 FOR UPDATE',
      [product_id]
    );

    if (inv.rows.length === 0) {
      throw Object.assign(new Error('Inventory record not found'), { status: 404 });
    }

    const newStock = inv.rows[0].available_boxes + quantity_change;
    if (newStock < 0) {
      throw Object.assign(
        new Error(`Insufficient stock. Available: ${inv.rows[0].available_boxes} boxes`),
        { status: 400 }
      );
    }

    await client.query(
      `UPDATE inventory
       SET available_boxes = $1,
           last_restocked_at = CASE WHEN $2 > 0 THEN NOW() ELSE last_restocked_at END
       WHERE product_id = $3`,
      [newStock, quantity_change, product_id]
    );

    await client.query(
      `INSERT INTO inventory_logs (product_id, changed_by, quantity_change, reason, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [product_id, req.user.id, quantity_change, reason, note]
    );

    return newStock;
  });

  res.json({ message: 'Stock adjusted successfully', new_stock: result });
});

// POST /api/inventory/restock
const restock = asyncHandler(async (req, res) => {
  const { product_id, quantity, note } = req.body;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE inventory
       SET available_boxes = available_boxes + $1,
           last_restocked_at = NOW()
       WHERE product_id = $2`,
      [quantity, product_id]
    );

    await client.query(
      `INSERT INTO inventory_logs (product_id, changed_by, quantity_change, reason, note)
       VALUES ($1, $2, $3, 'purchase', $4)`,
      [product_id, req.user.id, quantity, note || `Restock: +${quantity} boxes`]
    );
  });

  res.json({ message: `Restocked ${quantity} boxes successfully` });
});

// GET /api/inventory/alerts
const getLowStockAlerts = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      p.id, p.name, p.sku, c.name AS category,
      i.available_boxes, i.reorder_point,
      CASE
        WHEN i.available_boxes <= 0 THEN 'out_of_stock'
        WHEN i.available_boxes <= i.reorder_point THEN 'critical'
        ELSE 'low'
      END AS alert_level
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
      AND i.available_boxes <= i.reorder_point * 2
    ORDER BY i.available_boxes ASC
  `);

  res.json(result.rows);
});

// PUT /api/inventory/:productId/settings
const updateSettings = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { reorder_point, max_stock, warehouse_location } = req.body;

  await query(
    `UPDATE inventory
     SET reorder_point = COALESCE($1, reorder_point),
         max_stock = COALESCE($2, max_stock),
         warehouse_location = COALESCE($3, warehouse_location)
     WHERE product_id = $4`,
    [reorder_point, max_stock, warehouse_location, productId]
  );

  res.json({ message: 'Inventory settings updated' });
});

module.exports = { getInventory, getProductInventory, adjustStock, restock, getLowStockAlerts, updateSettings };
