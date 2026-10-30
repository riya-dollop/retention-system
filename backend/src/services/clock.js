const { pool } = require('../db/pool');

/**
 * Helper to format a Date object as YYYY-MM-DD
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retrieve the current simulated clock date.
 */
async function getCurrentDate() {
  const res = await pool.query('SELECT simulated_date FROM system_clock WHERE id = 1 LIMIT 1;');
  if (!res.rows || res.rows.length === 0) {
    const defaultDate = '2026-10-20';
    await pool.query('INSERT INTO system_clock (id, simulated_date) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET simulated_date = $1;', [defaultDate]);
    return defaultDate;
  }
  return formatDate(res.rows[0].simulated_date);
}

/**
 * Manually set the simulated clock date.
 */
async function setCurrentDate(dateStr) {
  await pool.query('UPDATE system_clock SET simulated_date = $1, updated_at = NOW() WHERE id = 1;', [dateStr]);
  return dateStr;
}

/**
 * Advance simulated clock by N days and trigger all operational workflows.
 */
async function advanceClock(days = 1) {
  const numericDays = parseInt(days, 10);
  const oldDateStr = await getCurrentDate();
  
  let newDateStr = oldDateStr;
  if (!isNaN(numericDays) && numericDays !== 0) {
    const d = new Date(`${oldDateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + numericDays);
    newDateStr = formatDate(d);
    await setCurrentDate(newDateStr);
  }

  // Lazy-load services to prevent circular dependency cycles
  const engineService = require('./engine');
  const caseService = require('./cases');
  const reorderService = require('./reorder');
  const offerService = require('./offers');

  // 1. Run stage engine for payments
  const engineResult = await engineService.runStageEngine(newDateStr);

  // 2. Check and escalate cases open >= 2 days
  const caseResult = await caseService.checkAndEscalateCases(newDateStr);

  // 3. Check churn & reorder reminders
  const reorderResult = await reorderService.checkReorders(newDateStr);

  // 4. Check early payment & win-back offers
  const offerResult = await offerService.evaluateOffers(newDateStr);

  return {
    success: true,
    previousDate: oldDateStr,
    currentDate: newDateStr,
    daysAdvanced: isNaN(numericDays) ? 0 : numericDays,
    audit: {
      engine: engineResult,
      escalations: caseResult,
      reorders: reorderResult,
      offers: offerResult,
    }
  };
}

module.exports = {
  getCurrentDate,
  setCurrentDate,
  advanceClock,
  formatDate
};
