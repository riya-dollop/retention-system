import {
  Customer,
  OutboxMessage,
  CaseItem,
  StaffNotification,
  ClockState,
  AdvanceClockResult,
  PaymentPayload,
  WebhookPayload
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  getClock: (): Promise<ClockState> => fetchJson<ClockState>('/clock'),
  advanceClock: (days = 1): Promise<AdvanceClockResult> =>
    fetchJson<AdvanceClockResult>(`/clock/advance?days=${days}`, { method: 'POST' }),

  // Seed / Reset
  resetDatabase: (): Promise<{ message: string; clockDate: string }> =>
    fetchJson<{ message: string; clockDate: string }>('/seed/reset', { method: 'POST' }),

  // Customers & Messages
  getCustomers: (): Promise<Customer[]> => fetchJson<Customer[]>('/customers'),
  getCustomerMessages: (customerId: number): Promise<OutboxMessage[]> =>
    fetchJson<OutboxMessage[]>(`/customers/${customerId}/messages`),
  markMessagesRead: (customerId: number): Promise<{ success: boolean }> =>
    fetchJson<{ success: boolean }>(`/customers/${customerId}/read`, { method: 'POST' }),

  // Payments
  recordPayment: (paymentData: PaymentPayload): Promise<{ message: string; remainingBalance: number; invoice: any }> =>
    fetchJson('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  // Incoming Webhook (Customer Replies)
  sendWebhookReply: (replyData: WebhookPayload): Promise<any> =>
    fetchJson('/webhook/incoming', {
      method: 'POST',
      body: JSON.stringify(replyData),
    }),

  // Cases & Escalations
  getCases: (): Promise<CaseItem[]> => fetchJson<CaseItem[]>('/cases'),
  updateCase: (caseId: number, updateData: { status?: string; note?: string }): Promise<CaseItem> =>
    fetchJson<CaseItem>(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),

  // Notifications
  getNotifications: (role = 'all'): Promise<StaffNotification[]> =>
    fetchJson<StaffNotification[]>(`/notifications?role=${role}`),
  markNotificationRead: (id: number): Promise<{ success: boolean }> =>
    fetchJson<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Offers & Reorders
  getOffers: (): Promise<any[]> => fetchJson('/offers'),
  getReorderRecommendations: (): Promise<any[]> => fetchJson('/reorder/recommendations'),
};
