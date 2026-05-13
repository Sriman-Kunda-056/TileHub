const { query } = require('../models/db');
const { asyncHandler } = require('../middleware/errorHandler');
const cloudinary = require('../utils/cloudinary');

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    category, finish, material, room_type, color_family,
    min_price, max_price, search, featured,
    page = 1, limit = 20, sort = 'created_at', order = 'DESC',
  } = req.query;

  const conditions = ['p.is_active = TRUE'];
  const params = [];
  let p = 1;

  if (category) { conditions.push(`c.slug = $${p++}`); params.push(category); }
  if (finish) { conditions.push(`p.finish ILIKE $${p++}`); params.push(`%${finish}%`); }
  if (material) { conditions.push(`p.material ILIKE $${p++}`); params.push(`%${material}%`); }
  if (room_type) { conditions.push(`p.room_type ILIKE $${p++}`); params.push(`%${room_type}%`); }
  if (color_family) { conditions.push(`p.color_family ILIKE $${p++}`); params.push(`%${color_family}%`); }
  if (min_price) { conditions.push(`p.price_per_sqft >= $${p++}`); params.push(min_price); }
  if (max_price) { conditions.push(`p.price_per_sqft <= $${p++}`); params.push(max_price); }
  if (featured === 'true') { conditions.push(`p.is_featured = TRUE`); }
  if (search) {
    conditions.push(`(p.name ILIKE $${p} OR p.sku ILIKE $${p} OR p.description ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const allowedSorts = ['created_at', 'price_per_sqft', 'name'];
  const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';

  const sql = `
    SELECT
      p.*, c.name AS category_name, c.slug AS category_slug,
      i.available_boxes, i.reserved_boxes,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN inventory i ON i.product_id = p.id
    ${where}
    ORDER BY p.${safeSort} ${order === 'ASC' ? 'ASC' : 'DESC'}
    LIMIT $${p++} OFFSET $${p++}
  `;
  params.push(limit, offset);

  const countSql = `
    SELECT COUNT(*) FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
  `;

  const [products, countResult] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);

  res.json({
    products: products.rows,
    total: parseInt(countResult.rows[0].count),
    page: parseInt(page),
    pages: Math.ceil(countResult.rows[0].count / limit),
  });
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [product, images, videos] = await Promise.all([
    query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
        i.available_boxes, i.reserved_boxes, i.warehouse_location
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      WHERE p.id = $1 AND p.is_active = TRUE
    `, [id]),
    query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order', [id]),
    query('SELECT * FROM product_videos WHERE product_id = $1', [id]),
  ]);

  if (product.rows.length === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Similar products
  const similar = await query(`
    SELECT p.id, p.name, p.sku, p.price_per_sqft, p.finish,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) AS primary_image
    FROM products p
    WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = TRUE
    LIMIT 4
  `, [product.rows[0].category_id, id]);

  res.json({
    ...product.rows[0],
    images: images.rows,
    videos: videos.rows,
    similar_products: similar.rows,
  });
});

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  const {
    sku, name, description, category_id,
    width_cm, height_cm, thickness_mm,
    finish, material, color_family, room_type,
    price_per_sqft, tiles_per_box = 10, sqft_per_box,
    weight_kg, brand, is_featured = false,
    initial_stock = 0, warehouse_location,
  } = req.body;

  const existing = await query('SELECT id FROM products WHERE sku = $1', [sku]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'SKU already exists' });
  }

  const result = await query(`
    INSERT INTO products (
      sku, name, description, category_id,
      width_cm, height_cm, thickness_mm,
      finish, material, color_family, room_type,
      price_per_sqft, tiles_per_box, sqft_per_box,
      weight_kg, brand, is_featured
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *
  `, [sku, name, description, category_id, width_cm, height_cm, thickness_mm,
      finish, material, color_family, room_type, price_per_sqft, tiles_per_box,
      sqft_per_box, weight_kg, brand, is_featured]);

  const product = result.rows[0];

  // Initialize inventory
  await query(`
    INSERT INTO inventory (product_id, available_boxes, warehouse_location)
    VALUES ($1, $2, $3)
  `, [product.id, initial_stock, warehouse_location]);

  res.status(201).json(product);
});

// PUT /api/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  delete fields.id;

  const allowed = ['name', 'description', 'category_id', 'width_cm', 'height_cm',
    'thickness_mm', 'finish', 'material', 'color_family', 'room_type',
    'price_per_sqft', 'tiles_per_box', 'sqft_per_box', 'weight_kg',
    'brand', 'is_featured', 'is_active'];

  const updates = [];
  const values = [];
  let p = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = $${p++}`);
      values.push(val);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(id);
  const result = await query(
    `UPDATE products SET ${updates.join(', ')} WHERE id = $${p} RETURNING *`,
    values
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(result.rows[0]);
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  await query('UPDATE products SET is_active = FALSE WHERE id = $1', [req.params.id]);
  res.json({ message: 'Product deactivated successfully' });
});

// POST /api/products/:id/images
const uploadImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_primary = false } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }

  const images = await Promise.all(
    req.files.map(async (file, index) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `tilehub/products/${id}`,
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto' }],
      });

      const img = await query(`
        INSERT INTO product_images (product_id, url, cloudinary_public_id, is_primary, sort_order)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `, [id, result.secure_url, result.public_id, index === 0 && is_primary, index]);

      return img.rows[0];
    })
  );

  res.status(201).json(images);
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, uploadImages };
