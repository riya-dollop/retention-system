/**
 * MessageProvider Interface
 * Base contract for sending WhatsApp / Outbound messages across the system.
 */
class MessageProvider {
  /**
   * Send an outbound message to a customer.
   * @param {Object} options
   * @param {number} options.customerId - Database ID of the customer
   * @param {string} options.phone - Recipient phone number in E.164 or national format
   * @param {string} options.content - The text message body
   * @param {string} [options.stageName] - Optional name of the follow-up stage or offer
   * @param {string} [options.sentDate] - Current simulated date (YYYY-MM-DD)
   * @param {Object} [options.metadata] - Optional arbitrary metadata (e.g., invoice numbers, offers)
   * @returns {Promise<Object>} The dispatched message record
   */
  async sendMessage(options) {
    throw new Error('sendMessage() must be implemented by the message provider subclass');
  }

  /**
   * Retrieve messages sent to a customer.
   * @param {number} customerId
   * @returns {Promise<Array>} List of messages
   */
  async getMessages(customerId) {
    throw new Error('getMessages() must be implemented by the message provider subclass');
  }
}

module.exports = MessageProvider;
