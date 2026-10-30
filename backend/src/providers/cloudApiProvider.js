const MessageProvider = require('./messageProvider');

/**
 * CloudApiProvider (Meta WhatsApp Business Cloud API Adapter Stub)
 * 
 * How to plug in real WhatsApp Business API in production:
 * 1. Configure META_WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and META_WEBHOOK_VERIFY_TOKEN in .env.
 * 2. In `sendMessage`, make an HTTPS POST request to:
 *    `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
 *    Headers:
 *      Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`
 *      Content-Type: application/json
 *    Body:
 *      {
 *        "messaging_product": "whatsapp",
 *        "recipient_type": "individual",
 *        "to": phone,
 *        "type": "text", // or "template" for approved WhatsApp Cloud Business templates
 *        "text": { "preview_url": false, "body": content }
 *      }
 * 3. In the webhook endpoint (`POST /webhook/incoming`), implement Meta's signature verification
 *    (X-Hub-Signature-256) and extract user messages from `entry[0].changes[0].value.messages[0]`.
 * 4. Handle delivery status callbacks (sent, delivered, read) from `entry[0].changes[0].value.statuses`.
 */
class CloudApiProvider extends MessageProvider {
  constructor() {
    super();
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.token = process.env.META_WHATSAPP_TOKEN || null;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || null;
  }

  async sendMessage({ customerId, phone, content, stageName, sentDate, metadata }) {
    if (!this.token || !this.phoneNumberId) {
      throw new Error(
        'CloudApiProvider is not configured. Set META_WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment variables to activate live Meta Cloud API.'
      );
    }

    // In production, axios or fetch call would be executed here:
    // const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, { ... });
    // return response.json();
    return {
      status: 'cloud_stub_pending',
      phone,
      content,
    };
  }

  async getMessages(customerId) {
    // Cloud API does not store conversation history natively;
    // in production, query the local database outbox table.
    return [];
  }
}

module.exports = CloudApiProvider;
