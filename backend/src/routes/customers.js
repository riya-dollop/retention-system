const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const mockProvider = require('../providers/mockProvider');

/**
 * @openapi
 * /customers:
 *   get:
 *     summary: List all customers with credit terms, balance, and invoice summaries
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/', async (req, res, next) => {
  try {
    const custRes = await pool.query('SELECT * FROM customers ORDER BY id ASC;');
    const customers = custRes.rows;

    for (const cust of customers) {
      const invRes = await pool.query('SELECT * FROM invoices WHERE customer_id = $1 ORDER BY due_date ASC;', [cust.id]);
      cust.invoices = invRes.rows;

      let totalOutstanding = 0;
      let unpaidCount = 0;
      for (const inv of invRes.rows) {
        if (inv.status !== 'paid') {
          totalOutstanding += (Number(inv.amount) - Number(inv.paid_amount));
          unpaidCount++;
        }
      }
      cust.total_outstanding = totalOutstanding;
      cust.unpaid_invoices_count = unpaidCount;

      const caseRes = await pool.query(
        "SELECT COUNT(*) AS count FROM cases WHERE customer_id = $1 AND status IN ('open', 'waiting', 'escalated');",
        [cust.id]
      );
      cust.active_cases_count = parseInt(caseRes.rows[0]?.count || 0, 10);
    }

    res.json(customers);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /customers/{id}/messages:
 *   get:
 *     summary: Retrieve chat history for a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Outbox/Chat history
 */
router.get('/:id/messages', async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const messages = await mockProvider.getMessages(customerId);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /customers/{id}/read:
 *   post:
 *     summary: Mark messages as read by the customer
 *     tags: [Customers]
 */
router.post('/:id/read', async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    await mockProvider.markAsRead(customerId);
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
