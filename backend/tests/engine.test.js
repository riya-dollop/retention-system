const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/db/pool');
const { seedDatabase } = require('../scripts/seed');

describe('Wholesale Retention System - Engine Invariants & Edge Cases', () => {
  beforeEach(async () => {
    await seedDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Idempotency: Advancing clock by 0 or calling engine twice on same day produces no duplicate messages', async () => {
    // Run advance by 1 day
    await request(app).post('/clock/advance').query({ days: 1 });

    const msgsRes1 = await request(app).get('/customers/5/messages');
    const count1 = msgsRes1.body.length;

    // Advance by 0 days (run stage engine again on the same simulated date)
    await request(app).post('/clock/advance').query({ days: 0 });

    const msgsRes2 = await request(app).get('/customers/5/messages');
    const count2 = msgsRes2.body.length;

    expect(count2).toBe(count1);
  });

  test('Case Escalation: Open case open for >= 2 simulated days escalates to Manager', async () => {
    // Fast forward to day +7 overdue to trigger firm_followup case for Customer 5
    await request(app).post('/clock/advance').query({ days: 1 });

    const casesRes = await request(app).get('/cases');
    const openCase = casesRes.body.find((c) => c.status === 'open');
    expect(openCase).toBeDefined();

    // Advance clock by 2 simulated days
    await request(app).post('/clock/advance').query({ days: 2 });

    const escalatedCasesRes = await request(app).get('/cases');
    const targetCase = escalatedCasesRes.body.find((c) => c.id === openCase.id);
    expect(targetCase.status).toBe('escalated');

    // Verify manager notification was dispatched
    const notifsRes = await request(app).get('/notifications?role=manager');
    const mgrNotif = notifsRes.body.find((n) => n.case_id === openCase.id);
    expect(mgrNotif).toBeDefined();
    expect(mgrNotif.recipient_role).toBe('manager');
  });

  test('Auto-resolve: Paying invoice auto-resolves any associated open cases', async () => {
    // Open a case on invoice INV-1008
    await request(app).post('/clock/advance').query({ days: 1 });

    const casesBefore = await request(app).get('/cases');
    const invCase = casesBefore.body.find((c) => c.invoice_no === 'INV-1008');
    expect(invCase).toBeDefined();
    expect(invCase.status).not.toBe('resolved');

    // Customer pays invoice INV-1008 in full
    await request(app)
      .post('/payments')
      .send({ invoice_no: 'INV-1008', amount: 75000 });

    const casesAfter = await request(app).get('/cases');
    const resolvedCase = casesAfter.body.find((c) => c.id === invCase.id);
    expect(resolvedCase.status).toBe('resolved');
  });

  test('Reorder & YES reply: YES reply generates a draft order with items from prior order', async () => {
    // Customer 4 sends YES reply
    const replyRes = await request(app)
      .post('/webhook/incoming')
      .send({ customer_id: 4, text: 'YES' });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.action.type).toBe('YES');
    expect(replyRes.body.action.draftOrder).toBeDefined();
    expect(replyRes.body.action.draftOrder.status).toBe('draft');

    // Verify confirmation message was sent to customer
    const msgsRes = await request(app).get('/customers/4/messages');
    const confirmMsg = msgsRes.body.find((m) => m.stage_name === 'draft_order_created');
    expect(confirmMsg).toBeDefined();
    expect(confirmMsg.content).toContain('Draft restock order');
  });

  test('Offers Exclusion: Customers with 15+ days overdue invoice never receive offers', async () => {
    // Customer 6 has invoice INV-1010 which is 15 days overdue
    // Advance clock to trigger offer evaluation
    await request(app).post('/clock/advance').query({ days: 1 });

    const offersRes = await request(app).get('/offers');
    const cust6Offers = offersRes.body.grantedOffers.filter((o) => o.customer_id === 6);
    expect(cust6Offers.length).toBe(0);
  });
});

