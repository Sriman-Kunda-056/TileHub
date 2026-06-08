const PDFDocument = require('pdfkit');
const { query, withTransaction } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');

const GST_RATE = parseFloat(process.env.GST_RATE || '0.18');

const generateInvoiceNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM invoices');
  const num = parseInt(result.rows[0].count) + 1;
  const year = new Date().getFullYear();
  return `INV-${year}-${String(num).padStart(5, '0')}`;
};

// GET /api/billing/invoices
const getInvoices = asyncHandler(async (req, res) => {
  const { payment_status, page = 1, limit = 20 } = req.query;
  const params = [];
  const conditions = [];
  let p = 1;

  if (payment_status) { conditions.push(`i.payment_status = $${p++}`); params.push(payment_status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const result = await query(`
    SELECT
      i.*,
      c.company_name, u.name AS customer_name, u.phone AS customer_phone
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN users u ON u.id = c.user_id
    ${where}
    ORDER BY i.created_at DESC
    LIMIT $${p++} OFFSET $${p++}
  `, params);

  res.json(result.rows);
});

// GET /api/billing/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
  const [invoice, payments, order] = await Promise.all([
    query(`
      SELECT i.*, c.company_name, c.gst_number, c.billing_address,
             u.name AS customer_name, u.phone AS customer_phone, u.email AS customer_email
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN users u ON u.id = c.user_id
      WHERE i.id = $1
    `, [req.params.id]),
    query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY paid_at', [req.params.id]),
    query(`
      SELECT oi.*, p.name AS product_name, p.sku
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.id = (SELECT order_id FROM invoices WHERE id = $1)
    `, [req.params.id]),
  ]);

  if (invoice.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
  res.json({ ...invoice.rows[0], payments: payments.rows, items: order.rows });
});

// POST /api/billing/invoices
const createInvoice = asyncHandler(async (req, res) => {
  const { order_id, customer_id, due_days = 30, notes } = req.body;

  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [order_id]);
  if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

  const ord = orderResult.rows[0];
  const invoiceNumber = await generateInvoiceNumber();
  const dueDate = new Date(Date.now() + due_days * 24 * 60 * 60 * 1000);

  // Split GST: CGST + SGST for same-state, IGST for interstate
  const subtotal = parseFloat(ord.subtotal);
  const cgst = Math.round(subtotal * (GST_RATE / 2) * 100) / 100;
  const sgst = Math.round(subtotal * (GST_RATE / 2) * 100) / 100;
  const total = subtotal + cgst + sgst;

  const result = await query(`
    INSERT INTO invoices (
      invoice_number, order_id, customer_id, invoice_date, due_date,
      subtotal, cgst_amount, sgst_amount, total_amount, notes
    ) VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `, [invoiceNumber, order_id, customer_id, dueDate, subtotal, cgst, sgst, total, notes]);

  // Update order payment status
  await query("UPDATE orders SET payment_status = 'pending' WHERE id = $1", [order_id]);

  res.status(201).json(result.rows[0]);
});

// POST /api/billing/invoices/:id/payment
const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, payment_mode, transaction_ref, notes } = req.body;

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO payments (invoice_id, amount, payment_mode, transaction_ref, recorded_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, amount, payment_mode, transaction_ref, req.user.id, notes]
    );

    // Update invoice amount_paid and payment_status
    const inv = await client.query(
      'SELECT total_amount, amount_paid FROM invoices WHERE id = $1',
      [id]
    );

    const newPaid = parseFloat(inv.rows[0].amount_paid) + parseFloat(amount);
    const total = parseFloat(inv.rows[0].total_amount);
    const status = newPaid >= total ? 'paid' : newPaid > 0 ? 'partial' : 'pending';

    await client.query(
      'UPDATE invoices SET amount_paid = $1, payment_status = $2 WHERE id = $3',
      [newPaid, status, id]
    );
  });

  res.json({ message: 'Payment recorded successfully' });
});

// GET /api/billing/invoices/:id/pdf — generate PDF invoice
const generatePDF = asyncHandler(async (req, res) => {
  const invResult = await query(`
    SELECT i.*, c.company_name, c.gst_number, c.billing_address,
           u.name AS customer_name, u.phone AS customer_phone
    FROM invoices i
    LEFT JOIN customers c ON c.id = i.customer_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE i.id = $1
  `, [req.params.id]);

  if (invResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

  const items = await query(`
    SELECT oi.*, p.name AS product_name, p.sku
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.id = $1
  `, [invResult.rows[0].order_id]);

  const inv = invResult.rows[0];
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${inv.invoice_number}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(22).font('Helvetica-Bold').text(process.env.BUSINESS_NAME, 50, 50);
  doc.fontSize(10).font('Helvetica').text(process.env.BUSINESS_ADDRESS, 50, 80);
  doc.text(`GST: ${process.env.BUSINESS_GST} | Ph: ${process.env.BUSINESS_PHONE}`, 50, 95);

  doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').text(`Invoice #: ${inv.invoice_number}`, 400, 80, { align: 'right' });
  doc.text(`Date: ${new Date(inv.invoice_date).toLocaleDateString('en-IN')}`, 400, 95, { align: 'right' });
  doc.text(`Due: ${new Date(inv.due_date).toLocaleDateString('en-IN')}`, 400, 110, { align: 'right' });

  doc.moveTo(50, 130).lineTo(550, 130).stroke();

  // Bill to
  doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50, 145);
  doc.font('Helvetica').text(inv.customer_name || inv.company_name, 50, 160);
  if (inv.gst_number) doc.text(`GST: ${inv.gst_number}`, 50, 175);
  if (inv.billing_address) doc.text(inv.billing_address, 50, 190);
  doc.text(`Ph: ${inv.customer_phone}`, 50, 205);

  // Items table
  let y = 240;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Product', 50, y);
  doc.text('SKU', 200, y);
  doc.text('Qty (boxes)', 280, y);
  doc.text('Rate/sqft', 370, y);
  doc.text('Amount', 460, y);
  y += 15;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 8;

  doc.font('Helvetica').fontSize(9);
  for (const item of items.rows) {
    doc.text(item.product_name, 50, y, { width: 140 });
    doc.text(item.sku, 200, y);
    doc.text(item.quantity_boxes.toString(), 280, y);
    doc.text(`₹${item.price_per_sqft}`, 370, y);
    doc.text(`₹${parseInt(item.total_amount).toLocaleString('en-IN')}`, 460, y);
    y += 20;
  }

  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;

  // Totals
  doc.text(`Subtotal:`, 370, y); doc.text(`₹${parseInt(inv.subtotal).toLocaleString('en-IN')}`, 460, y); y += 15;
  doc.text(`CGST (9%):`, 370, y); doc.text(`₹${parseInt(inv.cgst_amount).toLocaleString('en-IN')}`, 460, y); y += 15;
  doc.text(`SGST (9%):`, 370, y); doc.text(`₹${parseInt(inv.sgst_amount).toLocaleString('en-IN')}`, 460, y); y += 15;
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(`TOTAL:`, 370, y); doc.text(`₹${parseInt(inv.total_amount).toLocaleString('en-IN')}`, 460, y); y += 25;

  doc.font('Helvetica').fontSize(9);
  doc.text(`Amount Paid: ₹${parseInt(inv.amount_paid || 0).toLocaleString('en-IN')}`, 370, y);
  const balance = parseInt(inv.total_amount) - parseInt(inv.amount_paid || 0);
  if (balance > 0) doc.text(`Balance Due: ₹${balance.toLocaleString('en-IN')}`, 370, y + 15);

  doc.end();
});

// POST /api/billing/boq — Bill of Quantity generator
const generateBOQ = asyncHandler(async (req, res) => {
  const { customer_name, phone, rooms } = req.body;

  if (!rooms || rooms.length === 0) {
    return res.status(400).json({ error: 'At least one room is required' });
  }

  const results = [];
  let totalArea = 0;
  let totalBoxes = 0;
  let totalCost = 0;

  for (const room of rooms) {
    const { name, length_m, width_m, product_id, wastage_pct = 10 } = room;
    const area = parseFloat(length_m) * parseFloat(width_m);
    const areaWithWastage = area * (1 + wastage_pct / 100);
    const areaInSqft = areaWithWastage * 10.764;

    const product = await query(
      'SELECT name, sku, price_per_sqft, sqft_per_box, tiles_per_box FROM products WHERE id = $1',
      [product_id]
    );

    if (product.rows.length === 0) continue;
    const p = product.rows[0];
    const sqftPerBox = p.sqft_per_box || 10;
    const boxes = Math.ceil(areaInSqft / sqftPerBox);
    const cost = boxes * sqftPerBox * p.price_per_sqft;

    totalArea += area;
    totalBoxes += boxes;
    totalCost += cost;

    results.push({
      room: name,
      area_sqm: area.toFixed(2),
      area_sqft: areaWithWastage.toFixed(2),
      wastage_pct,
      product: p.name,
      sku: p.sku,
      price_per_sqft: p.price_per_sqft,
      boxes_required: boxes,
      estimated_cost: Math.round(cost),
    });
  }

  const gst = Math.round(totalCost * GST_RATE);

  // Save BOQ
  await query(
    `INSERT INTO boq_requests (customer_name, phone, rooms, total_area, total_boxes, estimated_cost)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [customer_name, phone, JSON.stringify(rooms), totalArea, totalBoxes, totalCost + gst]
  );

  res.json({
    customer_name,
    phone,
    rooms: results,
    summary: {
      total_area_sqm: totalArea.toFixed(2),
      total_boxes: totalBoxes,
      subtotal: Math.round(totalCost),
      gst: gst,
      grand_total: Math.round(totalCost + gst),
    },
  });
});

module.exports = { getInvoices, getInvoice, createInvoice, recordPayment, generatePDF, generateBOQ };
