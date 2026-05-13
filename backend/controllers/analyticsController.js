const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/analytics/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [revenue, orders, lowStock, pending, topProducts, recentOrders, monthlyRevenue] = await Promise.all([
    // Total revenue this month
    query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM invoices
      WHERE payment_status IN ('paid', 'partial')
        AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `),
    // Orders this month
    query(`
      SELECT COUNT(*) AS total
      FROM orders
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
    `),
    // Low stock count
    query(`
      SELECT COUNT(*) AS total
      FROM inventory
      WHERE available_boxes <= reorder_point
    `),
    // Pending shipments
    query(`SELECT COUNT(*) AS total FROM shipments WHERE status = 'pending'`),
    // Top 5 products by quantity sold
    query(`
      SELECT p.name, p.sku, SUM(oi.quantity_boxes) AS total_sold
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
        AND o.created_at > NOW() - INTERVAL '30 days'
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_sold DESC
      LIMIT 5
    `),
    // Recent orders
    query(`
      SELECT o.order_number, o.total_amount, o.status, o.created_at,
             u.name AS customer_name
      FROM orders o
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY o.created_at DESC
      LIMIT 8
    `),
    // Monthly revenue (last 6 months)
    query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
        DATE_TRUNC('month', created_at) AS month_date,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM invoices
      WHERE created_at > NOW() - INTERVAL '6 months'
        AND payment_status IN ('paid', 'partial')
      GROUP BY month, month_date
      ORDER BY month_date
    `),
  ]);

  res.json({
    summary: {
      monthly_revenue: parseFloat(revenue.rows[0].total),
      monthly_orders: parseInt(orders.rows[0].total),
      low_stock_alerts: parseInt(lowStock.rows[0].total),
      pending_shipments: parseInt(pending.rows[0].total),
    },
    top_products: topProducts.rows,
    recent_orders: recentOrders.rows,
    monthly_revenue: monthlyRevenue.rows,
  });
});

// GET /api/analytics/stock-report
const getStockReport = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      c.name AS category,
      COUNT(p.id) AS product_count,
      SUM(i.available_boxes) AS total_available,
      SUM(i.reserved_boxes) AS total_reserved,
      SUM(i.delivered_boxes) AS total_delivered,
      SUM(i.available_boxes * p.price_per_sqft * COALESCE(p.sqft_per_box, 10)) AS stock_value
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
    GROUP BY c.name
    ORDER BY total_available DESC
  `);

  res.json(result.rows);
});

// GET /api/analytics/sales-report?from=&to=
const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const start = from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const end = to || new Date().toISOString().split('T')[0];

  const [sales, byCategory, byProduct] = await Promise.all([
    query(`
      SELECT
        DATE(o.created_at) AS date,
        COUNT(o.id) AS orders,
        SUM(o.total_amount) AS revenue
      FROM orders o
      WHERE o.created_at BETWEEN $1 AND $2::date + 1
        AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date
    `, [start, end]),
    query(`
      SELECT c.name AS category, SUM(oi.quantity_boxes) AS boxes_sold,
             SUM(oi.total_amount) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN $1 AND $2::date + 1
        AND o.status != 'cancelled'
      GROUP BY c.name ORDER BY revenue DESC
    `, [start, end]),
    query(`
      SELECT p.name, p.sku, SUM(oi.quantity_boxes) AS boxes_sold,
             SUM(oi.total_amount) AS revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN $1 AND $2::date + 1
        AND o.status != 'cancelled'
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC LIMIT 10
    `, [start, end]),
  ]);

  res.json({
    period: { from: start, to: end },
    daily_sales: sales.rows,
    by_category: byCategory.rows,
    top_products: byProduct.rows,
  });
});

module.exports = { getDashboard, getStockReport, getSalesReport };
