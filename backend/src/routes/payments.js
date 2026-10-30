const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const clockService = require('../services/clock');
const caseService = require('../services/cases');

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: Record a full or partial payment against an invoice
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               invoice_id:
 *                 type: integer
 *               invoice_no:
 *                 type: string
 *               amount:
 *                 type: number
 *                 example: 20000
 *     responses:
 *       200:
 *         description: Payment registered successfully
 */
router.post('/', async (req, res, next) => {
  try {
    const { invoice_id, invoice_no, amount } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive payment amount is required' });
    }

    let invoice;
    if (invoice_id) {
      const result = await pool.query('SELECT * FROM invoices WHERE id = $1;', [invoice_id]);
      invoice = result.rows[0];
    } else if (invoice_no) {
      const result = await pool.query('SELECT * FROM invoices WHERE invoice_no = $1;', [invoice_no]);
      invoice = result.rows[0];
    }

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const newPaidAmount = Number(invoice.paid_amount) + paymentAmount;
    const totalAmount = Number(invoice.amount);
    const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partially_paid';
    const remainingBalance = Math.max(0, totalAmount - newPaidAmount);

    const updateRes = await pool.query(`
      UPDATE invoices
      SET paid_amount = $1, status = $2
      WHERE id = $3
      RETURNING *;
    `, [newPaidAmount, newStatus, invoice.id]);

    const updatedInvoice = updateRes.rows[0];
    const currentDate = await clockService.getCurrentDate();

    // Auto-resolve case if invoice is now paid
    let resolvedCasesCount = 0;
    if (newStatus === 'paid') {
      resolvedCasesCount = await caseService.resolveCaseByInvoice(
        invoice.id,
        currentDate,
        `Payment of Rs ${paymentAmount} completed invoice #${invoice.invoice_no}`
      );
    }

    res.json({
      success: true,
      message: newStatus === 'paid' ? 'Invoice paid in full' : 'Partial payment recorded',
      invoice: updatedInvoice,
      paymentAmount,
      remainingBalance,
      resolvedCases: resolvedCasesCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

