const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/db/pool');
const { seedDatabase } = require('../scripts/seed');

jest.setTimeout(30000);

describe('Wholesale Retention System - The Six Required Scenarios', () => {
  beforeEach(async () => {
    // Reset database to initial baseline seed state before each scenario test
    await seedDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  /**
   * Scenario 1: Customer pays before the due date -> No follow-up is ever sent
   */
  test('Scenario 1: Customer pays before due date -> No follow-up is ever sent', async () => {
    // Customer 2 (Metro Mart) has invoice INV-1004 due on 2026-10-22 (baseline clock is 2026-10-20)
    // Customer pays 100% of INV-1004 (Rs 50,000) on 2026-10-20 (2 days before due date)
    const payRes = await request(app)
      .post('/payments')
      .send({ invoice_no: 'INV-1004', amount: 50000 });

    expect(payRes.status).toBe(200);
    expect(payRes.body.invoice.status).toBe('paid');
    expect(payRes.body.remainingBalance).toBe(0);

    // Fast-forward the clock by 6 days to 2026-10-26 (past due date: day +4 overdue stage)
    const clockRes = await request(app)
      .post('/clock/advance')
      .query({ days: 6 });
    expect(clockRes.status).toBe(200);

    // Verify chat history for Customer 2
    const msgRes = await request(app).get('/customers/2/messages');
    expect(msgRes.status).toBe(200);

    // Assert no follow-up reminder was ever sent for INV-1004
    const inv1004Followups = msgRes.body.filter(
      (m) => m.content.includes('INV-1004') && (m.stage_name === 'pre_due' || m.stage_name === 'due_day' || m.stage_name === 'soft_followup')
    );
    expect(inv1004Followups.length).toBe(0);
  });

  /**
   * Scenario 2: Customer pays 40% on day +3 -> Next reminder shows the reduced balance
   */
  test('Scenario 2: Customer pays 40% on day +3 -> Next reminder shows the reduced balance', async () => {
    // Customer 3 (Royal Supermarket) has invoice INV-1006 of Rs 60,000 due on 2026-10-17.
    // On 2026-10-20 (day +3), customer pays 40% = Rs 24,000.
    const payRes = await request(app)
      .post('/payments')
      .send({ invoice_no: 'INV-1006', amount: 24000 });

    expect(payRes.status).toBe(200);
    expect(payRes.body.invoice.status).toBe('partially_paid');
    expect(payRes.body.remainingBalance).toBe(36000);

    // Advance clock by 4 days to 2026-10-24 (day +7 -> firm_followup stage)
    const clockRes = await request(app)
      .post('/clock/advance')
      .query({ days: 4 });
    expect(clockRes.status).toBe(200);

    // Fetch messages for Customer 3
    const msgRes = await request(app).get('/customers/3/messages');
    expect(msgRes.status).toBe(200);

    // Find the firm follow-up reminder
    const firmMsg = msgRes.body.find((m) => m.stage_name === 'firm_followup');
    expect(firmMsg).toBeDefined();

    // Verify message reflects the reduced balance (Rs 36000.00), not the original Rs 60000
    expect(firmMsg.content).toContain('36000.00');
    expect(firmMsg.content).toContain('INV-1006');
  });

  /**
   * Scenario 3: Customer replies PROMISE with a date -> Reminders pause until that date, then resume at a firmer stage if unpaid
   */
  test('Scenario 3: Customer replies PROMISE with a date -> Reminders pause until date, then resume at firmer stage', async () => {
    // Customer 7 (FreshCorner Wholesale) has invoice INV-1012 due on 2026-10-17.
    // Baseline date is 2026-10-20.
    // Customer replies via webhook: "PROMISE 2026-10-23"
    const webhookRes = await request(app)
      .post('/webhook/incoming')
      .send({ customer_id: 7, text: 'PROMISE 2026-10-23' });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.action.type).toBe('PROMISE');
    expect(webhookRes.body.action.promiseDate).toBe('2026-10-23');

    // Advance clock by 2 days to 2026-10-22 (before promise date: reminders should be paused)
    await request(app).post('/clock/advance').query({ days: 2 });

    const midMessages = await request(app).get('/customers/7/messages');
    const outboundDuringPause = midMessages.body.filter(
      (m) => m.direction === 'outbound' && String(m.sent_date).substring(0, 10) === '2026-10-22'
    );
    expect(outboundDuringPause.length).toBe(0);

    // Advance clock past the promise date by 3 days to 2026-10-25 (day +8 overdue)
    // Collection resumes at firmer stage (+7 firm_followup)
    await request(app).post('/clock/advance').query({ days: 3 });

    const resumedMessages = await request(app).get('/customers/7/messages');
    const firmMsg = resumedMessages.body.find((m) => m.stage_name === 'firm_followup');
    expect(firmMsg).toBeDefined();
    expect(firmMsg.content).toContain('INV-1012');
  });

  /**
   * Scenario 4: Customer replies DISPUTE -> Collections pause, a dispute case opens for the salesperson
   */
  test('Scenario 4: Customer replies DISPUTE -> Collections pause, dispute case opens for salesperson', async () => {
    // Customer 8 (Bharat Provisions) has invoice INV-1013
    // Customer replies "DISPUTE Damaged goods received"
    const webhookRes = await request(app)
      .post('/webhook/incoming')
      .send({ customer_id: 8, text: 'DISPUTE Damaged goods received in last delivery' });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.action.type).toBe('DISPUTE');

    // Verify dispute case created in cases table with salesperson as owner
    const casesRes = await request(app).get('/cases');
    expect(casesRes.status).toBe(200);

    const disputeCase = casesRes.body.find(
      (c) => c.customer_id === 8 && c.case_type === 'dispute'
    );
    expect(disputeCase).toBeDefined();
    expect(disputeCase.status).toBe('open');
    expect(disputeCase.owner).toBe('Priya Patel');

    // Advance clock by 10 days to 2026-10-30 (day +13 overdue)
    await request(app).post('/clock/advance').query({ days: 10 });

    // Verify collections remained paused and no new automated follow-ups were sent during dispute
    const msgsRes = await request(app).get('/customers/8/messages');
    const automatedFollowups = msgsRes.body.filter(
      (m) => m.direction === 'outbound' && (m.stage_name === 'firm_followup' || m.stage_name === 'final_notice')
    );
    expect(automatedFollowups.length).toBe(0);
  });

  /**
   * Scenario 5: Customer replies STOP -> No further messages; salesperson is notified
   */
  test('Scenario 5: Customer replies STOP -> No further messages; salesperson is notified', async () => {
    // Customer 9 (Modern Essentials) replies STOP
    const webhookRes = await request(app)
      .post('/webhook/incoming')
      .send({ customer_id: 9, text: 'STOP' });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.action.type).toBe('STOP');

    // Verify customer record is marked opt_out = true
    const customersRes = await request(app).get('/customers');
    const cust9 = customersRes.body.find((c) => c.id === 9);
    expect(cust9.opt_out).toBe(true);

    // Verify salesperson notification created
    const notifsRes = await request(app).get('/notifications');
    const stopNotif = notifsRes.body.find(
      (n) => n.customer_id === 9 && n.type === 'stop_opt_out'
    );
    expect(stopNotif).toBeDefined();
    expect(stopNotif.message).toContain('replied STOP');

    // Advance clock by 15 days
    await request(app).post('/clock/advance').query({ days: 15 });

    // Assert zero subsequent outbound messages sent to Customer 9
    const msgsRes = await request(app).get('/customers/9/messages');
    const subsequentOutbound = msgsRes.body.filter(
      (m) => m.direction === 'outbound' && String(m.sent_date).substring(0, 10) > '2026-10-20'
    );
    expect(subsequentOutbound.length).toBe(0);
  });

  /**
   * Scenario 6: Customer has 3 overdue invoices -> One combined message, not three
   */
  test('Scenario 6: Customer has 3 overdue invoices -> One combined message, not three', async () => {
    // Customer 1 (Apex Retailers) was seeded with 3 overdue invoices:
    // INV-1001 (Rs 45,000), INV-1002 (Rs 32,000), INV-1003 (Rs 18,500), each due on 2026-10-17
    // Advance clock by 1 day to 2026-10-21 (triggering stage engine for day +3/4)
    const clockRes = await request(app)
      .post('/clock/advance')
      .query({ days: 1 });
    expect(clockRes.status).toBe(200);

    // Fetch messages for Customer 1
    const msgsRes = await request(app).get('/customers/1/messages');
    expect(msgsRes.status).toBe(200);

    // Filter outbound messages sent for Customer 1 on 2026-10-21
    const outboundOnDate = msgsRes.body.filter(
      (m) => m.direction === 'outbound' && String(m.sent_date).substring(0, 10) === '2026-10-21'
    );

    // Must be exactly 1 combined message, NOT 3 separate messages
    expect(outboundOnDate.length).toBe(1);

    const combinedMsg = outboundOnDate[0];
    expect(combinedMsg.content).toContain('3 overdue invoices');
    expect(combinedMsg.content).toContain('INV-1001');
    expect(combinedMsg.content).toContain('INV-1002');
    expect(combinedMsg.content).toContain('INV-1003');
    // Total: 45000 + 32000 + 18500 = 95500.00
    expect(combinedMsg.content).toContain('95500.00');
  });
});
