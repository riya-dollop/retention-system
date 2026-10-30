const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const clockService = require('../services/clock');
const caseService = require('../services/cases');
const reorderService = require('../services/reorder');
const mockProvider = require('../providers/mockProvider');

/**
 * Helper to get next notification id
 */
async function getNextNotificationId() {
  const maxRes = await pool.query('SELECT MAX(id) AS max_id FROM notifications;');
  return (parseInt(maxRes.rows[0]?.max_id || 0, 10)) + 1;
}

/**
 * @openapi
 * /webhook/incoming:
 *   post:
 *     summary: Receive incoming customer WhatsApp replies
 *     description: Supports commands PAID, PROMISE <date>, DISPUTE, STOP, YES
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               customer_id:
 *                 type: integer
 *               phone:
 *                 type: string
 *               text:
 *                 type: string
 *                 example: "PROMISE 2026-11-05"
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/incoming', async (req, res, next) => {
  try {
    const { customer_id, phone, text, message } = req.body;
    const incomingText = String(text || message || '').trim();

    if (!incomingText) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    let customer;
    if (customer_id) {
      const custRes = await pool.query('SELECT * FROM customers WHERE id = $1;', [customer_id]);
      customer = custRes.rows[0];
    } else if (phone) {
      const custRes = await pool.query('SELECT * FROM customers WHERE phone = $1;', [phone]);
      customer = custRes.rows[0];
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const currentDate = await clockService.getCurrentDate();

    // Log the incoming message in outbox table
    await mockProvider.recordInbound({
      customerId: customer.id,
      phone: customer.phone,
      content: incomingText,
      sentDate: currentDate,
      metadata: { rawText: incomingText },
    });

    const upperText = incomingText.toUpperCase();
    let actionResult = { type: 'acknowledged', text: incomingText };

    // 1. Handle STOP reply (Scenario 5)
    if (upperText === 'STOP') {
      await pool.query('UPDATE customers SET opt_out = true WHERE id = $1;', [customer.id]);

      const notifId = await getNextNotificationId();
      await pool.query(`
        INSERT INTO notifications (id, customer_id, recipient_role, recipient_name, type, message, simulated_date, created_at)
        VALUES ($1, $2, 'salesperson', $3, 'stop_opt_out', $4, $5, NOW());
      `, [
        notifId,
        customer.id,
        customer.salesperson,
        `OPT-OUT ALERT: Customer ${customer.name} (${customer.phone}) replied STOP. All automated outreach halted.`,
        currentDate
      ]);

      actionResult = {
        type: 'STOP',
        status: 'opted_out',
        message: 'Customer opted out from future messages. Salesperson notified.',
      };
    }

    // 2. Handle DISPUTE reply (Scenario 4)
    else if (upperText.startsWith('DISPUTE')) {
      const invRes = await pool.query(`
        SELECT id, invoice_no FROM invoices
        WHERE customer_id = $1 AND status != 'paid'
        ORDER BY due_date ASC
        LIMIT 1;
      `, [customer.id]);

      const invoiceId = invRes.rows[0]?.id || null;

      const disputeCase = await caseService.createCase({
        customerId: customer.id,
        invoiceId: invoiceId,
        caseType: 'dispute',
        owner: customer.salesperson,
        currentDate: currentDate,
        eventNote: `Customer initiated DISPUTE via WhatsApp: "${incomingText}". Automated collections paused.`,
      });

      actionResult = {
        type: 'DISPUTE',
        status: 'collection_paused',
        caseId: disputeCase.id,
        message: 'Dispute recorded. Collections paused; assigned to salesperson.',
      };
    }

    // 3. Handle PROMISE <date> reply (Scenario 3)
    else if (upperText.startsWith('PROMISE')) {
      const parts = incomingText.split(/\s+/);
      const promiseDate = parts[1];

      if (promiseDate) {
        await pool.query('UPDATE customers SET promise_date = $1 WHERE id = $2;', [promiseDate, customer.id]);

        const invRes = await pool.query(`
          SELECT id, invoice_no FROM invoices
          WHERE customer_id = $1 AND status != 'paid'
          ORDER BY due_date ASC
          LIMIT 1;
        `, [customer.id]);

        const invoiceId = invRes.rows[0]?.id || null;

        const promiseCase = await caseService.createCase({
          customerId: customer.id,
          invoiceId: invoiceId,
          caseType: 'promise_to_pay',
          owner: customer.salesperson,
          currentDate: currentDate,
          eventNote: `Customer promised payment on ${promiseDate}. Reminders paused until that date.`,
        });

        actionResult = {
          type: 'PROMISE',
          promiseDate,
          caseId: promiseCase.id,
          status: 'reminders_paused',
          message: `Promise date registered for ${promiseDate}. Reminders paused until then.`,
        };
      }
    }

    // 4. Handle PAID reply
    else if (upperText === 'PAID') {
      const notifId = await getNextNotificationId();
      await pool.query(`
        INSERT INTO notifications (id, customer_id, recipient_role, recipient_name, type, message, simulated_date, created_at)
        VALUES ($1, $2, 'salesperson', $3, 'payment_claim', $4, $5, NOW());
      `, [
        notifId,
        customer.id,
        customer.salesperson,
        `Payment Claim: Customer ${customer.name} replied PAID. Please verify bank credit or mark invoice paid.`,
        currentDate
      ]);

      actionResult = {
        type: 'PAID',
        status: 'verification_pending',
        message: 'Payment notification created for salesperson review.',
      };
    }

    // 5. Handle YES reply (Reorder confirmation - Section 4.7)
    else if (upperText === 'YES') {
      const draftOrder = await reorderService.handleReorderYes(customer.id, currentDate);
      actionResult = {
        type: 'YES',
        status: 'draft_order_created',
        draftOrder,
        message: 'Draft reorder successfully generated from past items.',
      };
    }

    res.json({
      success: true,
      customerId: customer.id,
      customerName: customer.name,
      replyReceived: incomingText,
      action: actionResult,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
