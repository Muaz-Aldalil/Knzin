# Security Architecture Contract: Initial Admin Provisioning & Authorization

**Domain**: Feature 006 — Affiliate & Referral Engine  
**Document**: Admin Provisioning Path & Persistent Capability Authorization  
**Contract Version**: 1.0.0  

---

## 1. Context & Architecture Model

KNZiN is a multi-user production system. It does **not** rely on single-owner assumptions, hardcoded emails, or `--force` terminal flags.

The system enforces a strict four-stage authorization model:

```text
ordinary User
    ↓
Admin assignment / authorization (Bootstrap or Delegated Grant)
    ↓
Admin capability ('manage_platform_settings')
    ↓
protected platform-setting mutation
```

---

## 2. Initial Out-Of-Band Bootstrap Path

Because the platform initially lacks an RBAC/Admin management UI (deferred to Feature 008), a one-time out-of-band bootstrap mechanism is required to provision the first trusted Administrator.

### Command Specification
```bash
php artisan knzin:bootstrap-admin {user-email-or-uuid} --token={deployment-secret}
```

### Invariants:
1. **Zero Active Admins Invariant & Singleton Lock**:
   * The command checks `AdminCapability::active()->exists()`.
   * If any active administrator already exists, the bootstrap path is **permanently blocked**.
   * Concurrency is enforced via atomic database unique constraint on `platform_settings.key = 'admin.bootstrap_singleton'`. Concurrent race attempts immediately throw a unique violation and fail.
2. **Target User Validation**:
   * The target identity must be an existing, legitimate `User` record in the database.
   * Arbitrary non-existent identifiers are rejected.
3. **Operational Secret Token**:
   * The command requires `--token` matching `config('knzin.admin.bootstrap_token')` (configured via environment variable `ADMIN_BOOTSTRAP_TOKEN`).
   * Token comparison uses constant-time string comparison (`hash_equals`).
4. **Out-of-Band Protection**:
   * The bootstrap token is strictly forbidden from being accepted via any public HTTP or REST API endpoint. All HTTP requests attempting to invoke bootstrap return `404 Not Found`.
5. **Explicit Initial Capability Assignment**:
   * Creates persistent records in `admin_capabilities`:
     * `manage_admin_capabilities` (for delegated provisioning)
     * `manage_platform_settings` (for platform settings mutations)
     * `adjudicate_affiliate_coprize` (for co-prize reversal adjudication)
   * Note: Domain issuance capabilities (`issue_kyc_approval`, `issue_draw_audit_approval`) are NOT granted implicitly and remain isolated.
   * `provisioning_source`: `bootstrap`
   * `granted_at`: `now()`
   * `granted_by_user_id`: `null` (system origin)

---

## 3. Delegated Admin Provisioning & Multi-Admin Architecture

Once the initial administrator exists, normal administrative provisioning requires authorization from an existing active administrator.

### Command Specification
```bash
php artisan knzin:grant-admin-capability {target-user} {capability} --authorized-by={admin-email-or-uuid}
```

### Invariants:
1. **Authorizer Verification**:
   * The user specified by `--authorized-by` must exist and possess active authorization for `manage_admin_capabilities`.
   * Self-grant is forbidden: an admin cannot grant additional capabilities to themselves (`authorizer->id !== targetUser->id`).
2. **Provenance Recording**:
   * `provisioning_source` is set to `delegated_admin`.
   * `granted_by_user_id` records the authorizing admin's ID.
   * `granted_at` timestamp is recorded.
3. **Multi-Admin Support**:
   * Multiple independent administrators can exist concurrently.
   * All mutations to protected platform settings record `updated_by_user_id` referencing the specific administrator executing the mutation.

---

## 4. Admin Revocation Path

Any granted capability can be revoked explicitly with full audit logging.

### Command Specification
```bash
php artisan knzin:revoke-admin-capability {target-user} {capability} --authorized-by={admin-email-or-uuid} --reason={justification}
```

### Invariants:
1. **Immediate Revocation**:
   * Sets `status = 'revoked'`, `revoked_at = now()`, `revoked_by_user_id = $authorizer->id`, and records `revocation_reason`.
   * The revoked user immediately fails all subsequent capability checks (`hasCapability() === false`).
2. **Audit Preservation**:
   * Revoked capabilities are never deleted; the history is preserved for compliance auditing.

---

## 5. Protected Platform Settings Mutation

The protected affiliate payout threshold (`affiliate.payout_min_cents`) requires the `manage_platform_settings` capability.

```php
// In PlatformSettingsService::set():
$authorizer = $authorizedUser ?? Auth::user();
if ($authorizer === null) {
    throw new AuthorizationException("Unauthenticated actor cannot mutate platform settings.");
}
if (!$authorizer->hasCapability('manage_platform_settings')) {
    throw new AuthorizationException("User [{$authorizer->id}] lacks required persistent capability 'manage_platform_settings'.");
}
```

Mutations from the CLI (`knzin:set-setting`) require the `--user` parameter specifying an active Administrator.
