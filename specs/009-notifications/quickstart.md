# Developer Quickstart: Feature 009 — Notifications (الإشعارات)

**Feature**: [spec.md](file:///d:/Work%20Projects/Knzin%20Project/specs/009-notifications/spec.md)  
**Date**: 2026-10-04  
**Branch**: `009-notifications`  

---

## 1. Environment & Prerequisites

Feature 009 uses standard Laravel Mail and Queues with Next.js frontend integration.

In `backend/.env`:
```ini
# Mail Configuration (logs locally, uses SMTP in staging/production)
MAIL_MAILER=log
MAIL_FROM_ADDRESS="notifications@knzin.com"
MAIL_FROM_NAME="KNZiN كَنزين"

# Queue Configuration (database locally, redis in production)
QUEUE_CONNECTION=database
```

In `frontend/.env.local`:
```ini
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```

---

## 2. Database Migrations

Apply the notification and preferences migrations:
```bash
cd backend
php artisan migrate
```

Migrations executed:
1. `xxxx_xx_xx_create_notifications_table.php` (Polymorphic database notifications with UUIDs)
2. `xxxx_xx_xx_create_notification_preferences_table.php` (User marketing preference toggles)
3. `xxxx_xx_xx_create_admin_broadcasts_table.php` (Platform-wide admin broadcast ledger)
4. `xxxx_xx_xx_create_course_mission_reminders_table.php` (Dedicated mission reminder cooldown tracking)
5. `xxxx_xx_xx_add_recovery_notification_sent_at_to_orders_table.php` (Atomic recovery timestamp on orders)

---

## 3. Scheduled Commands & Background Workers

Start the Laravel queue worker to process asynchronous email and notification dispatch jobs:
```bash
cd backend
php artisan queue:work --queue=default,notifications
```

### Manual Trigger of Scheduled Evaluators (Testing)

Run individual evaluators on-demand:
```bash
# 1. Evaluate Abandoned Pending Orders (orders >= 2h old without payment)
php artisan notifications:evaluate-abandoned-orders

# 2. Evaluate Live Draw Alerts (draws ending within 15 minutes)
php artisan notifications:evaluate-draw-alerts

# 3. Evaluate Course Mission Inactivity Reminders (inactive >= 3 days, 7d cooldown)
php artisan notifications:evaluate-mission-reminders

# 4. Prune Read In-App Notifications (> 60 days old)
php artisan notifications:prune-read
```

---

## 4. Frontend In-App Notification Center Verification

1. Start frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
2. Log in as an authenticated learner or guest purchaser.
3. Observe the persistent **Notification Bell icon** in `HeaderHUD.tsx`.
4. Trigger a notification via API or backend event.
5. Verify:
   * Real-time unread badge increments.
   * Clicking the bell opens the popover/drawer showing localized title, body, and timestamp.
   * Clicking an item marks it as read and navigates to the target deep link (`action_url`).
   * "Mark all as read" button instantly clears the badge.
   * Switch language between Arabic (`/ar`) and English (`/en`) to verify RTL/LTR layout and `<bdi>` isolation for order/ticket serial numbers.

---

## 5. Automated Test Suite

Run the backend verification suite:
```bash
cd backend
php artisan test --filter=Notification
```

Run frontend unit and component tests:
```bash
cd frontend
npm test -- src/components/layout/NotificationCenter.test.tsx
```
