-- TileHub Pro — Seed Data
-- Run AFTER schema.sql: psql -U postgres -d tilehub -f seed.sql

-- ─── ADMIN USER ──────────────────────────────────────────────────────────────
-- Password: Admin@1234 (bcrypt hash)
INSERT INTO users (id, name, email, phone, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User',      'admin@tilehub.com',     '+919876543210', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Sales Manager',   'sales@tilehub.com',     '+919876543211', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'sales'),
  ('00000000-0000-0000-0000-000000000003', 'Warehouse Staff', 'warehouse@tilehub.com', '+919876543212', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'warehouse'),
  ('00000000-0000-0000-0000-000000000004', 'Accountant',      'accounts@tilehub.com',  '+919876543213', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'accountant'),
  ('00000000-0000-0000-0000-000000000005', 'Rahul Sharma',    'rahul@gmail.com',        '+919876500001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'customer'),
  ('00000000-0000-0000-0000-000000000006', 'Priya Builders',  'priya@pbuild.com',       '+919876500002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaBno3YHsN1KnSf4K1TGfPFSm', 'customer')
ON CONFLICT DO NOTHING;

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────
INSERT INTO customers (user_id, company_name, gst_number, billing_address, city, state, pincode) VALUES
  ('00000000-0000-0000-0000-000000000005', NULL, NULL, '12 MG Road, Bangalore', 'Bangalore', 'Karnataka', '560001'),
  ('00000000-0000-0000-0000-000000000006', 'Priya Builders Pvt Ltd', '29AABCP1234L1ZN', '45 Anna Nagar, Chennai', 'Chennai', 'Tamil Nadu', '600040')
ON CONFLICT DO NOTHING;

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
INSERT INTO products (id, sku, name, description, category_id, width_cm, height_cm, thickness_mm, finish, material, color_family, room_type, price_per_sqft, tiles_per_box, sqft_per_box, brand, is_featured) VALUES
  ('10000000-0000-0000-0000-000000000001', 'FT-001', 'Glacier White',      'Clean, bright white floor tile — perfect for modern interiors', 1, 60, 60, 10, 'Matte',     'Porcelain', 'White',  'Living Room',  45,  4,  16.15, 'CeramicPlus', TRUE),
  ('10000000-0000-0000-0000-000000000002', 'FT-002', 'Midnight Black',     'Deep black glossy tile for statement floors',                    1, 60, 60, 10, 'Glossy',    'Porcelain', 'Black',  'Living Room',  65,  4,  16.15, 'CeramicPlus', TRUE),
  ('10000000-0000-0000-0000-000000000003', 'FT-003', 'Silver Grey',        'Versatile grey tone with subtle texture',                        1, 60, 60, 10, 'Matte',     'Ceramic',   'Grey',   'Living Room',  38,  4,  16.15, 'HomeTile',    FALSE),
  ('10000000-0000-0000-0000-000000000004', 'FT-004', 'Sahara Beige',       'Warm sandy beige — earthy feel for traditional homes',           1, 60, 60, 10, 'Satin',     'Ceramic',   'Beige',  'Living Room',  42,  4,  16.15, 'HomeTile',    FALSE),
  ('10000000-0000-0000-0000-000000000005', 'WT-001', 'Ocean Blue',         'Vivid blue glossy wall tile for bathrooms and kitchens',         2, 30, 60,  8, 'Glossy',    'Ceramic',   'Blue',   'Bathroom',     38,  8,  16.15, 'AquaTile',    TRUE),
  ('10000000-0000-0000-0000-000000000006', 'WT-002', 'Terracotta Blush',   'Warm terracotta finish for kitchen feature walls',               2, 30, 60,  8, 'Matte',     'Terracotta','Orange', 'Kitchen',      52,  8,  16.15, 'EarthTone',   FALSE),
  ('10000000-0000-0000-0000-000000000007', 'WT-003', 'Arctic White',       'Pure white subway tile — timeless and versatile',                2, 10, 30,  7, 'Glossy',    'Ceramic',   'White',  'Kitchen',      28,  20, 21.53, 'HomeTile',    FALSE),
  ('10000000-0000-0000-0000-000000000008', 'BT-001', 'Pebble Grey',        'Anti-slip grey tile for bathroom floors',                        3, 20, 20,  8, 'Anti-slip', 'Porcelain', 'Grey',   'Bathroom',     42,  20, 8.61,  'AquaTile',    FALSE),
  ('10000000-0000-0000-0000-000000000009', 'BT-002', 'Misty Teal',         'Sea-green glossy bathroom wall tile',                            3, 25, 50,  8, 'Glossy',    'Ceramic',   'Green',  'Bathroom',     48,  8,  10.76, 'AquaTile',    FALSE),
  ('10000000-0000-0000-0000-000000000010', 'KT-001', 'Marble Ivory',       'Luxurious ivory marble-look tile for premium kitchens',          4, 30, 60,  8, 'Polished',  'Porcelain', 'White',  'Kitchen',      120, 6,  12.92, 'MarbleLux',   TRUE),
  ('10000000-0000-0000-0000-000000000011', 'KT-002', 'Charcoal Slate',     'Dark slate-effect kitchen floor tile',                          4, 40, 80, 10, 'Matte',     'Porcelain', 'Grey',   'Kitchen',      75,  4,  13.99, 'StoneCraft',  FALSE),
  ('10000000-0000-0000-0000-000000000012', 'PT-001', 'Sacred Beige',       'Soft matte beige — serene finish for prayer rooms',              5, 45, 45, 10, 'Matte',     'Ceramic',   'Beige',  'Prayer Room',  35,  6,  12.92, 'HomeTile',    FALSE),
  ('10000000-0000-0000-0000-000000000013', 'PT-002', 'Lotus White',        'Crisp white with subtle sheen for pooja rooms',                  5, 45, 45, 10, 'Satin',     'Ceramic',   'White',  'Prayer Room',  40,  6,  12.92, 'HomeTile',    FALSE),
  ('10000000-0000-0000-0000-000000000014', 'OT-001', 'Sage Garden',        'Rough anti-slip outdoor tile — weather resistant',               6, 40, 40, 12, 'Anti-slip', 'Porcelain', 'Green',  'Outdoor',      55,  6,  10.76, 'OutdoorPro',  FALSE),
  ('10000000-0000-0000-0000-000000000015', 'OT-002', 'Cobblestone Brown',  'Heavy-duty outdoor paving tile',                                 6, 30, 30, 15, 'Anti-slip', 'Porcelain', 'Brown',  'Outdoor',      48,  10, 9.69,  'OutdoorPro',  FALSE),
  ('10000000-0000-0000-0000-000000000016', 'DT-001', 'Mosaic Midnight',    'Decorative mosaic tile for feature walls and backsplashes',      7, 30, 30,  6, 'Glossy',    'Glass',     'Mixed',  'Living Room',  150, 4,  9.69,  'ArtTile',     TRUE),
  ('10000000-0000-0000-0000-000000000017', 'DT-002', 'Floral Cream',       '3D floral relief decorative tile',                              7, 20, 20,  8, 'Matte',     'Ceramic',   'Cream',  'Bathroom',     85,  12, 5.38,  'ArtTile',     FALSE),
  ('10000000-0000-0000-0000-000000000018', 'AC-001', 'Tile Adhesive 20kg', 'Professional grade tile adhesive — 5 sqm coverage per bag',     8, NULL, NULL, NULL, NULL,  NULL,        NULL,     NULL,           12,  1,  NULL,  'FixPro',      FALSE),
  ('10000000-0000-0000-0000-000000000019', 'AC-002', 'Tile Spacers 3mm',   '200-pack 3mm tile spacers for uniform grout lines',             8, NULL, NULL, NULL, NULL,  NULL,        NULL,     NULL,           3,   1,  NULL,  'FixPro',      FALSE),
  ('10000000-0000-0000-0000-000000000020', 'AC-003', 'Grout Powder 1kg',   'White cement-based grout, water resistant',                     8, NULL, NULL, NULL, NULL,  NULL,        NULL,     NULL,           8,   1,  NULL,  'FixPro',      FALSE)
ON CONFLICT DO NOTHING;

-- ─── INVENTORY ───────────────────────────────────────────────────────────────
INSERT INTO inventory (product_id, available_boxes, reserved_boxes, delivered_boxes, reorder_point, max_stock, warehouse_location) VALUES
  ('10000000-0000-0000-0000-000000000001', 280, 0, 120, 30, 500, 'Rack A1'),
  ('10000000-0000-0000-0000-000000000002', 150, 0,  80, 20, 300, 'Rack A2'),
  ('10000000-0000-0000-0000-000000000003', 320, 0, 200, 30, 400, 'Rack A3'),
  ('10000000-0000-0000-0000-000000000004', 180, 0,  60, 20, 300, 'Rack A4'),
  ('10000000-0000-0000-0000-000000000005', 420, 0, 180, 40, 600, 'Rack B1'),
  ('10000000-0000-0000-0000-000000000006',  95, 0,  40, 20, 200, 'Rack B2'),
  ('10000000-0000-0000-0000-000000000007', 500, 0, 300, 50, 800, 'Rack B3'),
  ('10000000-0000-0000-0000-000000000008', 340, 0, 150, 30, 500, 'Rack C1'),
  ('10000000-0000-0000-0000-000000000009', 210, 0,  90, 20, 400, 'Rack C2'),
  ('10000000-0000-0000-0000-000000000010',  75, 0,  30, 10, 150, 'Rack D1'),
  ('10000000-0000-0000-0000-000000000011', 130, 0,  50, 15, 200, 'Rack D2'),
  ('10000000-0000-0000-0000-000000000012', 200, 0,  80, 20, 350, 'Rack E1'),
  ('10000000-0000-0000-0000-000000000013', 160, 0,  60, 20, 300, 'Rack E2'),
  ('10000000-0000-0000-0000-000000000014',  18, 0,  40, 20, 200, 'Rack F1'),
  ('10000000-0000-0000-0000-000000000015',  85, 0,  30, 15, 200, 'Rack F2'),
  ('10000000-0000-0000-0000-000000000016',  40, 0,  20,  5, 100, 'Rack G1'),
  ('10000000-0000-0000-0000-000000000017',  60, 0,  25, 10, 150, 'Rack G2'),
  ('10000000-0000-0000-0000-000000000018', 200, 0, 300, 30, 500, 'Rack H1'),
  ('10000000-0000-0000-0000-000000000019', 500, 0, 400, 50, 1000,'Rack H2'),
  ('10000000-0000-0000-0000-000000000020', 180, 0, 200, 20, 400, 'Rack H3')
ON CONFLICT DO NOTHING;

-- ─── SAMPLE ORDERS ───────────────────────────────────────────────────────────
INSERT INTO orders (id, order_number, customer_id, created_by, status, payment_status, subtotal, gst_amount, total_amount, delivery_address, delivery_date)
SELECT
  '20000000-0000-0000-0000-000000000001',
  'ORD-2025-00001',
  c.id,
  '00000000-0000-0000-0000-000000000002',
  'delivered',
  'paid',
  48450,
  8721,
  57171,
  '12 MG Road, Bangalore - 560001',
  CURRENT_DATE - 5
FROM customers c JOIN users u ON u.id = c.user_id WHERE u.id = '00000000-0000-0000-0000-000000000005'
ON CONFLICT DO NOTHING;

INSERT INTO orders (id, order_number, customer_id, created_by, status, payment_status, subtotal, gst_amount, total_amount, delivery_address, delivery_date)
SELECT
  '20000000-0000-0000-0000-000000000002',
  'ORD-2025-00002',
  c.id,
  '00000000-0000-0000-0000-000000000002',
  'processing',
  'partial',
  96900,
  17442,
  114342,
  '45 Anna Nagar, Chennai - 600040',
  CURRENT_DATE + 3
FROM customers c JOIN users u ON u.id = c.user_id WHERE u.id = '00000000-0000-0000-0000-000000000006'
ON CONFLICT DO NOTHING;

-- ─── SAMPLE SHIPMENTS ────────────────────────────────────────────────────────
INSERT INTO shipments (id, shipment_number, created_by, customer_name, delivery_address, status, qr_code_data, driver_name, vehicle_number)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'SHP-00001', '00000000-0000-0000-0000-000000000002',
   'Rahul Sharma', '12 MG Road, Bangalore - 560001', 'dispatched',
   '{"shipment_number":"SHP-00001","items":[{"product_id":"10000000-0000-0000-0000-000000000001","qty":30}]}',
   'Ravi Kumar', 'KA-01-AB-5678'),
  ('30000000-0000-0000-0000-000000000002', 'SHP-00002', '00000000-0000-0000-0000-000000000002',
   'Priya Builders', '45 Anna Nagar, Chennai - 600040', 'pending',
   '{"shipment_number":"SHP-00002","items":[{"product_id":"10000000-0000-0000-0000-000000000010","qty":20},{"product_id":"10000000-0000-0000-0000-000000000005","qty":40}]}',
   'Suresh P', 'TN-09-CD-1234'),
  ('30000000-0000-0000-0000-000000000003', 'SHP-00003', '00000000-0000-0000-0000-000000000002',
   'Metro Constructions', '78 Park St, Mumbai - 400001', 'pending',
   '{"shipment_number":"SHP-00003","items":[{"product_id":"10000000-0000-0000-0000-000000000002","qty":25}]}',
   NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO shipment_items (shipment_id, product_id, quantity_boxes, dispatched_boxes) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 30, 30),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000010', 20,  0),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 40,  0),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 25,  0)
ON CONFLICT DO NOTHING;

-- ─── SAMPLE QUOTATIONS ───────────────────────────────────────────────────────
INSERT INTO quotations (quote_number, customer_name, customer_phone, customer_email, product_id, room_dimensions, message, status) VALUES
  ('QT-00001', 'Ananya Krishnan', '+919900112233', 'ananya@gmail.com', '10000000-0000-0000-0000-000000000001', '15×12 ft bedroom', 'Need flooring for new 2BHK apartment', 'pending'),
  ('QT-00002', 'Vikram Patel',    '+919900112244', NULL,               '10000000-0000-0000-0000-000000000010', '20×15 ft kitchen',  'Premium kitchen renovation project',     'contacted'),
  ('QT-00003', 'Sunita Reddy',    '+919900112255', 'sunita@rb.com',    NULL,                                   '10 rooms',          'Large commercial project — hotel lobby',  'quoted')
ON CONFLICT DO NOTHING;

SELECT 'Seed data loaded successfully ✅' AS status;
SELECT 'Default password for all users: Admin@1234' AS note;
