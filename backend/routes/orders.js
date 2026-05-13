const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { query, withTransaction } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

const generateOrderNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM orders');
  const num = parseInt(result.rows[0].count) + 1;
  return `ORD-${new Date().getFullYear()}-${String(num).padStart(5,'0')}`;
};

const generateShipmentNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM shipments');
  const num = parseInt(result.rows[0].count) + 1;
  return `SHP-${String(num).padStart(5,'0')}`;
};

// Auto-create shipment + reserve stock when order is confirmed
const autoCreateShipment = async (client, order, items, createdBy) => {
  const shipmentNumber = await generateShipmentNumber();

  const qrPayload = JSON.stringify({
    shipment_number: shipmentNumber,
    order_id: order.id,
    items: items.map(i => ({ product_id: i.product_id, qty: i.quantity_boxes })),
    created_at: new Date().toISOString(),
  });

  const qrCodeUrl = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H', width: 400, margin: 2 });

  // Reserve stock
  for (const item of items) {
    const inv = await client.query(
      'SELECT available_boxes FROM inventory WHERE product_id = $1 FOR UPDATE',
      [item.product_id]
    );
    const available = inv.rows[0]?.available_boxes || 0;
    if (available < item.quantity_boxes) {
      throw Object.assign(
        new Error(`Insufficient stock for "${item.product_name}". Available: ${available}, Required: ${item.quantity_boxes}`),
        { status: 400 }
      );
    }
    await client.query(
      'UPDATE inventory SET available_boxes = available_boxes - $1, reserved_boxes = reserved_boxes + $1 WHERE product_id = $2',
      [item.quantity_boxes, item.product_id]
    );
    await client.query(
      `INSERT INTO inventory_logs (product_id, changed_by, quantity_change, reason, reference_id, note)
       VALUES ($1,$2,$3,'sale',$4,$5)`,
      [item.product_id, createdBy, -item.quantity_boxes, shipmentNumber, `Reserved for shipment ${shipmentNumber}`]
    );
  }

  // Create shipment
  const shipResult = await client.query(
    `INSERT INTO shipments (shipment_number, order_id, created_by, customer_name, delivery_address, status, qr_code_data, qr_code_url)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7) RETURNING *`,
    [shipmentNumber, order.id, createdBy, order.customer_name || 'Customer', order.delivery_address || '', qrPayload, qrCodeUrl]
  );

  const shipment = shipResult.rows[0];

  for (const item of items) {
    await client.query(
      'INSERT INTO shipment_items (shipment_id, product_id, quantity_boxes) VALUES ($1,$2,$3)',
      [shipment.id, item.product_id, item.quantity_boxes]
    );
  }

  return shipment;
};

// GET /api/orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  let p = 1;
  if (status) { conditions.push(`o.status = $${p++}`); params.push(status); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  params.push(limit, offset);
  const result = await query(`
    SELECT o.*, u.name AS customer_name, u.phone AS customer_phone,
      (SELECT shipment_number FROM shipments WHERE order_id = o.id LIMIT 1) AS shipment_number,
      (SELECT status FROM shipments WHERE order_id = o.id LIMIT 1) AS shipment_status
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN users u ON u.id = c.user_id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT $${p++} OFFSET $${p++}
  `, params);
  res.json(result.rows);
}));

// GET /api/orders/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const [order, items, shipment] = await Promise.all([
    query(`SELECT o.*, u.name AS customer_name FROM orders o LEFT JOIN customers c ON c.id = o.customer_id LEFT JOIN users u ON u.id = c.user_id WHERE o.id = $1`, [req.params.id]),
    query(`SELECT oi.*, p.name AS product_name, p.sku FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`, [req.params.id]),
    query(`SELECT id, shipment_number, status, qr_code_url, dispatched_at FROM shipments WHERE order_id = $1 LIMIT 1`, [req.params.id]),
  ]);
  if (!order.rows[0]) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order.rows[0], items: items.rows, shipment: shipment.rows[0] || null });
}));

// POST /api/orders
router.post('/', authenticate, authorize('admin', 'sales'), asyncHandler(async (req, res) => {
  const { customer_id, items, notes, delivery_address, delivery_date } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Order must have at least one item' });
  const orderNumber = await generateOrderNumber();
  const order = await withTransaction(async (client) => {
    let subtotal = 0;
    for (const item of items) {
      const p = await client.query('SELECT price_per_sqft, sqft_per_box, name FROM products WHERE id = $1', [item.product_id]);
      if (!p.rows[0]) throw new Error(`Product ${item.product_id} not found`);
      const sqft = item.quantity_boxes * (p.rows[0].sqft_per_box || 10);
      item._total = sqft * p.rows[0].price_per_sqft;
      item._sqft = sqft;
      item._price = p.rows[0].price_per_sqft;
      item._sqft_per_box = p.rows[0].sqft_per_box || 10;
      item.product_name = p.rows[0].name;
      subtotal += item._total;
    }
    const gst = subtotal * parseFloat(process.env.GST_RATE || 0.18);
    const total = subtotal + gst;
    const ord = await client.query(
      `INSERT INTO orders (order_number, customer_id, created_by, subtotal, gst_amount, total_amount, notes, delivery_address, delivery_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [orderNumber, customer_id, req.user.id, subtotal, gst, total, notes, delivery_address, delivery_date]
    );
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity_boxes, sqft_per_box, price_per_sqft, total_sqft, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [ord.rows[0].id, item.product_id, item.quantity_boxes, item._sqft_per_box, item._price, item._sqft, item._total]
      );
    }
    return ord.rows[0];
  });
  res.status(201).json(order);
}));

// PUT /api/orders/:id/status  — auto-creates shipment on confirm
router.put('/:id/status', authenticate, authorize('admin', 'sales'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const orderResult = await query(`
    SELECT o.*, u.name AS customer_name
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE o.id = $1
  `, [id]);

  if (!orderResult.rows[0]) return res.status(404).json({ error: 'Order not found' });
  const order = orderResult.rows[0];

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot change a cancelled order' });
  }

  let shipment = null;

  // Auto-create shipment when confirming for the first time
  if (status === 'confirmed' && order.status === 'draft') {
    const existing = await query('SELECT id FROM shipments WHERE order_id = $1 LIMIT 1', [id]);

    if (existing.rows.length === 0) {
      const itemsResult = await query(
        `SELECT oi.*, p.name AS product_name FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = $1`,
        [id]
      );
      if (!itemsResult.rows.length) return res.status(400).json({ error: 'Order has no items' });

      shipment = await withTransaction(async (client) => {
        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
        return autoCreateShipment(client, order, itemsResult.rows, req.user.id);
      });
    } else {
      await query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    }
  } else {
    // Any other status change (processing, dispatched, delivered, cancelled)
    await withTransaction(async (client) => {
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

      // If cancelling — release reserved stock
      if (status === 'cancelled') {
        const pendingShipments = await client.query(
          "SELECT id FROM shipments WHERE order_id = $1 AND status = 'pending'", [id]
        );
        for (const s of pendingShipments.rows) {
          const sItems = await client.query('SELECT product_id, quantity_boxes FROM shipment_items WHERE shipment_id = $1', [s.id]);
          for (const item of sItems.rows) {
            await client.query(
              'UPDATE inventory SET available_boxes = available_boxes + $1, reserved_boxes = reserved_boxes - $1 WHERE product_id = $2',
              [item.quantity_boxes, item.product_id]
            );
          }
          await client.query("UPDATE shipments SET status = 'returned' WHERE id = $1", [s.id]);
        }
      }
    });
  }

  const updated = await query('SELECT * FROM orders WHERE id = $1', [id]);
  const linkedShipment = shipment || (await query('SELECT shipment_number, status FROM shipments WHERE order_id = $1 LIMIT 1', [id])).rows[0];

  res.json({
    order: updated.rows[0],
    shipment: linkedShipment || null,
    message: shipment
      ? `Order confirmed. Shipment ${shipment.shipment_number} created automatically with QR code — ready for warehouse.`
      : status === 'cancelled'
        ? 'Order cancelled. Reserved stock has been released.'
        : `Order status updated to "${status}".`,
  });
}));

module.exports = router;