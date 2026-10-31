const { getCurrentDate, advanceClock } = require('./clock');

let schedulerInterval = null;
let isExecuting = false;

// Default interval: 5 minutes (in milliseconds)
const DEFAULT_INTERVAL_MS = (parseInt(process.env.AUTOMATION_INTERVAL_MINUTES, 10) || 5) * 60 * 1000;

/**
 * Execute a single cycle of the automated retention & overdue inspection.
 */
async function runAutomationCycle() {
  if (isExecuting) {
    console.log('[Auto Scheduler] Previous cycle still running, skipping this tick.');
    return;
  }

  isExecuting = true;
  const timestamp = new Date().toISOString();

  try {
    const clockDate = await getCurrentDate();
    console.log(`\n=======================================================`);
    console.log(`⏰ [Auto Scheduler] [${timestamp}] Running Automated Retention Scan`);
    console.log(`   Simulated Date: ${clockDate}`);
    console.log(`   Inspecting: Invoices (-2d, 0d, +3d, +7d, +15d), Case Escalations, Offers & Churn`);
    console.log(`=======================================================`);

    // advanceClock(0) executes all evaluation engines for the current date without altering the date
    const result = await advanceClock(0);

    const sentCount = result.audit?.engine?.messagesSent?.length || 0;
    const escalatedCount = result.audit?.escalations?.escalated?.length || 0;
    const offersCount = result.audit?.offers?.offersSent?.length || 0;
    const reordersCount = result.audit?.reorders?.remindersSent?.length || 0;

    console.log(`✅ [Auto Scheduler] Scan Completed:`);
    console.log(`   - Overdue/Due Messages Sent: ${sentCount}`);
    console.log(`   - Cases Escalated to Manager: ${escalatedCount}`);
    console.log(`   - Early Pay / Winback Offers: ${offersCount}`);
    console.log(`   - Churn Reorder Prompts:     ${reordersCount}`);
    if (sentCount > 0) {
      result.audit.engine.messagesSent.forEach((msg) => {
        console.log(`   -> [WhatsApp Dispatched] Customer: ${msg.customerName} (${msg.phone}) | Stage: ${msg.stageName} | Invoices: ${msg.invoiceCount}`);
      });
    }
  } catch (err) {
    console.error('❌ [Auto Scheduler Error]:', err.message);
  } finally {
    isExecuting = false;
  }
}

/**
 * Start the background automation scheduler.
 * @param {number} intervalMs - Interval in milliseconds (defaults to 5 minutes)
 */
function startScheduler(intervalMs = DEFAULT_INTERVAL_MS) {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_SCHEDULER === 'true') {
    return;
  }

  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  const minutes = Math.round(intervalMs / 60000);
  console.log(`🚀 [Auto Scheduler] Background worker initialized. Interval: every ${minutes} minute(s).`);

  // Run initial scan 3 seconds after server startup
  setTimeout(() => {
    runAutomationCycle();
  }, 3000);

  // Recurring interval every 5 minutes
  schedulerInterval = setInterval(() => {
    runAutomationCycle();
  }, intervalMs);
}

/**
 * Stop the background scheduler.
 */
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 [Auto Scheduler] Background worker stopped.');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  runAutomationCycle,
};

