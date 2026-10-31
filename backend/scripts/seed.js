const { pool } = require('../src/db/pool');

const INITIAL_CLOCK_DATE = '2026-10-20';

async function seedDatabase(clientOrPool = pool) {
  const client = clientOrPool;

  console.log('Seeding database with baseline dataset...');

  const tables = [
    'customer_offers',
    'notifications',
    'cases',
    'outbox',
    'stage_executions',
    'past_orders',
    'invoices',
    'customers',
    'system_clock'
  ];

  for (const table of tables) {
    await client.query(`DELETE FROM ${table};`);
  }

  // 1. Seed System Clock
  await client.query(`
    INSERT INTO system_clock (id, simulated_date, updated_at)
    VALUES (1, $1, NOW())
    ON CONFLICT (id) DO UPDATE SET simulated_date = $1, updated_at = NOW();
  `, [INITIAL_CLOCK_DATE]);

  // 2. Seed 10 Customers with explicit deterministic primary keys
  const customerRows = [
    { id: 1, name: 'Apex Retailers', phone: '+919876543210', tier: 'Gold', salesperson: 'Rahul Sharma', credit_terms: 30 },
    { id: 2, name: 'Metro Mart', phone: '+919876543211', tier: 'Silver', salesperson: 'Priya Patel', credit_terms: 15 },
    { id: 3, name: 'Royal Supermarket', phone: '+919876543212', tier: 'Gold', salesperson: 'Rahul Sharma', credit_terms: 30 },
    { id: 4, name: 'QuickBuy Traders', phone: '+919876543213', tier: 'Standard', salesperson: 'Amit Verma', credit_terms: 15 },
    { id: 5, name: 'City Grocers', phone: '+919876543214', tier: 'Bronze', salesperson: 'Priya Patel', credit_terms: 15 },
    { id: 6, name: 'Sunrise Departmental', phone: '+919876543215', tier: 'Silver', salesperson: 'Amit Verma', credit_terms: 30 },
    { id: 7, name: 'FreshCorner Wholesale', phone: '+919876543216', tier: 'Standard', salesperson: 'Rahul Sharma', credit_terms: 15 },
    { id: 8, name: 'Bharat Provisions', phone: '+919876543217', tier: 'Gold', salesperson: 'Priya Patel', credit_terms: 30 },
    { id: 9, name: 'Modern Essentials', phone: '+919876543218', tier: 'Bronze', salesperson: 'Amit Verma', credit_terms: 15 },
    { id: 10, name: 'Prime Bazaar', phone: '+919876543219', tier: 'Standard', salesperson: 'Rahul Sharma', credit_terms: 30 }
  ];

  for (const c of customerRows) {
    await client.query(`
      INSERT INTO customers (id, name, phone, tier, salesperson, credit_terms)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [c.id, c.name, c.phone, c.tier, c.salesperson, c.credit_terms]);
  }

  // 3. Seed 20 Invoices
  const invoiceRows = [
    // Customer 1: Apex Retailers (Multiple overdue invoices for Scenario 6 combined message)
    { id: 1, customer_id: 1, invoice_no: 'INV-1001', amount: 45000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },
    { id: 2, customer_id: 1, invoice_no: 'INV-1002', amount: 32000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },
    { id: 3, customer_id: 1, invoice_no: 'INV-1003', amount: 18500, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },

    // Customer 2: Metro Mart (Pays before due date for Scenario 1)
    { id: 4, customer_id: 2, invoice_no: 'INV-1004', amount: 50000, paid_amount: 0, issued: '2026-10-07', due: '2026-10-22', status: 'unpaid' },
    { id: 5, customer_id: 2, invoice_no: 'INV-1005', amount: 25000, paid_amount: 25000, issued: '2026-09-01', due: '2026-09-16', status: 'paid' },

    // Customer 3: Royal Supermarket (Partially paid on day +3 for Scenario 2)
    { id: 6, customer_id: 3, invoice_no: 'INV-1006', amount: 60000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },

    // Customer 4: QuickBuy Traders (Due Today)
    { id: 7, customer_id: 4, invoice_no: 'INV-1007', amount: 42000, paid_amount: 0, issued: '2026-10-05', due: '2026-10-20', status: 'unpaid' },

    // Customer 5: City Grocers (7 days overdue - Firm follow-up / Case creation)
    { id: 8, customer_id: 5, invoice_no: 'INV-1008', amount: 75000, paid_amount: 0, issued: '2026-09-28', due: '2026-10-13', status: 'unpaid' },
    { id: 9, customer_id: 5, invoice_no: 'INV-1009', amount: 20000, paid_amount: 10000, issued: '2026-09-15', due: '2026-09-30', status: 'partially_paid' },

    // Customer 6: Sunrise Departmental (15 days overdue - Final notice / Escalation)
    { id: 10, customer_id: 6, invoice_no: 'INV-1010', amount: 95000, paid_amount: 0, issued: '2026-09-05', due: '2026-10-05', status: 'unpaid' },
    { id: 11, customer_id: 6, invoice_no: 'INV-1011', amount: 30000, paid_amount: 30000, issued: '2026-08-10', due: '2026-08-25', status: 'paid' },

    // Customer 7: FreshCorner Wholesale (Promise to Pay candidate - Scenario 3)
    { id: 12, customer_id: 7, invoice_no: 'INV-1012', amount: 38000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },

    // Customer 8: Bharat Provisions (Dispute candidate - Scenario 4)
    { id: 13, customer_id: 8, invoice_no: 'INV-1013', amount: 84000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },

    // Customer 9: Modern Essentials (Stop candidate - Scenario 5)
    { id: 14, customer_id: 9, invoice_no: 'INV-1014', amount: 29000, paid_amount: 0, issued: '2026-09-17', due: '2026-10-17', status: 'unpaid' },

    // Customer 10: Prime Bazaar
    { id: 15, customer_id: 10, invoice_no: 'INV-1015', amount: 55000, paid_amount: 0, issued: '2026-10-15', due: '2026-10-30', status: 'unpaid' },
    { id: 16, customer_id: 10, invoice_no: 'INV-1016', amount: 48000, paid_amount: 48000, issued: '2026-09-01', due: '2026-09-16', status: 'paid' },

    // Additional invoices
    { id: 17, customer_id: 2, invoice_no: 'INV-1017', amount: 15000, paid_amount: 5000, issued: '2026-09-20', due: '2026-10-05', status: 'partially_paid' },
    { id: 18, customer_id: 3, invoice_no: 'INV-1018', amount: 62000, paid_amount: 62000, issued: '2026-08-20', due: '2026-09-05', status: 'paid' },
    { id: 19, customer_id: 4, invoice_no: 'INV-1019', amount: 21000, paid_amount: 0, issued: '2026-10-10', due: '2026-10-25', status: 'unpaid' },
    { id: 20, customer_id: 8, invoice_no: 'INV-1020', amount: 110000, paid_amount: 110000, issued: '2026-08-01', due: '2026-08-16', status: 'paid' }
  ];

  for (const inv of invoiceRows) {
    await client.query(`
      INSERT INTO invoices (id, customer_id, invoice_no, amount, paid_amount, issued_date, due_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [inv.id, inv.customer_id, inv.invoice_no, inv.amount, inv.paid_amount, inv.issued, inv.due, inv.status]);
  }

  // 4. Seed 30 Past Orders across customers with realistic item catalogs
  const sampleItemsList = [
    [
      { sku: 'RICE-BAS-25', name: 'Premium Basmati Rice 25kg', qty: 20, unit_price: 1850 },
      { sku: 'OIL-SUN-15L', name: 'Refined Sunflower Oil 15L Tin', qty: 15, unit_price: 1650 }
    ],
    [
      { sku: 'SUG-M30-50', name: 'Refined Sugar M30 50kg Bag', qty: 30, unit_price: 2100 },
      { sku: 'WHT-ATA-30', name: 'Chakki Fresh Atta 30kg', qty: 25, unit_price: 1150 }
    ],
    [
      { sku: 'DAL-TOOR-25', name: 'Desi Toor Dal 25kg', qty: 10, unit_price: 3400 },
      { sku: 'SPICE-TUR-10', name: 'Pure Turmeric Powder 10kg', qty: 5, unit_price: 1800 }
    ],
    [
      { sku: 'TEA-PREM-10', name: 'Assam CTC Premium Tea 10kg', qty: 12, unit_price: 2800 },
      { sku: 'SALT-IOD-50', name: 'Triple Refined Iodized Salt 50kg', qty: 40, unit_price: 450 }
    ]
  ];

  const orders = [
    { id: 1, customer_id: 1, order_no: 'ORD-5001', date: '2026-08-25', items: sampleItemsList[0], total: 61750 },
    { id: 2, customer_id: 1, order_no: 'ORD-5002', date: '2026-09-07', items: sampleItemsList[1], total: 91750 },
    { id: 3, customer_id: 1, order_no: 'ORD-5003', date: '2026-09-20', items: sampleItemsList[2], total: 43000 },
    { id: 4, customer_id: 1, order_no: 'ORD-5004', date: '2026-10-03', items: sampleItemsList[3], total: 51600 },
    { id: 5, customer_id: 2, order_no: 'ORD-5005', date: '2026-08-20', items: sampleItemsList[1], total: 91750 },
    { id: 6, customer_id: 2, order_no: 'ORD-5006', date: '2026-09-03', items: sampleItemsList[2], total: 43000 },
    { id: 7, customer_id: 2, order_no: 'ORD-5007', date: '2026-09-18', items: sampleItemsList[0], total: 61750 },
    { id: 8, customer_id: 2, order_no: 'ORD-5008', date: '2026-10-04', items: sampleItemsList[3], total: 51600 },
    { id: 9, customer_id: 3, order_no: 'ORD-5009', date: '2026-08-15', items: sampleItemsList[3], total: 51600 },
    { id: 10, customer_id: 3, order_no: 'ORD-5010', date: '2026-09-02', items: sampleItemsList[0], total: 61750 },
    { id: 11, customer_id: 3, order_no: 'ORD-5011', date: '2026-09-21', items: sampleItemsList[1], total: 91750 },
    { id: 12, customer_id: 4, order_no: 'ORD-5012', date: '2026-08-28', items: sampleItemsList[2], total: 43000 },
    { id: 13, customer_id: 4, order_no: 'ORD-5013', date: '2026-09-09', items: sampleItemsList[0], total: 61750 },
    { id: 14, customer_id: 4, order_no: 'ORD-5014', date: '2026-09-21', items: sampleItemsList[1], total: 91750 },
    { id: 15, customer_id: 4, order_no: 'ORD-5015', date: '2026-10-10', items: sampleItemsList[3], total: 51600 },
    { id: 16, customer_id: 5, order_no: 'ORD-5016', date: '2026-08-10', items: sampleItemsList[0], total: 61750 },
    { id: 17, customer_id: 5, order_no: 'ORD-5017', date: '2026-09-01', items: sampleItemsList[3], total: 51600 },
    { id: 18, customer_id: 5, order_no: 'ORD-5018', date: '2026-09-25', items: sampleItemsList[2], total: 43000 },
    { id: 19, customer_id: 6, order_no: 'ORD-5019', date: '2026-08-05', items: sampleItemsList[1], total: 91750 },
    { id: 20, customer_id: 6, order_no: 'ORD-5020', date: '2026-08-25', items: sampleItemsList[2], total: 43000 },
    { id: 21, customer_id: 7, order_no: 'ORD-5021', date: '2026-08-18', items: sampleItemsList[3], total: 51600 },
    { id: 22, customer_id: 7, order_no: 'ORD-5022', date: '2026-09-05', items: sampleItemsList[0], total: 61750 },
    { id: 23, customer_id: 7, order_no: 'ORD-5023', date: '2026-09-28', items: sampleItemsList[1], total: 91750 },
    { id: 24, customer_id: 8, order_no: 'ORD-5024', date: '2026-08-01', items: sampleItemsList[0], total: 61750 },
    { id: 25, customer_id: 8, order_no: 'ORD-5025', date: '2026-08-22', items: sampleItemsList[1], total: 91750 },
    { id: 26, customer_id: 8, order_no: 'ORD-5026', date: '2026-09-15', items: sampleItemsList[2], total: 43000 },
    { id: 27, customer_id: 9, order_no: 'ORD-5027', date: '2026-08-05', items: sampleItemsList[0], total: 61750 },
    { id: 28, customer_id: 9, order_no: 'ORD-5028', date: '2026-08-28', items: sampleItemsList[3], total: 51600 },
    { id: 29, customer_id: 10, order_no: 'ORD-5029', date: '2026-08-15', items: sampleItemsList[1], total: 91750 },
    { id: 30, customer_id: 10, order_no: 'ORD-5030', date: '2026-09-10', items: sampleItemsList[0], total: 61750 }
  ];

  for (const o of orders) {
    await client.query(`
      INSERT INTO past_orders (id, customer_id, order_no, order_date, items, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'delivered');
    `, [o.id, o.customer_id, o.order_no, o.date, JSON.stringify(o.items), o.total]);
  }

  console.log(`Database seeded successfully: 10 customers, ${invoiceRows.length} invoices, ${orders.length} past orders.`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Seed script error:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase, INITIAL_CLOCK_DATE };

