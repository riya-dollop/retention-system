const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');
const mockProvider = require('../providers/mockProvider');
const caseService = require('./cases');

// Load stages config (checks backend/config/stages.json first per layout specification)
const stagesConfigPath = fs.existsSync(path.join(__dirname, '../../config/stages.json'))
  ? path.join(__dirname, '../../config/stages.json')
  : path.join(__dirname, '../config/stages.json');
const stagesConfig = JSON.parse(fs.readFileSync(stagesConfigPath, 'utf8'));

/**
 * Robust date normalizer supporting string 'YYYY-MM-DD' or JavaScript Date object
 */
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

/**
 * Difference in full calendar days: (date1 - date2)
 */
function getDaysDifference(date1, date2) {
  const d1 = toDateObj(date1);
  const d2 = toDateObj(date2);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format date input to YYYY-MM-DD
 */
function formatDateString(input) {
  if (input instanceof Date) {
    const y = input.getUTCFullYear();
    const m = String(input.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(input).substring(0, 10);
}

/**
 * Helper to record stage execution with explicit ID to ensure full database compatibility
 */
async function recordStageExecution(invoiceId, stageName, simulatedDate) {
  const maxIdRes = await pool.query('SELECT MAX(id) AS max_id FROM stage_executions;');
  const nextId = (parseInt(maxIdRes.rows[0]?.max_id || 0, 10)) + 1;

  await pool.query(`
    INSERT INTO stage_executions (id, invoice_id, stage_name, executed_date, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (invoice_id, stage_name) DO NOTHING;
  `, [nextId, invoiceId, stageName, simulatedDate]);
}

/**
 * Core Stage Engine
 * Evaluates all invoices against configured stages for the given simulated date.
 */
async function runStageEngine(simulatedDate) {
  console.log(`[StageEngine] Running evaluation for simulated date: ${simulatedDate}`);

  // Fetch all open or partially paid invoices with customer data
  const invoiceQuery = `
    SELECT 
      inv.id AS invoice_id,
      inv.invoice_no,
      inv.amount,
      inv.paid_amount,
      (inv.amount - inv.paid_amount) AS balance,
      inv.due_date,
      inv.status AS invoice_status,
      c.id AS customer_id,
      c.name AS customer_name,
      c.phone AS customer_phone,
      c.salesperson,
      c.opt_out,
      c.promise_date
    FROM invoices inv
    JOIN customers c ON c.id = inv.customer_id
    WHERE inv.status != 'paid' AND (inv.amount - inv.paid_amount) > 0
    ORDER BY inv.customer_id ASC, inv.due_date ASC;
  `;

  const { rows: openInvoices } = await pool.query(invoiceQuery);

  const customerActions = new Map();

  for (const inv of openInvoices) {
    // Check 1: Opt-Out (STOP) - Scenario 5
    if (inv.opt_out) {
      continue;
    }

    // Check 2: Promise to Pay Pause - Scenario 3
    if (inv.promise_date) {
      const promiseDiff = getDaysDifference(simulatedDate, inv.promise_date);
      if (promiseDiff <= 0) {
        continue;
      }
    }

    // Check 3: Active Dispute Pause - Scenario 4
    const disputeCheck = await pool.query(`
      SELECT id FROM cases
      WHERE customer_id = $1 AND case_type = 'dispute' AND status IN ('open', 'waiting', 'escalated')
      LIMIT 1;
    `, [inv.customer_id]);

    if (disputeCheck.rows.length > 0) {
      continue;
    }

    // Calculate days from due date: (simulatedDate - due_date)
    const daysFromDue = getDaysDifference(simulatedDate, inv.due_date);

    // Eligible stages where daysFromDue >= stage.dayOffset
    const eligibleStages = stagesConfig.stages
      .filter((s) => daysFromDue >= s.dayOffset)
      .sort((a, b) => b.dayOffset - a.dayOffset);

    for (const stage of eligibleStages) {
      const execCheck = await pool.query(`
        SELECT id FROM stage_executions
        WHERE invoice_id = $1 AND stage_name = $2
        LIMIT 1;
      `, [inv.invoice_id, stage.name]);

      if (execCheck.rows.length === 0) {
        if (!customerActions.has(inv.customer_id)) {
          customerActions.set(inv.customer_id, {
            customer: {
              id: inv.customer_id,
              name: inv.customer_name,
              phone: inv.customer_phone,
              salesperson: inv.salesperson,
            },
            items: [],
          });
        }

        customerActions.get(inv.customer_id).items.push({
          invoice: inv,
          stage: stage,
          daysFromDue: daysFromDue,
        });

        break;
      }
    }
  }

  const executedRecords = [];

  for (const [customerId, action] of customerActions.entries()) {
    const { customer, items } = action;

    if (items.length === 1) {
      const { invoice, stage } = items[0];
      const messageContent = stage.template
        .replace('{name}', customer.name)
        .replace('{invoice_no}', invoice.invoice_no)
        .replace('{balance}', Number(invoice.balance).toFixed(2))
        .replace('{due_date}', formatDateString(invoice.due_date))
        .replace('{salesperson}', customer.salesperson);

      // Record this stage and mark all earlier stages as completed so they never fire backwards
      const allEarlierStages = stagesConfig.stages.filter((s) => s.dayOffset <= stage.dayOffset);
      for (const s of allEarlierStages) {
        await recordStageExecution(invoice.invoice_id, s.name, simulatedDate);
      }

      // If firm_followup stage (+7 days), open a salesperson case
      if (stage.name === 'firm_followup') {
        await caseService.createCase({
          customerId: customer.id,
          invoiceId: invoice.invoice_id,
          caseType: 'firm_followup',
          owner: customer.salesperson,
          currentDate: simulatedDate,
          eventNote: `Invoice ${invoice.invoice_no} reached firm follow-up stage (7+ days overdue). Balance: Rs ${invoice.balance}`,
        });
      }

      // If final_notice stage (+15 days), escalate to manager
      if (stage.name === 'final_notice') {
        await caseService.createCase({
          customerId: customer.id,
          invoiceId: invoice.invoice_id,
          caseType: 'firm_followup',
          owner: 'General Manager',
          currentDate: simulatedDate,
          eventNote: `FINAL NOTICE: Invoice ${invoice.invoice_no} is 15+ days overdue. Escalated directly to Manager.`,
        });
      }

      const outboxMsg = await mockProvider.sendMessage({
        customerId: customer.id,
        phone: customer.phone,
        content: messageContent,
        stageName: stage.name,
        sentDate: simulatedDate,
        metadata: {
          invoice_id: invoice.invoice_id,
          invoice_no: invoice.invoice_no,
          balance: invoice.balance,
          stage: stage.name,
        },
      });

      executedRecords.push({
        customerId: customer.id,
        phone: customer.phone,
        type: 'single',
        stage: stage.name,
        messageId: outboxMsg.id,
        content: messageContent,
      });

    } else if (items.length > 1) {
      // Multiple overdue invoices -> COMBINE INTO ONE MESSAGE (Scenario 6)
      const totalBalance = items.reduce((acc, curr) => acc + Number(curr.invoice.balance), 0);
      const invoiceLines = items
        .map((it) => `- ${it.invoice.invoice_no}: Rs ${Number(it.invoice.balance).toFixed(2)} (Due ${formatDateString(it.invoice.due_date)})`)
        .join('\n');

      const combinedContent = `Hi ${customer.name}, you have ${items.length} overdue invoices totaling Rs ${totalBalance.toFixed(2)}:\n${invoiceLines}\nPlease settle your outstanding wholesale balance today. Reply PAID or PROMISE <date>.`;

      const highestStage = items.sort((a, b) => b.stage.dayOffset - a.stage.dayOffset)[0].stage;

      for (const it of items) {
        const allEarlier = stagesConfig.stages.filter((s) => s.dayOffset <= it.stage.dayOffset);
        for (const s of allEarlier) {
          await recordStageExecution(it.invoice.invoice_id, s.name, simulatedDate);
        }

        if (it.stage.name === 'firm_followup' || it.stage.name === 'final_notice') {
          await caseService.createCase({
            customerId: customer.id,
            invoiceId: it.invoice.invoice_id,
            caseType: 'firm_followup',
            owner: it.stage.name === 'final_notice' ? 'General Manager' : customer.salesperson,
            currentDate: simulatedDate,
            eventNote: `Invoice ${it.invoice.invoice_no} combined in overdue dispatch. Stage: ${it.stage.name}`,
          });
        }
      }

      const outboxMsg = await mockProvider.sendMessage({
        customerId: customer.id,
        phone: customer.phone,
        content: combinedContent,
        stageName: `combined_${highestStage.name}`,
        sentDate: simulatedDate,
        metadata: {
          invoices: items.map((i) => i.invoice.invoice_no),
          totalBalance: totalBalance,
        },
      });

      executedRecords.push({
        customerId: customer.id,
        phone: customer.phone,
        type: 'combined',
        invoicesCount: items.length,
        totalBalance: totalBalance,
        messageId: outboxMsg.id,
        content: combinedContent,
      });
    }
  }

  return {
    simulatedDate,
    evaluatedInvoices: openInvoices.length,
    messagesDispatched: executedRecords.length,
    details: executedRecords,
  };
}

module.exports = {
  runStageEngine,
  getDaysDifference,
  formatDateString,
  recordStageExecution
};
