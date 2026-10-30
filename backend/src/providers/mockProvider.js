const MessageProvider = require('./messageProvider');
const { pool } = require('../db/pool');

function formatDateString(input) {
  if (input instanceof Date) {
    const y = input.getUTCFullYear();
    const m = String(input.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(input).substring(0, 10);
}

class MockProvider extends MessageProvider {
  async sendMessage({ customerId, phone, content, stageName = null, sentDate = null, metadata = {} }) {
    const date = sentDate ? formatDateString(sentDate) : new Date().toISOString().split('T')[0];

    const maxIdRes = await pool.query('SELECT MAX(id) AS max_id FROM outbox;');
    const nextId = (parseInt(maxIdRes.rows[0]?.max_id || 0, 10)) + 1;

    const result = await pool.query(`
      INSERT INTO outbox (id, customer_id, phone, direction, content, status, stage_name, metadata, sent_date, created_at)
      VALUES ($1, $2, $3, 'outbound', $4, 'sent', $5, $6, $7, NOW())
      RETURNING *;
    `, [nextId, customerId, phone, content, stageName, JSON.stringify(metadata), date]);

    const message = result.rows[0];

    await pool.query(`
      UPDATE outbox
      SET status = 'delivered'
      WHERE id = $1;
    `, [message.id]);

    message.status = 'delivered';
    console.log(`[MockProvider] Dispatched WhatsApp to ${phone} (Customer #${customerId}) [Stage: ${stageName || 'Manual/Offer'}]: "${content}"`);

    return message;
  }

  async recordInbound({ customerId, phone, content, sentDate = null, metadata = {} }) {
    const date = sentDate ? formatDateString(sentDate) : new Date().toISOString().split('T')[0];

    const maxIdRes = await pool.query('SELECT MAX(id) AS max_id FROM outbox;');
    const nextId = (parseInt(maxIdRes.rows[0]?.max_id || 0, 10)) + 1;

    const result = await pool.query(`
      INSERT INTO outbox (id, customer_id, phone, direction, content, status, stage_name, metadata, sent_date, created_at)
      VALUES ($1, $2, $3, 'inbound', $4, 'read', 'incoming_webhook', $5, $6, NOW())
      RETURNING *;
    `, [nextId, customerId, phone, content, JSON.stringify(metadata), date]);

    return result.rows[0];
  }

  async markAsRead(customerId) {
    await pool.query(`
      UPDATE outbox
      SET status = 'read'
      WHERE customer_id = $1 AND direction = 'outbound' AND status != 'read';
    `, [customerId]);
  }

  async getMessages(customerId) {
    const result = await pool.query(`
      SELECT * FROM outbox
      WHERE customer_id = $1
      ORDER BY id ASC;
    `, [customerId]);

    return result.rows.map((r) => ({
      ...r,
      sent_date: r.sent_date ? formatDateString(r.sent_date) : r.sent_date,
    }));
  }
}

module.exports = new MockProvider();
