# Quickstart & Verification Guide: Feature 010 — Admin Course Sales Notifications & Dual-Persona Center

**Date**: 2026-10-07  
**Feature**: `010-admin-sales-notifications`

---

## 1. Prerequisites & Environment Setup

Ensure the local backend and frontend development servers are configured:
```bash
# Backend directory
cd backend
php artisan config:clear

# Frontend directory
cd frontend
npm run lint --silent
```

---

## 2. Verification Steps

### Step 1: Automated Pest Feature Tests
Run the dedicated test suite verifying order fulfillment dispatch, recipient capability filtering, failure isolation, and API scope authorization:

```bash
cd backend
php artisan test tests/Feature/Notifications/AdminSalesNotificationTest.php
```

Expected assertions:
- `✓ it dispatches admin sales notification and email when order is fulfilled`
- `✓ it excludes low-privilege admins like draw audit viewers`
- `✓ it does not dispatch admin notifications when transaction rolls back`
- `✓ it prevents non-admin users from requesting scope=admin with 403`
- `✓ it returns correct scoped unread counts for learner and admin`
- `✓ it marks only active tab notifications as read on scoped mark-all-read`

---

### Step 2: Manual Simulation via Tinker / Scratch Script
You can simulate a live order fulfillment to inspect the generated database notification and queued email:

```php
// Run via php artisan tinker
$admin = \App\Models\User::where('email', 'admin@knzin.com')->first();
$order = \App\Models\Order::where('status', 'completed')->with('items.course')->first();

// Verify admin notification exists
$notification = $admin->notifications()->where('data->category', 'admin_sales')->first();
dump($notification->data);
```

Expected Output:
```json
{
  "category": "admin_sales",
  "title_ar": "🛒 عملية شراء جديدة: ...",
  "action_url": "/orders/...",
  "metadata": {
    "order_number": "...",
    "total_amount_cents": 15000,
    "currency": "USD"
  }
}
```

---

### Step 3: Frontend Component & UX Verification
Run the frontend Vitest suite to verify dual-persona tab rendering, unread count isolation, and RTL layout:

```bash
cd frontend
npm test src/tests/NotificationDualPersonaInvariants.test.tsx
```

Manual UI Inspection:
1. Log in as an administrator (`admin@knzin.com`).
2. Observe the Notification Bell in `HeaderHUD.tsx`: displays the combined total unread badge.
3. Open `NotificationDrawer.tsx`:
   - Verify two tabs appear: `🎓 نشاطي كمتعلم (My Activity)` and `⚡ الإدارة والمبيعات (Admin & Sales)`.
   - Verify each tab displays its own scoped badge count.
   - Switch between tabs: content filters instantaneously without full page reload.
   - Click "تحديد الكل كمقروء / Mark all as read" in the "Admin & Sales" tab: observe only admin sales alerts transition to read state, while personal learner notifications remain unread.
4. Log out and log in as a normal student:
   - Verify the dual-persona tab bar is completely hidden; only standard learner notifications are shown.
