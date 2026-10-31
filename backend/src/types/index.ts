export type CustomerTier = 'Gold' | 'Silver' | 'Bronze' | 'Standard';

export interface CustomerEntity {
  id: number;
  name: string;
  phone: string;
  tier: CustomerTier;
  salesperson: string;
  credit_terms: number;
  opt_out: boolean;
  promise_date: string | null;
  created_at?: Date | string;
}

export interface InvoiceEntity {
  id: number;
  customer_id: number;
  invoice_no: string;
  amount: number;
  paid_amount: number;
  issued_date: string;
  due_date: string;
  status: 'unpaid' | 'partially_paid' | 'paid';
  created_at?: Date | string;
}

export interface StageDefinition {
  name: string;
  day_offset: number;
  description: string;
  action: 'message' | 'case' | 'escalate';
  template: string;
}

export interface StagesConfig {
  stages: StageDefinition[];
}

export interface OfferDefinition {
  code: string;
  type: string;
  discount_pct: number;
  valid_days: number;
  trigger_condition: string;
}

export interface OffersConfig {
  offers: OfferDefinition[];
}

export interface WebhookIncomingRequest {
  customer_id: number;
  text: string;
}

export interface PaymentRequest {
  invoice_no: string;
  amount: number;
}

export interface CaseEntity {
  id: number;
  customer_id: number;
  invoice_id: number | null;
  case_type: 'firm_followup' | 'dispute' | 'promise_to_pay' | 'reorder_dropoff';
  owner: string;
  status: 'open' | 'waiting' | 'escalated' | 'resolved';
  opened_date: string;
  escalated_date: string | null;
  timeline: Array<{ date: string; event: string; note: string }>;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface NotificationEntity {
  id: number;
  case_id?: number | null;
  customer_id?: number | null;
  recipient_role: 'salesperson' | 'manager';
  recipient_name?: string | null;
  type: string;
  message: string;
  is_read: boolean;
  simulated_date: string;
  created_at?: Date | string;
}
