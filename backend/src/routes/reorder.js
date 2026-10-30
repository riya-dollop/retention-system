const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const clockService = require('../services/clock');
const { getDiffInDays } = require('../services/reorder');

/**
 * @openapi
 * /reorder/recommendations:
 *   get:
 *     summary: View reorder gap analysis and prediction thresholds
 *     tags: [Reorders]
 */
router.get('/recommendations', async (req, res, next) => {
  try {
    const currentDate = await clockService.getCurrentDate();
    const customers = await pool.query('SELECT * FROM customers WHERE opt_out = false;');

    const analysis = [];
    for (const cust of customers.rows) {
      const ordersRes = await pool.query(`
        SELECT * FROM past_orders
        WHERE customer_id = $1 AND status != 'draft'
        ORDER BY order_date ASC;
      `, [cust.id]);

      const orders = ordersRes.rows;
      if (orders.length >= 2) {
        let totalGap = 0;
        for (let i = 1; i < orders.length; i++) {
          totalGap += getDiffInDays(orders[i].order_date, orders[i - 1].order_date);
        }
        const avgGap = totalGap / (orders.length - 1);
        const thresholdDays = Math.round(avgGap * 0.90);
        const latestOrder = orders[orders.length - 1];
        const daysSinceLast = getDiffInDays(currentDate, latestOrder.order_date);

        analysis.push({
          customerId: cust.id,
          customerName: cust.name,
          avgGapDays: avgGap.toFixed(1),
          thresholdDays,
          daysSinceLastOrder: daysSinceLast,
          isEligible: daysSinceLast >= thresholdDays,
          lastOrderNo: latestOrder.order_no,
        });
      }
    }

    res.json({ currentDate, analysis });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
