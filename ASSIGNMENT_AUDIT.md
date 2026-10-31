# Technical Assignment Compliance & Verification Audit

**Project:** Wholesale Customer Retention & Payment Follow-up System  
**Repository:** `https://github.com/riya-dollop/retention-system.git`  
**Evaluation Standard:** 8-Page Technical Assignment Specification Rubric  
**Test Suite Status:** 11/11 Passed (100%)  
**Frontend Compilation:** Clean (TypeScript 0 errors, Next.js 14 App Router)  

---

## 1. Compliance Matrix (By Assignment Section)

### Section 1: Business Context & Core Principles
| Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Wholesale 15–30 day credit model** | **100% Compliant** | Invoices seeded across 15-30 day cycles; stages progressively calculate offset from `due_date`. |
| **Tone escalation without customer alienation** | **100% Compliant** | Stages start polite (`pre_due`, `soft_followup`), escalate to `firm_followup` (assigned to rep), and `final_notice` (assigned to GM). |
| **Idempotence (Repeated execution safety)** | **100% Compliant** | Guaranteed in `backend/src/services/engine.js` with `execution_log` table checking stage execution per invoice; verified in `backend/tests/engine.test.js`. |
| **Auto-Stop on full settlement** | **100% Compliant** | Filter `paid_amount < amount` in engine; recording full payment halts outreach and auto-resolves open cases. |
| **Dynamic balance calculations** | **100% Compliant** | All message templates compute `{balance}` dynamically as `amount - paid_amount`. |

---

### Section 2: Progressive Follow-up Stages (`config/stages.json`)
| Stage | Target Offset | Action & Tone | Verified Files & Tests |
| :--- | :---: | :--- | :--- |
| **Pre-due** | `-2 days` | Polite heads-up with total amount & due date | `stages.json`, `engine.js`, `scenarios.test.js` |
| **Due Day** | `0 days` | Reminder to clear today via UPI/Bank transfer | `stages.json`, `engine.js`, `scenarios.test.js` |
| **Soft Follow-up** | `+3 days` | Polite follow-up with balance reminder | `stages.json`, `engine.js`, `scenarios.test.js` |
| **Firm Notice & Case** | `+7 days` | Firm demand; opens case assigned to salesperson | `stages.json`, `cases.js`, `scenarios.test.js` |
| **Final Notice & GM** | `+15 days` | Final warning; credit hold; escalates to GM | `stages.json`, `cases.js`, `scenarios.test.js` |

---

### Section 3: The Six Mandatory Scenarios
| Scenario | PDF Requirement | Test Status |
| :--- | :--- | :---: |
| **Scenario 1** | Customer pays before due date -> No follow-up message is ever sent | **PASSED** (`tests/scenarios.test.js`) |
| **Scenario 2** | Customer pays 40% on day +3 -> Next reminder shows reduced balance | **PASSED** (`tests/scenarios.test.js`) |
| **Scenario 3** | Customer replies `PROMISE <date>` -> Outreach pauses until date; resumes firmer | **PASSED** (`tests/scenarios.test.js`) |
| **Scenario 4** | Customer replies `DISPUTE` -> Outreach paused; case opened for salesperson | **PASSED** (`tests/scenarios.test.js`) |
| **Scenario 5** | Customer replies `STOP` -> Zero further messages; salesperson alerted | **PASSED** (`tests/scenarios.test.js`) |
| **Scenario 6** | Customer has 3 overdue invoices -> One combined message detailing each | **PASSED** (`tests/scenarios.test.js`) |

---

### Section 4: Retention Offers & Reorder Engine
| Feature | Details | Verification |
| :--- | :--- | :---: |
| **Early Payment (`EARLYPAY2`)** | 2% discount offer for settling within 3 days | `backend/src/services/offers.js` & `config/offers.json` |
| **Win-back Voucher (`WINBACK10`)** | 10% coupon for retailers with no order in 45+ days | `backend/src/services/offers.js` & `config/offers.json` |
| **Exclusion Rule** | Retailers with any invoice 15+ days overdue excluded from offers | **PASSED** (`tests/engine.test.js`) |
| **Predictive Reorder Cadence** | Reorder reminder dispatched when gap reaches 90% of order interval | `backend/src/services/reorder.js` |
| **Draft Order Generation** | Customer replying `YES` automatically creates a `draft` order in database | **PASSED** (`tests/engine.test.js`) |

---

### Section 5: Staff Operations Center & Case Escalations
| Feature | Implementation | UI Location |
| :--- | :--- | :--- |
| **2-Day Auto-Escalation** | Cases unresolved for $\ge 2$ simulated days automatically escalate to General Manager | `backend/src/services/cases.js` & `backend/tests/engine.test.js` |
| **Case Timeline Audit** | Full immutable audit trail recording status changes, notes, and reassignment | `frontend/components/TimelineModal.tsx` |
| **Staff Notifications** | Notification drawer with unread count badges and one-click mark as read | `frontend/components/NotificationDrawer.tsx` |
| **Aging Bucket Breakdown** | Receivables breakdown across `0-3d`, `4-7d`, `8-14d`, `15+d` with total exposure | `frontend/components/AgingBucketWidget.tsx` |
| **Case Resolution Slot Anchor** | Resolving a case does not shift action buttons; timeline remains properly positioned | `frontend/components/CaseTable.tsx` |

---

### Section 6: User Interface Polish & Responsiveness
| UX Requirement | Status | Implementation Details |
| :--- | :---: | :--- |
| **Independent Viewport Scroll** | **Completed** | Full-height layout (`h-screen overflow-hidden`) with dedicated internal scroll areas for customer list, chat thread, and data tables. |
| **Reusable `DataTable`** | **Completed** | Sticky headers, search filtering across multiple fields, row pagination (`5/10/20`), first/prev/next/last navigation controls. |
| **Reusable Searchable `Dropdown`** | **Completed** | Floating dropdown menu escaping modal clipping with status badges and keyboard dismissal. |
| **Smooth Drawer/Modal Transitions** | **Completed** | CSS transitions for 250ms ease-out animations with backdrop dismiss using `e.stopPropagation()`. |
| **Title Case Quick Simulation Chips** | **Completed** | Simulation buttons and chat bubble text standardized to Title Case: `Paid`, `Promise 2026-11-05`, `Dispute`, `Stop`, `Yes`. |
| **Clean ISO Date Formatting** | **Completed** | Display dates formatted cleanly as `YYYY-MM-DD` without trailing timestamps. |

---

### Section 7: Automated Scheduler
| Feature | Details | Configuration |
| :--- | :--- | :--- |
| **Cron / Interval Worker** | Evaluates invoice due dates and retention rules every 5 minutes in background | `backend/src/services/scheduler.js` (`AUTOMATION_INTERVAL_MINUTES=5`) |
| **Boot Scan** | Runs initial evaluation 3 seconds after server launch | Auto-triggered on boot |
| **Test Environment Guard** | Automatically disabled during Jest test runs | Prevent concurrency and race conditions |

---

## 2. Test Execution Summary

```text
PASS tests/scenarios.test.js
  Wholesale Retention System - The Six Required Scenarios
    √ Scenario 1: Customer pays before due date -> No follow-up is ever sent
    √ Scenario 2: Customer pays 40% on day +3 -> Next reminder shows the reduced balance
    √ Scenario 3: Customer replies PROMISE with a date -> Reminders pause until date, then resume at firmer stage
    √ Scenario 4: Customer replies DISPUTE -> Collections pause, dispute case opens for salesperson
    √ Scenario 5: Customer replies STOP -> No further messages; salesperson is notified
    √ Scenario 6: Customer has 3 overdue invoices -> One combined message, not three

PASS tests/engine.test.js
  Wholesale Retention System - Engine Invariants & Edge Cases
    √ Idempotency: Advancing clock by 0 or calling engine twice on same day produces no duplicate messages
    √ Case Escalation: Open case open for >= 2 simulated days escalates to Manager
    √ Auto-resolve: Paying invoice auto-resolves any associated open cases
    √ Reorder & YES reply: YES reply generates a draft order with items from prior order
    √ Offers Exclusion: Customers with 15+ days overdue invoice never receive offers

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Snapshots:   0 total
```

