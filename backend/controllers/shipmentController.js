const QRCode = require('qrcode');
const { query, withTransaction } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');

const generateShipmentNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM shipments');
  const num = parseInt(result.rows[0].count) + 1;
  return `SHP-${String(num).padStart(5, '0')}`;
};

// GET /api/shipments
const getShipments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];
  let p = 1;

  if (status) { conditions.push(`s.status = $${p++}`); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const result = await query(`
    SELECT
      s.*,
      u1.name AS created_by_name,
      u2.name AS dispatched_by_name,
      json_agg(
        json_build_object(
          'product_id', si.product_id,
          'product_name', p.name,
          'sku', p.sku,
          'quantity_boxes', si.quantity_boxes,
          'dispatched_boxes', si.dispatched_boxes
        )
      ) AS items
    FROM shipments s
    LEFT JOIN users u1 ON u1.id = s.created_by
    LEFT JOIN users u2 ON u2.id = s.dispatched_by
    LEFT JOIN shipment_items si ON si.shipment_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    ${where}
    GROUP BY s.id, u1.name, u2.name
    ORDER BY s.created_at DESC
    LIMIT $${p++} OFFSET $${p++}
  `, params);

  res.json(result.rows);
});

// GET /api/shipments/:id
const getShipment = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      s.*,
      u1.name AS created_by_name,
      json_agg(
        json_build_object(
          'product_id', si.product_id,
          'product_name', p.name,
          'sku', p.sku,
          'price_per_sqft', p.price_per_sqft,
          'sqft_per_box', p.sqft_per_box,
          'quantity_boxes', si.quantity_boxes,
          'dispatched_boxes', si.dispatched_boxes
        )
      ) AS items
    FROM shipments s
    LEFT JOIN users u1 ON u1.id = s.created_by
    LEFT JOIN shipment_items si ON si.shipment_id = s.id
    LEFT JOIN products p ON p.id = si.product_id
    WHERE s.id = $1
    GROUP BY s.id, u1.name
  `, [req.params.id]);

  if (result.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });
  res.json(result.rows[0]);
});

// POST /api/shipments
const createShipment = asyncHandler(async (req, res) => {
  const { order_id, customer_name, delivery_address, items, driver_name, vehicle_number, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Shipment must have at least one item' });
  }

  const shipment = await withTransaction(async (client) => {
    const shipmentNumber = await generateShipmentNumber();

    // Check stock availability for all items
    for (const item of items) {
      const inv = await client.query(
        'SELECT available_boxes, reserved_boxes FROM inventory WHERE product_id = $1 FOR UPDATE',
        [item.product_id]
      );

      if (inv.rows.length === 0 || inv.rows[0].available_boxes < item.quantity_boxes) {
        const available = inv.rows[0]?.available_boxes || 0;
        throw Object.assign(
          new Error(`Insufficient stock for product ${item.product_id}. Available: ${available}`),
          { status: 400 }
        );
      }

      // Reserve stock
      await client.query(
        `UPDATE inventory
         SET available_boxes = available_boxes - $1,
             reserved_boxes = reserved_boxes + $1
         WHERE product_id = $2`,
        [item.quantity_boxes, item.product_id]
      );
    }

    // Build QR code data
    const qrData = JSON.stringify({
      shipment_number: shipmentNumber,
      items: items.map(i => ({ product_id: i.product_id, qty: i.quantity_boxes })),
      created_at: new Date().toISOString(),
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
    });

    // Insert shipment
    const s = await client.query(`
      INSERT INTO shipments (
        shipment_number, order_id, created_by, customer_name,
        delivery_address, driver_name, vehicle_number,
        qr_code_data, qr_code_url, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [shipmentNumber, order_id, req.user.id, customer_name,
        delivery_address, driver_name, vehicle_number, qrData, qrCodeUrl, notes]);

    // Insert shipment items
    for (const item of items) {
      await client.query(
        `INSERT INTO shipment_items (shipment_id, product_id, quantity_boxes)
         VALUES ($1, $2, $3)`,
        [s.rows[0].id, item.product_id, item.quantity_boxes]
      );
    }

    return s.rows[0];
  });

  res.status(201).json(shipment);
});

// POST /api/shipments/:id/dispatch  (QR scan triggers this)
const dispatchShipment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { qr_code_data } = req.body; // QR scan result

  const shipResult = await query('SELECT * FROM shipments WHERE id = $1', [id]);
  if (shipResult.rows.length === 0) return res.status(404).json({ error: 'Shipment not found' });

  const shipment = shipResult.rows[0];

  if (shipment.status !== 'pending' && shipment.status !== 'ready') {
    return res.status(400).json({ error: `Cannot dispatch shipment with status: ${shipment.status}` });
  }

  // Optionally validate QR data matches
  if (qr_code_data && shipment.qr_code_data !== qr_code_data) {
    return res.status(400).json({ error: 'QR code mismatch. Scan the correct shipment QR.' });
  }

  await withTransaction(async (client) => {
    // Get shipment items
    const items = await client.query(
      'SELECT * FROM shipment_items WHERE shipment_id = $1',
      [id]
    );

    for (const item of items.rows) {
      // Deduct from reserved, add to delivered
      await client.query(
        `UPDATE inventory
         SET reserved_boxes = reserved_boxes - $1,
             delivered_boxes = delivered_boxes + $1
         WHERE product_id = $2`,
        [item.quantity_boxes, item.product_id]
      );

      // Log the deduction
      await client.query(
        `INSERT INTO inventory_logs (product_id, changed_by, quantity_change, reason, reference_id, note)
         VALUES ($1, $2, $3, 'sale', $4, $5)`,
        [item.product_id, req.user.id, -item.quantity_boxes, shipment.shipment_number,
         `Dispatched via QR scan — ${shipment.customer_name}`]
      );

      await client.query(
        'UPDATE shipment_items SET dispatched_boxes = $1 WHERE id = $2',
        [item.quantity_boxes, item.id]
      );
    }

    // Update shipment status
    await client.query(
      `UPDATE shipments
       SET status = 'dispatched', dispatched_by = $1, dispatched_at = NOW()
       WHERE id = $2`,
      [req.user.id, id]
    );
  });

  // Fetch updated shipment
  const updated = await query('SELECT * FROM shipments WHERE id = $1', [id]);
  res.json({ message: 'Shipment dispatched. Inventory updated.', shipment: updated.rows[0] });
});

// POST /api/shipments/scan — scan QR code, find and dispatch shipment
const scanQR = asyncHandler(async (req, res) => {
  const { qr_data } = req.body;

  let parsed;
  try {
    parsed = JSON.parse(qr_data);
  } catch {
    return res.status(400).json({ error: 'Invalid QR code format' });
  }

  const result = await query(
    'SELECT * FROM shipments WHERE shipment_number = $1',
    [parsed.shipment_number]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Shipment not found for this QR code' });
  }

  const shipment = result.rows[0];

  if (shipment.status === 'dispatched') {
    return res.status(200).json({
      message: 'This shipment was already dispatched',
      shipment,
      already_dispatched: true,
    });
  }

  req.params.id = shipment.id;
  req.body.qr_code_data = shipment.qr_code_data;
  return dispatchShipment(req, res);
});

// PUT /api/shipments/:id/deliver
const markDelivered = asyncHandler(async (req, res) => {
  await query(
    `UPDATE shipments SET status = 'delivered', delivered_at = NOW() WHERE id = $1`,
    [req.params.id]
  );
  res.json({ message: 'Shipment marked as delivered' });
});

module.exports = { getShipments, getShipment, createShipment, dispatchShipment, scanQR, markDelivered };
