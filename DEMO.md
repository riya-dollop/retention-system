# Retention System — Interactive Demo & Reviewer Walkthrough

This document guides the reviewer through verifying every feature of the Wholesale Retention & Payment Follow-up System in under 5 minutes, either through the **Browser UI** (`http://localhost:3000`) or via the **Interactive Swagger Playground** (`http://localhost:4000/api-docs`).

---

## 1. Demo Environments & URLs

| Surface | URL | Description |
| :--- | :--- | :--- |
| **WhatsApp Mock Chat** | [http://localhost:3000](http://localhost:3000) | Customer chat selector, message bubbles, double ticks, reply simulation chips, fast-forward clock. |
| **Staff & Escalation Panel** | [http://localhost:3000/staff](http://localhost:3000/staff) | Case management, 2-day manager escalation alerts, case event timeline modal, receivables aging buckets. |
| **Swagger OpenAPI Docs** | [http://localhost:4000/api-docs](http://localhost:4000/api-docs) | Interactive Swagger UI to execute and inspect all REST API endpoints. |

---

## 2. Walkthrough of the Six Mandatory Reviewer Scenarios

### Scenario 1: Customer Pays Before Due Date → No Follow-up Sent
1. Open the WhatsApp Chat page at `http://localhost:3000`.
2. Select **Metro Mart** (`+919876543211`) from the customer directory.
3. Observe invoice `INV-1004` (Amount: ₹50,000) is due on `2026-10-22` (current fake clock is `2026-10-20`).
4. Click **Record Payment** in the top-right header, select `INV-1004`, and click **Pay 100% Full (₹50,000)**.
5. In the fake clock banner at the top, click **+7 Days** to advance the date past the due date to `2026-10-27`.
6. **Result**: Observe the chat feed — no follow-up reminder was ever sent for `INV-1004`!

---

### Scenario 2: Customer Pays 40% on Day +3 → Next Reminder Shows Reduced Balance
1. Select **Royal Supermarket** (`+919876543212`).
2. Royal Supermarket has invoice `INV-1006` of ₹60,000 due on `2026-10-17` (3 days overdue on baseline date `2026-10-20`).
3. Click **Record Payment**, select `INV-1006`, and click **Pay 40% Partial (₹24,000)**.
4. The remaining balance immediately becomes **₹36,000.00**.
5. Click **+7 Days** in the fake clock banner to move the date to day +7 (`firm_followup` stage).
6. **Result**: The firm follow-up reminder sent to the customer explicitly shows the reduced balance:
   > *"URGENT: Hi Royal Supermarket, invoice INV-1006 of Rs 36000.00 is now 7 days overdue (2026-10-17)..."*

---

### Scenario 3: Customer Replies PROMISE with Date → Reminders Pause Until That Date
1. Select **FreshCorner Wholesale** (`+919876543216`).
2. Notice an overdue follow-up in the chat feed.
3. In the reply bar at the bottom, click the quick action chip **`PROMISE 2026-11-05`** (or type `PROMISE 2026-11-05` and send).
4. Advance the clock by **+3 Days**.
5. **Result**: During the promised window, no new collection reminders are sent.
6. Open the Staff Panel (`/staff`) — observe a case of type **Promise to Pay** is created in `waiting` status.
7. Advance the clock past `2026-11-05` — reminders automatically resume if unpaid!

---

### Scenario 4: Customer Replies DISPUTE → Collections Pause, Dispute Case Opens
1. Select **Bharat Provisions** (`+919876543217`).
2. In the reply bar, click the **`DISPUTE`** chip.
3. Advance the clock forward by **+7 Days** or **+15 Days**.
4. **Result**: Automated reminders for Bharat Provisions remain completely paused.
5. Navigate to the **Staff Panel** (`http://localhost:3000/staff`).
6. Observe that a new **Customer Dispute** case has been opened and assigned to the customer's salesperson (*Priya Patel*). Click **Timeline** to view the audit record.

---

### Scenario 5: Customer Replies STOP → No Further Messages & Salesperson Notified
1. Select **Modern Essentials** (`+919876543218`).
2. Click the **`STOP`** simulation chip in the reply bar.
3. Observe the customer profile updates with a red **`STOP` (Opted Out)** badge.
4. Advance the clock forward by **+15 Days**.
5. **Result**: Zero subsequent outbound messages are sent to this customer.
6. Check **Staff Alerts** (the bell icon) — an alert notification confirms:
   > *"OPT-OUT ALERT: Customer Modern Essentials (+919876543218) replied STOP. All automated outreach halted."*

---

### Scenario 6: Customer Has 3 Overdue Invoices → One Combined Message, Not Three
1. Click **Reset Seed** in the top clock bar to restore the baseline dataset.
2. Select **Apex Retailers** (`+919876543210`).
3. Apex Retailers has three separate invoices due on `2026-10-17`:
   - `INV-1001`: ₹45,000
   - `INV-1002`: ₹32,000
   - `INV-1003`: ₹18,500
4. Click **+1 Day** in the fake clock banner to move to `2026-10-21`.
5. **Result**: Check the chat feed — instead of spamming 3 separate messages, the customer receives **exactly one combined WhatsApp message**:
   > *"Hi Apex Retailers, you have 3 overdue invoices totaling Rs 95500.00:*  
   > *- INV-1001: Rs 45000.00 (Due 2026-10-17)*  
   > *- INV-1002: Rs 32000.00 (Due 2026-10-17)*  
   > *- INV-1003: Rs 18500.00 (Due 2026-10-17)*  
   > *Please settle your outstanding wholesale balance today."*

---

## 3. Manager Escalation Walkthrough (The 2-Day Rule)

1. When an invoice reaches the **Firm Follow-up (+7 days)** stage, a case is automatically created for the salesperson.
2. Advance the simulated clock by **+3 Days**.
3. Any case that remained in `open` status for $\ge 2$ simulated days is **automatically escalated to the General Manager**.
4. In the **Staff Panel (`/staff`)**:
   - The case status badge updates to a flashing red **`Escalated (Manager)`**.
   - An alert appears in the **Staff Alerts Drawer** notifying management:  
     *"ESCALATION ALERT: Case #... has been open for 3 days without resolution. Attention required."*
5. Click **Timeline** to inspect the timestamped audit log.
6. When the customer or reviewer records full payment for that invoice, the case **automatically resolves** without duplicate cases.

---

## 4. Retention Offers & Reorder Reminders Walkthrough

### 1. Win-Back Coupon (`WINBACK10`)
- Customer **Modern Essentials** (`+919876543218`) has had no order in 52 days.
- Advance the clock by **+1 Day** — the system evaluates order gap churn and dispatches a **10% Win-Back Coupon**:
  > *"We miss you, Modern Essentials! It has been over 45 days since your last order. Here is a 10% discount coupon code: WINBACK10 (valid for 7 days)..."*

### 2. Predictive Reorder & `YES` Draft Order
- When a customer reaches **90%** of their regular purchasing gap, they receive a reorder prompt listing their last ordered goods.
- Click the **`YES`** chip in the reply bar.
- The webhook instantly creates a new order in `draft` status in `past_orders` and replies with a confirmation stating the draft restock order number.

---

## 5. Automated Test Suite Execution

To execute the automated regression test suite:

```bash
cd backend
npm test
```

Expected output:
```text
PASS tests/engine.test.js
  Wholesale Retention System - Engine Invariants & Edge Cases
    ✓ Idempotency: Advancing clock by 0 or calling engine twice on same day produces no duplicate messages
    ✓ Case Escalation: Open case open for >= 2 simulated days escalates to Manager
    ✓ Auto-resolve: Paying invoice auto-resolves any associated open cases
    ✓ Reorder & YES reply: YES reply generates a draft order with items from prior order
    ✓ Offers Exclusion: Customers with 15+ days overdue invoice never receive offers

PASS tests/scenarios.test.js
  Wholesale Retention System - The Six Required Scenarios
    ✓ Scenario 1: Customer pays before due date -> No follow-up is ever sent
    ✓ Scenario 2: Customer pays 40% on day +3 -> Next reminder shows the reduced balance
    ✓ Scenario 3: Customer replies PROMISE with a date -> Reminders pause until date, then resume at firmer stage
    ✓ Scenario 4: Customer replies DISPUTE -> Collections pause, dispute case opens for salesperson
    ✓ Scenario 5: Customer replies STOP -> No further messages; salesperson is notified
    ✓ Scenario 6: Customer has 3 overdue invoices -> One combined message, not three

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```
