---
name: pest-security-guard
description: >-
  Automated architectural security and quality guard for PHP and Laravel applications.
  Enforces Pest 3 architectural security presets (arch()->preset()->security()), strict types,
  and forbids dangerous PHP functions. Use whenever writing, reviewing, or testing PHP/Laravel code.
compatibility: PHP 8.2+, 8.3+, 8.4+, Pest v3, Laravel 10/11/12.
---

# Pest 3 Architectural Security & Quality Guard (SKILL.md)

## Status & Purpose
This skill serves as the automated architectural security guard for PHP and Laravel backends. It replaces legacy static tools with Pest v3's native architectural testing engine, enforcing clean separation of concerns, strict typing, and blocking dangerous execution functions at the test runner level.

---

# 1. THE PEST 3 ARCHITECTURAL PRESET STANDARD

Every Laravel or modern PHP project must maintain an architectural security test suite under `tests/Feature/ArchitectureTest.php` or `tests/ArchTest.php`.

### Mandatory Preset Declaration:
```php
<?php

declare(strict_types=1);

// 1. Enforce Native Security Preset
// Automatically forbids: eval(), exec(), shell_exec(), passthru(), system(), proc_open(), popen(), and md5()
arch('security')
    ->preset()
    ->security();

// 2. Enforce Strict Typing
arch('strict types')
    ->expect('App')
    ->toUseStrictTypes();

// 3. Forbid Debug Statements Left Behind in Production Code
arch('no debugging statements')
    ->expect(['dd', 'dump', 'var_dump', 'ray', 'print_r'])
    ->not->toBeUsed();
```

---

# 2. ARCHITECTURAL LAYERING INVARIANTS

To maintain maintainability and security, code must adhere to strict architectural boundaries:

### 2.1 Controllers Must Not Access Database Directly
Controllers must delegate data mutations to FormRequests, Actions, Services, or Repositories:
```php
arch('controllers do not execute raw queries')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Support\Facades\DB');
```

### 2.2 Models Must Guard Mass-Assignment
Every Eloquent model must define either `$fillable` or `$guarded = []` with strict mode enabled:
```php
arch('models extend authentic Eloquent Model')
    ->expect('App\Models')
    ->toExtend('Illuminate\Database\Eloquent\Model');
```

---

# 3. FORBIDDEN FUNCTIONS & SAFE ALTERNATIVES

```
┌─────────────────────────┬───────────────────────────────┬──────────────────────────────────────────┐
│ FORBIDDEN FUNCTION      │ DANGER REASON                 │ MANDATORY SAFE ALTERNATIVE               │
├─────────────────────────┼───────────────────────────────┼──────────────────────────────────────────┤
│ eval()                  │ Remote Code Execution (RCE)   │ Dedicated domain strategy or parser      │
│ exec(), shell_exec()    │ Command Injection risk        │ Symfony/Process with parameterized args  │
│ md5(), sha1()           │ Cryptographically broken      │ hash('sha256', ...) or bcrypt / Argon2id │
│ unserialize()           │ PHP Object Injection          │ json_decode() or safe deserializer       │
│ extract()               │ Variable scope pollution      │ Explicit associative array destructuring │
│ DB::raw() (unbound)     │ SQL Injection                 │ Parameterized bindings: DB::raw('?', [$v])│
└─────────────────────────┴───────────────────────────────┴──────────────────────────────────────────┘
```

---

# 4. AUDIT CHECKLIST FOR STAGE 7 CONVERGENCE

During Stage 7 of `engineering-workflow`, the agent must run the architectural test suite:

```bash
./vendor/bin/pest --filter=Arch
```

- If Pest architecture tests fail: **Definite Defect.**
- Remediate the offending function call or architectural violation immediately. Do not disable or comment out the architectural test.
