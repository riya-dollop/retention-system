const { pool } = require('../db/pool');
const mockProvider = require('../providers/mockProvider');

/**
 * Helper to compute date diff in days (date1 - date2)
 */
function getDiffInDays(date1Str, date2Str) {
  const d1 = new Date(`${date1Str}T00:00:00Z`);
  const d2 = new Date(`${date2Str}T00:00:00Z`);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check reorder schedules for all customers and send retention reminders at 90% gap.
 */
async function checkReorders(simulatedDate) {
  const remindersSent = [];

  const customersRes = await pool.query('SELECT * FROM customers WHERE opt_out = false;');
  const customers = customersRes.rows;

  for (const customer of customers) {
    const unpaidInvoicesRes = await pool.query(`
      SELECT due_date FROM invoices
      WHERE customer_id = $1 
        AND status != 'paid' 
        AND (amount - paid_amount) > 0;
    `, [customer.id]);

    const hasOverdue = unpaidInvoicesRes.rows.some((inv) => {
      const formattedDue = String(inv.due_date).substring(0, 10);
      return getDiffInDays(simulatedDate, formattedDue) > 0;
    });

    if (hasOverdue) {
      continue;
    }

    const ordersRes = await pool.query(`
      SELECT * FROM past_orders
      WHERE customer_id = $1 AND status != 'draft'
      ORDER BY order_date ASC;
    `, [customer.id]);

    const orders = ordersRes.rows;
    if (orders.length < 2) {
      continue;
    }

    let totalGapDays = 0;
    for (let i = 1; i < orders.length; i++) {
      const prevDate = String(orders[i - 1].order_date).substring(0, 10);
      const currDate = String(orders[i].order_date).substring(0, 10);
      totalGapDays += getDiffInDays(currDate, prevDate);
    }

    const avgGap = totalGapDays / (orders.length - 1);
    const thresholdDays = Math.round(avgGap * 0.90);

    const latestOrder = orders[orders.length - 1];
    const latestOrderDate = String(latestOrder.order_date).substring(0, 10);
    const daysSinceLastOrder = getDiffInDays(simulatedDate, latestOrderDate);

    if (daysSinceLastOrder >= thresholdDays) {
      const alreadySent = await pool.query(`
        SELECT id FROM outbox
        WHERE customer_id = $1 
          AND stage_name = 'reorder_reminder' 
          AND metadata->>'last_order_id' = $2
        LIMIT 1;
      `, [customer.id, String(latestOrder.id)]);

      if (alreadySent.rows.length === 0) {
        let itemsList = latestOrder.items;
        if (typeof itemsList === 'string') {
          itemsList = JSON.parse(itemsList);
        }
        const itemSummary = itemsList.map((i) => `${i.qty}x ${i.name}`).join(', ');

        const messageContent = `Hi ${customer.name}, based on your usual ordering cycle (${Math.round(avgGap)} days), your inventory may be running low! Your previous order (#${latestOrder.order_no}) was: ${itemSummary}. Reply YES to instantly generate a draft restock order.`;

        await mockProvider.sendMessage({
          customerId: customer.id,
          phone: customer.phone,
          content: messageContent,
          stageName: 'reorder_reminder',
          sentDate: simulatedDate,
          metadata: {
            last_order_id: latestOrder.id,
            last_order_no: latestOrder.order_no,
            avgGapDays: avgGap,
            daysSinceLastOrder,
          },
        });

        remindersSent.push({
          customerId: customer.id,
          customerName: customer.name,
          avgGap,
          daysSinceLastOrder,
          lastOrderNo: latestOrder.order_no,
        });
      }
    }
  }

  return remindersSent;
}

/**
 * Handle incoming 'YES' reply from customer: creates a draft order
 */
async function handleReorderYes(customerId, simulatedDate) {
  const latestOrderRes = await pool.query(`
    SELECT * FROM past_orders
    WHERE customer_id = $1
    ORDER BY order_date DESC
    LIMIT 1;
  `, [customerId]);

  if (latestOrderRes.rows.length === 0) {
    return null;
  }

  const prevOrder = latestOrderRes.rows[0];
  const draftOrderNo = `DRAFT-${Date.now().toString().slice(-5)}`;

  // Find max id to avoid sequence collision
  const maxIdRes = await pool.query('SELECT MAX(id) AS max_id FROM past_orders;');
  const nextId = (parseInt(maxIdRes.rows[0]?.max_id || 0, 10)) + 1;

  const result = await pool.query(`
    INSERT INTO past_orders (id, customer_id, order_no, order_date, items, total_amount, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW())
    RETURNING *;
  `, [nextId, customerId, draftOrderNo, simulatedDate, JSON.stringify(prevOrder.items), prevOrder.total_amount]);

  const draftOrder = result.rows[0];

  const customerRes = await pool.query('SELECT * FROM customers WHERE id = $1;', [customerId]);
  const customer = customerRes.rows[0];

  const confirmMsg = `Thank you ${customer.name}! Draft restock order #${draftOrderNo} of Rs ${draftOrder.total_amount} has been created from your previous order. Our wholesale desk will confirm shipping shortly.`;

  await mockProvider.sendMessage({
    customerId: customer.id,
    phone: customer.phone,
    content: confirmMsg,
    stageName: 'draft_order_created',
    sentDate: simulatedDate,
    metadata: { draft_order_no: draftOrderNo, total_amount: draftOrder.total_amount },
  });

  return draftOrder;
}

module.exports = {
  checkReorders,
  handleReorderYes,
  getDiffInDays,
};
