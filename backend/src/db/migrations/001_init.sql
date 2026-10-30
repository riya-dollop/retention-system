-- System Simulated Clock
CREATE TABLE IF NOT EXISTS system_clock (
    id SERIAL PRIMARY KEY,
    simulated_date DATE NOT NULL DEFAULT '2026-10-01',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    tier VARCHAR(50) DEFAULT 'Standard',
    salesperson VARCHAR(100) NOT NULL,
    credit_terms INT NOT NULL DEFAULT 15,
    opt_out BOOLEAN DEFAULT FALSE,
    promise_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_no VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    issued_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Past Orders Table
CREATE TABLE IF NOT EXISTS past_orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_no VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'delivered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stage Executions (Tracks idempotency: each stage runs only once per invoice)
CREATE TABLE IF NOT EXISTS stage_executions (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    executed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_invoice_stage UNIQUE(invoice_id, stage_name)
);

-- Message Outbox (Stores mock WhatsApp messages)
CREATE TABLE IF NOT EXISTS outbox (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'outbound',
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    stage_name VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cases & Escalations
CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_id INT REFERENCES invoices(id) ON DELETE SET NULL,
    case_type VARCHAR(50) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    opened_date DATE NOT NULL,
    escalated_date DATE,
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    case_id INT REFERENCES cases(id) ON DELETE CASCADE,
    customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
    recipient_role VARCHAR(50) NOT NULL DEFAULT 'salesperson',
    recipient_name VARCHAR(100),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    simulated_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Offers
CREATE TABLE IF NOT EXISTS customer_offers (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    offer_code VARCHAR(50) NOT NULL,
    granted_date DATE NOT NULL,
    expires_date DATE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_date DATE,
    CONSTRAINT unique_customer_offer UNIQUE(customer_id, offer_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_outbox_customer ON outbox(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
