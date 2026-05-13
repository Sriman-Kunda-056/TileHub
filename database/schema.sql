-- TileHub Pro — PostgreSQL Schema
-- Run: psql -U postgres -d tilehub -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'sales', 'warehouse', 'accountant', 'customer');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'overdue', 'refunded');
CREATE TYPE shipment_status AS ENUM ('pending', 'ready', 'dispatched', 'delivered', 'returned');
CREATE TYPE stock_change_reason AS ENUM ('purchase', 'sale', 'return', 'adjustment', 'damage', 'transfer');

-- ─── USERS ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'customer',
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO categories (name, slug, sort_order) VALUES
    ('Floor Tiles', 'floor-tiles', 1),
    ('Wall Tiles', 'wall-tiles', 2),
    ('Bathroom Tiles', 'bathroom-tiles', 3),
    ('Kitchen Tiles', 'kitchen-tiles', 4),
    ('Prayer Room Tiles', 'prayer-room-tiles', 5),
    ('Outdoor Tiles', 'outdoor-tiles', 6),
    ('Decorative Tiles', 'decorative-tiles', 7),
    ('Tile Accessories', 'tile-accessories', 8);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT REFERENCES categories(id),
    width_cm NUMERIC(6,2),
    height_cm NUMERIC(6,2),
    thickness_mm NUMERIC(4,2),
    finish VARCHAR(50),        -- Matte, Glossy, Anti-slip, Polished, Satin
    material VARCHAR(50),      -- Ceramic, Porcelain, Marble, Terracotta
    color_family VARCHAR(50),
    room_type VARCHAR(100),
    price_per_sqft NUMERIC(10,2) NOT NULL,
    tiles_per_box INT NOT NULL DEFAULT 10,
    sqft_per_box NUMERIC(6,2),
    weight_kg NUMERIC(6,2),
    brand VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    cloudinary_public_id VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

CREATE TABLE product_videos (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    cloudinary_public_id VARCHAR(255),
    thumbnail_url VARCHAR(500)
);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
    available_boxes INT NOT NULL DEFAULT 0,
    reserved_boxes INT NOT NULL DEFAULT 0,
    delivered_boxes INT NOT NULL DEFAULT 0,
    returned_boxes INT NOT NULL DEFAULT 0,
    reorder_point INT DEFAULT 20,
    max_stock INT DEFAULT 500,
    warehouse_location VARCHAR(100),
    last_restocked_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory_logs (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    changed_by UUID REFERENCES users(id),
    quantity_change INT NOT NULL,
    reason stock_change_reason NOT NULL,
    reference_id VARCHAR(100),   -- order_id or shipment_id
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── CUSTOMERS ───────────────────────────────────────────────────────────────

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    company_name VARCHAR(200),
    gst_number VARCHAR(20),
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    credit_limit NUMERIC(12,2) DEFAULT 0,
    total_purchases NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE showroom_bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    visit_date DATE NOT NULL,
    visit_time VARCHAR(20),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    created_by UUID REFERENCES users(id),
    status order_status DEFAULT 'draft',
    payment_status payment_status DEFAULT 'pending',
    subtotal NUMERIC(12,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    gst_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    amount_paid NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    delivery_address TEXT,
    delivery_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity_boxes INT NOT NULL,
    sqft_per_box NUMERIC(6,2),
    price_per_sqft NUMERIC(10,2) NOT NULL,
    total_sqft NUMERIC(10,2),
    total_amount NUMERIC(12,2) NOT NULL,
    wastage_percent NUMERIC(4,2) DEFAULT 10
);

-- ─── QUOTATIONS ──────────────────────────────────────────────────────────────

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    message TEXT,
    room_dimensions VARCHAR(100),
    product_id UUID REFERENCES products(id),
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── SHIPMENTS ───────────────────────────────────────────────────────────────

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_number VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    created_by UUID REFERENCES users(id),
    dispatched_by UUID REFERENCES users(id),
    qr_code_data TEXT,
    qr_code_url TEXT,
    status shipment_status DEFAULT 'pending',
    customer_name VARCHAR(200),
    delivery_address TEXT,
    driver_name VARCHAR(150),
    vehicle_number VARCHAR(30),
    dispatched_at TIMESTAMP,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shipment_items (
    id SERIAL PRIMARY KEY,
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity_boxes INT NOT NULL,
    dispatched_boxes INT DEFAULT 0
);

-- ─── INVOICES ────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12,2),
    cgst_amount NUMERIC(12,2),
    sgst_amount NUMERIC(12,2),
    igst_amount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    amount_paid NUMERIC(12,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    pdf_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    amount NUMERIC(12,2) NOT NULL,
    payment_mode VARCHAR(50),   -- cash, upi, bank_transfer, cheque
    transaction_ref VARCHAR(100),
    paid_at TIMESTAMP DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id),
    notes TEXT
);

-- ─── BOQ ─────────────────────────────────────────────────────────────────────

CREATE TABLE boq_requests (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150),
    phone VARCHAR(20),
    rooms JSONB,               -- [{name, length, width, product_id, wastage_pct}]
    total_area NUMERIC(10,2),
    total_boxes INT,
    estimated_cost NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_logs_product ON inventory_logs(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_shipments_number ON shipments(shipment_number);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
