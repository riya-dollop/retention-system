export type CustomerTier = 'Gold' | 'Silver' | 'Bronze' | 'Standard';

export interface Invoice {
  id: number;
  customer_id: number;
  invoice_no: string;
  amount: number | string;
  paid_amount: number | string;
  issued_date: string;
  due_date: string;
  status: 'unpaid' | 'partially_paid' | 'paid';
  created_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  tier: CustomerTier;
  salesperson: string;
  credit_terms: number;
  opt_out: boolean;
  promise_date: string | null;
  total_outstanding?: number;
  active_cases_count?: number;
  invoices?: Invoice[];
  created_at?: string;
}

export interface OutboxMessage {
  id: number;
  customer_id: number;
  phone: string;
  direction: 'inbound' | 'outbound';
  content: string;
  status: 'sent' | 'delivered' | 'read';
  stage_name: string | null;
  metadata?: Record<string, any>;
  sent_date: string;
  created_at?: string;
}

export type CaseStatus = 'open' | 'waiting' | 'escalated' | 'resolved';
export type CaseType = 'firm_followup' | 'dispute' | 'promise_to_pay' | 'reorder_dropoff';

export interface CaseTimelineItem {
  date: string;
  event: 'created' | 'update' | 'escalated' | 'resolved' | 'note';
  note: string;
}

export interface CaseItem {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  invoice_id: number | null;
  invoice_no?: string;
  invoice_amount?: number | string;
  invoice_paid_amount?: number | string;
  invoice_balance?: number | string;
  invoice_due_date?: string;
  case_type: CaseType;
  owner: string;
  status: CaseStatus;
  opened_date: string;
  escalated_date?: string | null;
  timeline: CaseTimelineItem[] | string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffNotification {
  id: number;
  case_id?: number | null;
  customer_id?: number | null;
  recipient_role: 'salesperson' | 'manager';
  recipient_name?: string | null;
  type: string;
  message: string;
  is_read: boolean;
  simulated_date: string;
  created_at?: string;
}

export interface ClockState {
  currentDate: string;
  updatedAt?: string;
}

export interface AdvanceClockResult {
  message: string;
  currentDate: string;
  audit: {
    engine?: { messagesDispatched: number; eligibleInvoices: number };
    escalations?: number[];
    offers?: any[];
    reorders?: any[];
  };
}

export interface PaymentPayload {
  invoice_no: string;
  amount: number;
}

export interface WebhookPayload {
  customer_id: number;
  text: string;
}

