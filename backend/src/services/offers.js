const fs = require('fs');
const path = require('path');
const { pool } = require('../db/pool');
const mockProvider = require('../providers/mockProvider');

const offersConfigPath = fs.existsSync(path.join(__dirname, '../../config/offers.json'))
  ? path.join(__dirname, '../../config/offers.json')
  : path.join(__dirname, '../config/offers.json');
const offersConfig = JSON.parse(fs.readFileSync(offersConfigPath, 'utf8'));

/**
 * Add days to YYYY-MM-DD
 */
function addDaysToDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Difference in full days (date1 - date2)
 */
function dateDifference(date1Str, date2Str) {
  const d1 = new Date(`${date1Str}T00:00:00Z`);
  const d2 = new Date(`${date2Str}T00:00:00Z`);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Evaluate and dispatch eligible offers.
 */
async function evaluateOffers(simulatedDate) {
  const dispatchedOffers = [];

  const customersRes = await pool.query('SELECT * FROM customers WHERE opt_out = false;');
  const customers = customersRes.rows;

  for (const customer of customers) {
    // Exclusion Rule: "Customers with invoices 15+ days overdue never receive offers."
    const unpaidInvoicesRes = await pool.query(`
      SELECT due_date FROM invoices
      WHERE customer_id = $1 
        AND status != 'paid' 
        AND (amount - paid_amount) > 0;
    `, [customer.id]);

    const isExcluded = unpaidInvoicesRes.rows.some((inv) => {
      const formattedDue = String(inv.due_date).substring(0, 10);
      return dateDifference(simulatedDate, formattedDue) >= 15;
    });

    if (isExcluded) {
      continue; // Disqualified from all offers
    }

    // 1. Evaluate Offer: EARLYPAY2 (Early-Payment Discount 2%)
    // Triggered on invoice day (issued_date = simulatedDate)
    const earlyPayConfig = offersConfig.offers.find((o) => o.code === 'EARLYPAY2');
    if (earlyPayConfig) {
      const offerExists = await pool.query(`
        SELECT id FROM customer_offers
        WHERE customer_id = $1 AND offer_code = 'EARLYPAY2'
        LIMIT 1;
      `, [customer.id]);

      if (offerExists.rows.length === 0) {
        const todaysInvoices = await pool.query(`
          SELECT * FROM invoices
          WHERE customer_id = $1 AND status != 'paid'
        `, [customer.id]);

        const matchingInv = todaysInvoices.rows.find((inv) => {
          const formattedIssued = String(inv.issued_date).substring(0, 10);
          return formattedIssued === simulatedDate;
        });

        if (matchingInv) {
          const savings = (Number(matchingInv.amount) * 0.02).toFixed(2);
          const expiresDate = addDaysToDate(simulatedDate, earlyPayConfig.validDays);

          await pool.query(`
            INSERT INTO customer_offers (customer_id, offer_code, granted_date, expires_date, is_used)
            VALUES ($1, 'EARLYPAY2', $2, $3, false);
          `, [customer.id, simulatedDate, expiresDate]);

          const message = earlyPayConfig.template
            .replace('{name}', customer.name)
            .replace('{invoice_no}', matchingInv.invoice_no)
            .replace('{savings}', savings);

          await mockProvider.sendMessage({
            customerId: customer.id,
            phone: customer.phone,
            content: message,
            stageName: 'offer_earlypay',
            sentDate: simulatedDate,
            metadata: { offer_code: 'EARLYPAY2', invoice_no: matchingInv.invoice_no, savings },
          });

          dispatchedOffers.push({ customerId: customer.id, offer: 'EARLYPAY2', invoice: matchingInv.invoice_no });
        }
      }
    }

    // 2. Evaluate Offer: WINBACK10 (Win-back offer: customers with no order in 45+ days)
    const winbackConfig = offersConfig.offers.find((o) => o.code === 'WINBACK10');
    if (winbackConfig) {
      const offerExists = await pool.query(`
        SELECT id FROM customer_offers
        WHERE customer_id = $1 AND offer_code = 'WINBACK10'
        LIMIT 1;
      `, [customer.id]);

      if (offerExists.rows.length === 0) {
        const lastOrderRes = await pool.query(`
          SELECT MAX(order_date) AS last_order_date
          FROM past_orders
          WHERE customer_id = $1;
        `, [customer.id]);

        const lastOrderDate = lastOrderRes.rows[0]?.last_order_date;
        if (lastOrderDate) {
          const formattedLastDate = String(lastOrderDate).substring(0, 10);
          const daysSinceLastOrder = dateDifference(simulatedDate, formattedLastDate);

          if (daysSinceLastOrder >= winbackConfig.minDaysWithoutOrder) {
            const expiresDate = addDaysToDate(simulatedDate, winbackConfig.validDays);

            await pool.query(`
              INSERT INTO customer_offers (customer_id, offer_code, granted_date, expires_date, is_used)
              VALUES ($1, 'WINBACK10', $2, $3, false);
            `, [customer.id, simulatedDate, expiresDate]);

            const message = winbackConfig.template.replace('{name}', customer.name);

            await mockProvider.sendMessage({
              customerId: customer.id,
              phone: customer.phone,
              content: message,
              stageName: 'offer_winback',
              sentDate: simulatedDate,
              metadata: { offer_code: 'WINBACK10', daysSinceLastOrder },
            });

            dispatchedOffers.push({ customerId: customer.id, offer: 'WINBACK10', daysSinceLastOrder });
          }
        }
      }
    }
  }

  return dispatchedOffers;
}

module.exports = {
  evaluateOffers,
  addDaysToDate,
  dateDifference,
};
