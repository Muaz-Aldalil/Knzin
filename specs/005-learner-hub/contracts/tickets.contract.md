# API Contract: Learner Promotional Tickets & Eligibility (`GET /api/v1/user/tickets`)

**Branch**: `005-learner-hub`  
**Endpoint**: `GET /api/v1/user/tickets`  
**Authentication**: Required (`auth:sanctum`)  
**Format**: JSend-compliant JSON  

---

## 1. Description
Powers the Global Header Ticket Badge and Sliding Drawer (`TicketLedgerDrawer`):
- Returns the authenticated learner's total promotional ticket count.
- Returns list of individual ticket records with their canonical Crockford Base32 serial numbers (`KNZ-YY-XXXX-YYYY`).
- Evaluates dynamic eligibility across draw tiers using the half-open interval rule (`starts_at <= issued_at < ends_at` in UTC):
  - **Hourly & Daily**: Evaluated against active windows; marks as `'concluded'` once draw closes.
  - **Monthly Grand**: Evaluated against the **designated calendar month**; remains `'active'` throughout that calendar period.
  - **Locked State**: If an active draw has `status = 'locked'`, ticket accumulation is closed.
- Includes active draw window metadata and server UTC timestamp for synchronized countdowns.

---

## 2. Request
- **Headers**:
  - `Authorization: Bearer <sanctum_token>`
  - `Accept: application/json`

---

## 3. Responses

### 3.1 Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "data": {
    "total_tickets": 16,
    "server_time_utc": "2026-10-01T14:30:00Z",
    "active_draws": {
      "hourly": {
        "id": "11111111-2222-3333-4444-555555555555",
        "title_ar": "السحب الساعي السريع",
        "title_en": "Hourly Flash Draw",
        "ends_at": "2026-10-01T15:00:00Z",
        "status": "active"
      },
      "daily": {
        "id": "22222222-3333-4444-5555-666666666666",
        "title_ar": "السحب اليومي لرواد الأعمال",
        "title_en": "Daily Entrepreneurs Draw",
        "ends_at": "2026-10-01T21:00:00Z",
        "status": "active"
      },
      "monthly": {
        "id": "33333333-4444-5555-6666-777777777777",
        "title_ar": "السحب الشهري الكبير: سيارة الأحلام ورأس مال الورشة",
        "title_en": "Monthly Grand Prize: Dream Workshop & Vehicle",
        "ends_at": "2026-10-31T23:59:59Z",
        "status": "active"
      }
    },
    "tickets": [
      {
        "id": "aa11bb22-cc33-dd44-ee55-ff6677889900",
        "serial_number": "KNZ-26-7K2M-9W4P",
        "issued_at": "2026-10-01T14:15:00Z",
        "originating_order_number": "KNZ-ORD-2026-887766",
        "eligibility": {
          "hourly": {
            "is_eligible": true,
            "status": "active"
          },
          "daily": {
            "is_eligible": true,
            "status": "active"
          },
          "monthly": {
            "is_eligible": true,
            "status": "active"
          }
        }
      },
      {
        "id": "bb22cc33-dd44-ee55-ff66-001122334455",
        "serial_number": "KNZ-26-3M9X-8R1T",
        "issued_at": "2026-09-30T10:00:00Z",
        "originating_order_number": "KNZ-ORD-2026-554433",
        "eligibility": {
          "hourly": {
            "is_eligible": false,
            "status": "concluded"
          },
          "daily": {
            "is_eligible": false,
            "status": "concluded"
          },
          "monthly": {
            "is_eligible": true,
            "status": "active"
          }
        }
      }
    ]
  }
}
```

### 3.2 Empty State Response (`HTTP 200 OK`)
When user has no tickets yet:
```json
{
  "status": "success",
  "data": {
    "total_tickets": 0,
    "server_time_utc": "2026-10-01T14:30:00Z",
    "active_draws": {},
    "tickets": []
  }
}
```

### 3.3 Error Response — Unauthenticated (`HTTP 401 Unauthorized`)
```json
{
  "status": "fail",
  "data": {
    "code": "ERR_UNAUTHORIZED",
    "message": "Unauthenticated"
  }
}
```
