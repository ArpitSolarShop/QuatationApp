-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create System Types Table (if missing)
CREATE TABLE IF NOT EXISTS system_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_terms TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  customer_email TEXT,
  quote_date DATE DEFAULT CURRENT_DATE,
  system_type_id UUID REFERENCES system_types(id),
  capacity_kw DECIMAL(10,2),
  phase INTEGER DEFAULT 1,
  brand TEXT,
  base_price DECIMAL(12,2),
  gst_rate DECIMAL(5,2) DEFAULT 8.9,
  gst_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  central_subsidy DECIMAL(12,2),
  state_subsidy DECIMAL(12,2),
  terms JSONB,
  components JSONB,
  savings_data JSONB,
  salesperson TEXT,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert Default System Types (Only if table is empty)
INSERT INTO system_types (name, description)
SELECT 'On-grid', 'Grid Connected System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'On-grid');

INSERT INTO system_types (name, description)
SELECT 'Off-grid', 'Battery Based System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'Off-grid');

INSERT INTO system_types (name, description)
SELECT 'Hybrid', 'Hybrid System'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'Hybrid');

INSERT INTO system_types (name, description)
SELECT 'VFD/Drive', 'Solar Pump Drive'
WHERE NOT EXISTS (SELECT 1 FROM system_types WHERE name = 'VFD/Drive');

-- Add form_data column for round-trip editing of quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Create Components Table (if missing)
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_type_id UUID REFERENCES system_types(id),
  name TEXT NOT NULL,
  description TEXT,
  default_quantity TEXT DEFAULT '1 Nos',
  default_make TEXT DEFAULT 'Standard',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
