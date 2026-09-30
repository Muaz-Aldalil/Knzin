# KNZiN Feature Roadmap & Architectural Gravity Reference

For KNZiN, these features are not strictly "frontend vs backend vs DB". Most are **full-stack**, but their center of gravity differs.

| Feature                    | Frontend    | Backend/API   | Database                        |
| -------------------------- | ----------- | ------------- | ------------------------------- |
| **004 Trust & Engagement** | 🟢 Heavy    | 🟡 Moderate   | 🟡 Light / mostly existing data |
| **005 Learner Hub**        | 🟢 Heavy    | 🟢 Heavy      | 🟢 Heavy                        |
| **006 Affiliate**          | 🟡 Moderate | 🟢 Heavy      | 🟢 Heavy                        |
| **007 Payments**           | 🟡 Moderate | 🟢 Very heavy | 🟢 Very heavy                   |
| **008 Admin**              | 🟢 Heavy    | 🟢 Very heavy | 🟢 Very heavy                   |
| **009 Notifications**      | 🟢 Heavy    | 🟢 Heavy      | 🟡 Moderate                     |

---

### Feature 004: Trust & Engagement

Mostly **frontend + some backend**.

* **Frontend:** How It Works, Hook/Vision, FAQ, WhatsApp button, activity ticker, KYC information card.
* **Backend:** Public activity endpoint and sanitization of order/draw data.
* **DB:** No new schema intended. It reads existing `orders` and `draws`.

---

### Feature 005: Learner Hub

This becomes a major **full-stack + database** feature.

* **Frontend:** Learner dashboard, course/library pages, lessons, downloads, progress, ticket visibility.
* **Backend:** Authorization, content access, progress APIs, ticket generation/business logic.
* **DB:** Likely substantial new schema, especially learner progress/content access/ticket serials.

---

### Feature 006: Affiliate

Primarily **backend + database**, with frontend surfaces.

* **Frontend:** Referral dashboard, referral links, earnings/co-prize display.
* **Backend:** Attribution, referral validation, 40% co-prize calculations, fraud/security rules.
* **DB:** Referral relationships, attribution records, wallet/ledger records, commission state.

> *Note:* This is one of the features where backend/database correctness matters more than UI complexity.

---

### Feature 007: Payments

Very strongly **backend + database**, with a necessary frontend payment flow.

* **Frontend:** Checkout/payment selection, payment status, failure/success states.
* **Backend:** ZainCash/AsiaHawala integration, callbacks/webhooks, verification, idempotency, reconciliation.
* **DB:** Payment transactions, gateway references, statuses, reconciliation state, webhook/idempotency records.

> *Note:* This is a serious backend/financial-integrity feature.

---

### Feature 008: Admin

The most **full-stack backend-heavy** feature.

* **Frontend:** Admin dashboard, user/order/draw management, KYC workflow, winner management, payout UI.
* **Backend:** Authorization, draw execution, RNG/commit-reveal, KYC workflow, payout rules, administrative actions.
* **DB:** Admin/audit records, KYC state, draw execution data, payout records, probably additional indexes/tables.

---

### Feature 009: Notifications

**Full-stack**, with backend-heavy delivery logic.

* **Frontend:** Notification UI, notification center, unread state, preferences.
* **Backend:** Notification generation, queues, delivery, templates, retry handling, abandoned-cart logic.
* **DB:** Notification records/read state/preferences as required.

---

### The Bigger Picture

Think of the roadmap like this:

```text
004  Front-of-house
     ↓
     Mostly UI + public read API

005  Learner system
     ↓
     Frontend + Backend + DB

006  Money/attribution logic
     ↓
     Backend + DB heavy

007  Money movement
     ↓
     Backend + DB VERY heavy

008  Operations/control
     ↓
     Backend + DB VERY heavy + Admin UI

009  Communication layer
     ↓
     Backend + Frontend + queues
```

So **004 is the most frontend-oriented one**, while **006, 007, and 008 are the most backend/database-oriented**. Feature 005 is the point where KNZiN really becomes a substantial full-stack application.
