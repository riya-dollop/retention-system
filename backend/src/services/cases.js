const { pool } = require('../db/pool');

function toDateObj(input) {
  if (input instanceof Date) {
    const y = input.getUTCFullYear();
    const m = String(input.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.getUTCDate()).padStart(2, '0');
    return new Date(`${y}-${m}-${d}T00:00:00Z`);
  }
  const str = String(input).substring(0, 10);
  return new Date(`${str}T00:00:00Z`);
}

function getDaysDiff(date1, date2) {
  const d1 = toDateObj(date1);
  const d2 = toDateObj(date2);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Create a new case or update existing case timeline (preventing duplicate cases for the same invoice).
 */
async function createCase({ customerId, invoiceId = null, caseType, owner, currentDate, eventNote }) {
  if (invoiceId) {
    const existingCase = await pool.query(`
      SELECT * FROM cases
      WHERE invoice_id = $1 AND status IN ('open', 'waiting', 'escalated')
      LIMIT 1;
    `, [invoiceId]);

    if (existingCase.rows.length > 0) {
      const existing = existingCase.rows[0];
      const timeline = existing.timeline || [];
      timeline.push({
        date: currentDate,
        event: 'update',
        note: eventNote || `Case updated: ${caseType}`,
      });

      await pool.query(`
        UPDATE cases
        SET timeline = $1, updated_at = NOW()
        WHERE id = $2;
      `, [JSON.stringify(timeline), existing.id]);

      return existing;
    }
  }

  const initialTimeline = [
    {
      date: currentDate,
      event: 'created',
      note: eventNote || `Case opened: ${caseType}`,
    }
  ];

  const initialStatus = caseType === 'promise_to_pay' ? 'waiting' : 'open';

  // Prevent sequence collision by calculating next id
  const maxIdRes = await pool.query('SELECT MAX(id) AS max_id FROM cases;');
  const nextId = (parseInt(maxIdRes.rows[0]?.max_id || 0, 10)) + 1;

  const insertRes = await pool.query(`
    INSERT INTO cases (id, customer_id, invoice_id, case_type, owner, status, opened_date, timeline, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *;
  `, [nextId, customerId, invoiceId, caseType, owner, initialStatus, currentDate, JSON.stringify(initialTimeline)]);

  const newCase = insertRes.rows[0];

  // Dispatch initial notification to salesperson
  const maxNotifIdRes = await pool.query('SELECT MAX(id) AS max_id FROM notifications;');
  const nextNotifId = (parseInt(maxNotifIdRes.rows[0]?.max_id || 0, 10)) + 1;

  await pool.query(`
    INSERT INTO notifications (id, case_id, customer_id, recipient_role, recipient_name, type, message, simulated_date, created_at)
    VALUES ($1, $2, $3, 'salesperson', $4, $5, $6, $7, NOW());
  `, [
    nextNotifId,
    newCase.id,
    customerId,
    owner,
    `case_${caseType}`,
    `New case #${newCase.id} created for customer #${customerId} (${caseType}): ${eventNote}`,
    currentDate
  ]);

  return newCase;
}

/**
 * Automatically resolve cases when an invoice is fully paid.
 */
async function resolveCaseByInvoice(invoiceId, currentDate, resolutionNote = 'Invoice paid in full') {
  const openCases = await pool.query(`
    SELECT * FROM cases
    WHERE invoice_id = $1 AND status IN ('open', 'waiting', 'escalated');
  `, [invoiceId]);

  for (const c of openCases.rows) {
    const timeline = c.timeline || [];
    timeline.push({
      date: currentDate,
      event: 'resolved',
      note: resolutionNote,
    });

    await pool.query(`
      UPDATE cases
      SET status = 'resolved', timeline = $1, updated_at = NOW()
      WHERE id = $2;
    `, [JSON.stringify(timeline), c.id]);

    const maxNotifIdRes = await pool.query('SELECT MAX(id) AS max_id FROM notifications;');
    const nextNotifId = (parseInt(maxNotifIdRes.rows[0]?.max_id || 0, 10)) + 1;

    await pool.query(`
      INSERT INTO notifications (id, case_id, customer_id, recipient_role, recipient_name, type, message, simulated_date, created_at)
      VALUES ($1, $2, $3, 'salesperson', $4, 'case_resolved', $5, $6, NOW());
    `, [
      nextNotifId,
      c.id,
      c.customer_id,
      c.owner,
      `Case #${c.id} auto-resolved: ${resolutionNote}`,
      currentDate
    ]);
  }

  return openCases.rows.length;
}

/**
 * Escalate cases that have stayed open for 2 or more simulated days to the manager.
 */
async function checkAndEscalateCases(currentDate) {
  const openCases = await pool.query(`
    SELECT c.*, cust.name as customer_name, cust.salesperson
    FROM cases c
    JOIN customers cust ON cust.id = c.customer_id
    WHERE c.status = 'open';
  `);

  const escalatedCases = [];

  for (const c of openCases.rows) {
    const daysOpen = getDaysDiff(currentDate, c.opened_date);
    if (daysOpen >= 2) {
      const timeline = c.timeline || [];
      timeline.push({
        date: currentDate,
        event: 'escalated',
        note: `Case remained open for ${daysOpen} simulated days without resolution. Automatically escalated to General Manager.`,
      });

      await pool.query(`
        UPDATE cases
        SET status = 'escalated',
            escalated_date = $1,
            timeline = $2,
            updated_at = NOW()
        WHERE id = $3;
      `, [currentDate, JSON.stringify(timeline), c.id]);

      const maxNotifIdRes = await pool.query('SELECT MAX(id) AS max_id FROM notifications;');
      const nextNotifId = (parseInt(maxNotifIdRes.rows[0]?.max_id || 0, 10)) + 1;

      await pool.query(`
        INSERT INTO notifications (id, case_id, customer_id, recipient_role, recipient_name, type, message, simulated_date, created_at)
        VALUES ($1, $2, $3, 'manager', 'General Manager', 'manager_escalation', $4, $5, NOW());
      `, [
        nextNotifId,
        c.id,
        c.customer_id,
        `ESCALATION ALERT: Case #${c.id} for ${c.customer_name} (Owner: ${c.owner}) has been open for ${daysOpen} days without resolution. Attention required.`,
        currentDate
      ]);

      escalatedCases.push(c.id);
    }
  }

  return escalatedCases;
}

/**
 * Fetch all cases with customer, invoice, and timeline information.
 */
async function getAllCases() {
  const result = await pool.query(`
    SELECT 
      c.*,
      cust.name AS customer_name,
      cust.phone AS customer_phone,
      inv.invoice_no,
      inv.amount AS invoice_amount,
      inv.paid_amount AS invoice_paid_amount,
      (inv.amount - inv.paid_amount) AS invoice_balance,
      inv.due_date AS invoice_due_date
    FROM cases c
    JOIN customers cust ON cust.id = c.customer_id
    LEFT JOIN invoices inv ON inv.id = c.invoice_id
    ORDER BY c.id DESC;
  `);

  return result.rows;
}

module.exports = {
  createCase,
  resolveCaseByInvoice,
  checkAndEscalateCases,
  getAllCases,
  getDaysDiff
};
