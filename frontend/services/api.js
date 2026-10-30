const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Clock
  getClock: () => fetchJson('/clock'),
  advanceClock: (days = 1) => fetchJson(`/clock/advance?days=${days}`, { method: 'POST' }),

  // Seed / Reset
  resetDatabase: () => fetchJson('/seed/reset', { method: 'POST' }),

  // Customers & Messages
  getCustomers: () => fetchJson('/customers'),
  getCustomerMessages: (customerId) => fetchJson(`/customers/${customerId}/messages`),
  markMessagesRead: (customerId) => fetchJson(`/customers/${customerId}/read`, { method: 'POST' }),

  // Payments
  recordPayment: (paymentData) => fetchJson('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  // Incoming Webhook (Customer Replies)
  sendWebhookReply: (replyData) => fetchJson('/webhook/incoming', {
    method: 'POST',
    body: JSON.stringify(replyData),
  }),

  // Cases & Escalations
  getCases: () => fetchJson('/cases'),
  updateCase: (caseId, updateData) => fetchJson(`/cases/${caseId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),

  // Notifications
  getNotifications: (role = 'all') => fetchJson(`/notifications?role=${role}`),
  markNotificationRead: (id) => fetchJson(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Offers & Reorders
  getOffers: () => fetchJson('/offers'),
  getReorderRecommendations: () => fetchJson('/reorder/recommendations'),
};
