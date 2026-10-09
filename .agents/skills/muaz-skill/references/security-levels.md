# Security Rules by Level

Each level includes the rules from all previous levels plus its own additions.

---

## Cross-Cutting (all levels, always apply)

These rules apply to every project regardless of security level.

### DevTools Leak Prevention

| Tab | Rule | Reason |
|---|---|---|
| **Network** | No tokens/passwords/secrets in URL query params or fragments (`?token=`, `#access_token=`) | Logged in browser history, visible in Network request URL |
| **Network** | No PII in JWT payload — base64-decoded and visible in Network → Response | Anyone with DevTools can decode without the key |
| **Network** | Authorization headers (`Bearer ...`) acceptable; custom `X-API-Key` from client flagged | Standard pattern vs. leakable plaintext key |
| **Application** | Auth tokens → httpOnly cookies only. Never localStorage, sessionStorage, or IndexedDB | JS-inaccessible; XSS can't read them |
| **Application** | No API keys, secrets, or tokens in `window.__ENV` or global JS variables | Visible in Application → Scripts → Global |
| **Application** | No secrets stored in IndexedDB, WebSQL, or Cache Storage | XSS or compromised extension can read them |
| **Elements** | No sensitive data in `data-*` attributes, hidden inputs, or HTML comments | Visible in Elements panel to anyone |
| **Elements** | No tokens in hidden DOM (`<div hidden data-token="...">`) | Same — visible in inspector |
| **Sources** | No hardcoded secrets in client-side bundle JS files | Anyone can view bundled source |
| **Sources** | `VITE_` / `NEXT_PUBLIC_` / `REACT_APP_` prefixed vars are public — never put secrets there | Build system inlines them into client bundle |
| **Sources** | Source maps — production: disable or restrict to authenticated/internal only | Unminified source reveals API endpoints, logic, comments |
| **Console** | No `console.log/warn/error` with tokens, passwords, or user data in production | Visible in Console tab |
| **Console** | Strip console output in production build (eslint `no-console` + Terser drop) | Defense in depth against leftover debug logs |

### Security Headers

The server should send these on every response. Flag to backend if missing.

| Header | Value | What it prevents |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` (+ `preload` after submitting to hstspreload.org) | MITM downgrade attacks — `preload` is permanent, so only enable when every subdomain is HTTPS-ready |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | Feature abuse |
| `Cross-Origin-Resource-Policy` | `same-origin` | Cross-origin data leakage |
| `Cross-Origin-Opener-Policy` | `same-origin` (use `same-origin-allow-popups` if OAuth/SAML popups are used) | Tab-nabbing / cross-origin window takeover — breaks `window.opener` on isolated windows |
| `Cross-Origin-Embedder-Policy` | `credentialless` | Cross-origin loading of sensitive data — requires CORP headers on all cross-origin resources, can break embedded widgets/CDNs |
| `Origin-Agent-Cluster` | `?1` | Per-origin process isolation |
| `Cache-Control` | `no-store` on authenticated pages, API responses, and anything sensitive | Prevents auth pages / tokens leaking via browser or shared caches |

- [ ] **Deprecated**: remove `X-XSS-Protection` — modern browsers ignore or actively weaken it (CSP + Trusted Types replace it)
- [ ] **COEP rollout check**: enable `Cross-Origin-Embedder-Policy` only after auditing that all cross-origin resources (images, fonts, CDNs) carry CORP/CORS headers — otherwise you break legitimate content

### CSP (Content Security Policy)

Minimal baseline for all levels:
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self';
font-src 'self' https://fonts.gstatic.com;
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

- Report violations via `report-uri` (deprecated fallback) + `report-to` / `Reporting-Endpoints` (preferred, sent with the `Report-To` header)
- Never use `'unsafe-inline'` for scripts — use nonces or hashes at L2+
- Never use `'unsafe-eval'` unless required (compile-to-JS tools) and document why
- `base-uri 'self'` blocks `<base>` tag hijacking; `form-action 'self'` blocks form submissions to attacker domains; `object-src 'none'` blocks flash/plugin/object content; `upgrade-insecure-requests` forces HTTPS on subresources
- `frame-src 'none'` unless you embed iframes — then allowlist specific origins

### Environment Variable & Build Security

- [ ] `VITE_*`, `NEXT_PUBLIC_*`, `REACT_APP_*` — treat as public, never put secrets here
- [ ] All other env vars are server-only — never import them from client code
- [ ] Use a single env file convention (`.env.local` for local, `.env.production` for CI)
- [ ] Strip debug code in production: `if (import.meta.env.DEV)` for Vite, `process.env.NODE_ENV === 'development'` for Next/CRA
- [ ] Remove `console.log` in production build (eslint rule + build plugin)
- [ ] Source maps: use `hidden-source-map` or disable in production
- [ ] Fail build if any file contains `SECRET_` or `PRIVATE_KEY` pattern in source

### Trusted Types (DOM XSS)

- [ ] Enable Trusted Types via CSP: `require-trusted-types-for 'script'`
- [ ] Create a Trusted Types policy for safe HTML manipulation
- [ ] Never use `innerHTML`, `outerHTML`, `insertAdjacentHTML` without a Trusted Types policy
- [ ] In React: avoid `dangerouslySetInnerHTML` — use a sanitized component (DOMPurify + Trusted Types)

### Error Handling (all levels)

- [ ] React Error Boundaries with generic fallback UI — never show component stack traces in production
- [ ] API error responses: generic messages — no stack traces, SQL queries, or internal paths
- [ ] Client-side error logging: strip user data before sending to logging service (Sentry, etc.)
- [ ] Never surface `Error.message` from thrown exceptions directly to UI

### Supply Chain Security (all levels)

- [ ] **SBOM generation**: produce CycloneDX or SPDX SBOM at build time — attach to releases
- [ ] **Dependency provenance**: verify package signatures (sigstore/cosign for containers, npm provenance for packages)
- [ ] **CI/CD secrets scanning**: scan every commit and PR for secrets (Gitleaks, truffleHog) — block CI on match
- [ ] **Signed commits**: require GPG/SSH signing on all commits in the default branch
- [ ] **Software attestation**: generate SLSA provenance attestations for build artifacts
- [ ] **Dependency review**: review new and updated dependencies for known malware before merge
- [ ] **Lock files**: commit lock files (package-lock.json, yarn.lock, go.sum) — pin exact versions
- [ ] **Install from lockfile**: use `npm ci` / `yarn install --frozen-lockfile` in CI — never `npm install` (recomputes and can drift the lockfile)
- [ ] **Package integrity**: lockfile `integrity` hashes verified on install; pin exact versions (`npm install --save-exact`) for production dependencies
- [ ] **Typosquatting**: detect near-miss/homoglyph lookalikes of your own or popular package names (extra `-`, `_`, unicode chars) — verify publisher identity and repo URL actually match the real project before install
- [ ] **Slopsquatting (LLM-hallucinated names)**: verify ANY package an AI agent suggests actually exists and is legitimate — models hallucinate package names that attackers later register (127 universal hallucinated names across all major models; e.g. `unused-imports` got ~233 real downloads/week). Before installing: exists on registry, publisher age/reputation, downloads-vs-age ratio, repo URL + homepage match the real source, recent maintenance activity
- [ ] **Install-script hygiene**: audit `preinstall`/`postinstall` scripts of every dependency; run untrusted or optional deps with `--ignore-scripts`; never `sudo` installs
- [ ] **Registry pinning**: `.npmrc`/equivalent with explicit registry and `always-auth=true`; scoped packages for private deps
- [ ] **License check**: verify dependency licenses are compatible with your distribution (GPL/AGPL poisoning breaks closed-source products; see `npx license-checker`)
- [ ] **Secret breach response (purge workflow)**: if a secret was committed —
      1. **Rotate/revoke the secret FIRST** — the commit already exists, treat it as public
      2. Sweep **all** locations, not just the default branch: every branch, tags, reflog, stashes, open/merged PRs, issues, CI logs, GitHub Actions caches, forks, and any clones
      3. Rewrite history with `git filter-repo` (not `filter-branch`), then `git gc --prune=now --aggressive`
      4. Coordinate: force-push to remote, purge GitHub's cached commits, delete forks, have every teammate reset their clone
      5. Verify after: `git log --all -p | grep <secret-pattern>` + GitGuardian / `gh secret scan` + scan CI caches and container/image layers
- [ ] **`.env` discipline**: `.env*` gitignored; never `git add -f` them; audit `git ls-files` output for env/credential files; block `.env` + key patterns in CI secret scanning

### Generated-Code Review Gate (all levels)

Any code produced by an AI coding agent requires a mandatory human security review before it reaches production. This is the control that breaks supply-chain, injection, and authorization chains at step 1.

- [ ] **Branch protection**: no direct pushes to `main`/production branches — PR required, CI must pass, at least one human reviewer required
- [ ] **No self-approval**: AI agents must never approve, merge, or auto-merge their own PRs; auto-merge disabled for agent-authored PRs
- [ ] **Sensitive-path escalation**: changes touching auth, payments, DB migrations/schema, secrets, or public endpoints require review by a named senior/security-aware developer — not just any approver
- [ ] **Security review checklist for AI diffs**: confirm per change — inputs validated server-side, ownership/authorization enforced on every endpoint touched, no secrets added, error messages don't leak internals, no `eval`/`innerHTML` without sanitization, new dependencies verified (slopsquatting check), existing headers/CSP untouched
- [ ] **SAST on agent PRs**: Semgrep/CodeQL must pass on every AI-generated diff before merge — automated catching of the vulnerability classes LLMs miss
- [ ] **Agent code flagged**: label AI-generated PRs/changes (e.g. `ai-generated`) so reviewers give them extra scrutiny — same review weight, higher suspicion
- [ ] **Prompt/model audit trail**: record which agent, model version, and prompt/instruction set produced each change (commit metadata or PR description) — required for traceability under EU AI Act / product liability (generated code is a product component)
- [ ] **Agents can't modify their own guardrails**: changes to `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.mcp.json`, or CI config require human review and a second reviewer — self-modifying instructions are the TrapDoor vector

### Injection Defense Matrix

Organized by input vector — find your coding context and see what injections apply and at which level.

| Vector | Injection types | Primary defense | Applied |
|---|---|---|---|
| **User text / rich text** | XSS, HTML injection, JS injection, markdown renderer XSS | Context-aware output encoding + DOMPurify | L1 |
| **URLs / redirect targets** | Open redirect, `javascript:` / `data:` scheme injection | Allowlist origins, reject non-HTTP schemes | L1 |
| **CSS / style contexts** | CSS data exfiltration via attribute selectors, `url()` injection | CSP `style-src` with nonces, never interpolate user data in `<style>` | L1 |
| **File uploads** | SVG XSS, path traversal, polyglot files, zip bombs | Validate magic bytes + type + size server-side | L1 |
| **HTML attributes** | DOM clobbering (`id=`/`name=` overwriting globals), attribute injection | Use `setAttribute` safely, avoid generic `id` values on sensitive elements | L1 |
| **Database queries** | SQL injection, NoSQL injection (`$ne`, `$where`, `$regex`), XPath, LDAP | Parameterized queries / query builders — never string concat | L2 |
| **HTTP headers / cookies** | CRLF injection, log injection, cache poisoning, response splitting | Strip `\r\n` from header values, validate before logging | L2 |
| **Template engines** | SSTI (Jinja2, Pug, EJS, Twig), Expression Language (OGNL, SpEL) | Never pass user input as template code — sandbox if required | L2 |
| **Command execution** | Command injection, argument injection | Avoid shell spawn from input, use `execFile` with allowlist | L2 |
| **Export / download** | CSV formula injection (`=HYPERLINK`), PDF XSS | Escape leading `= + - @` in CSV, sanitize PDF render input | L2 |
| **XML parsers** | XXE (local file read, SSRF), XML bomb (billion laughs), XPath injection | Disable DTD and external entities — prefer JSON | L3 |
| **Serialization** | Insecure deserialization (pickle, YAML, Java serialization, PHP unserialize) | Use JSON — never deserialize untrusted input with polyglot parsers | L3 |
| **Service-to-service** | SSRF, DNS rebinding, host header injection | Allowlist outbound URLs, validate Host header, block internal IPs at gateway | L3 |
| **Uploaded configuration** | IaC injection (Terraform `local_exec` from var), env injection | Treat IaC vars as untrusted — no inline eval from user-supplied values | L3 |
| **Build / dependency** | Dependency confusion, typo-squatting, slopsquatting (LLM-hallucinated names), malicious packages | Scoped packages, lock files, registry allowlist, `npm provenance`, verify AI-suggested names exist | L3 |
| **WebSockets** | WS message injection, origin spoofing | Validate Origin on upgrade, authenticate on connect, validate all messages | L3 |
| **Prompt / LLM** | Direct prompt injection, indirect (retrieved data) prompt injection | Separate system vs user prompt, validate output, rate limit | L3\* |
| **API endpoints / resource IDs** | IDOR, mass assignment (role/price tampering) | Enforce ownership + authorization on every endpoint; use UUIDs | L2 |
| **Input validation (regex)** | ReDoS (catastrophic backtracking) | Anchor patterns, limit input length, timeout on regex execution | L2 |
| **Authentication / comparison** | Timing side-channel (leak password length, valid usernames, token values) | Constant-time comparison (`crypto.timingSafeEqual`) | L2 |
| **HTTP / proxy desync** | HTTP request smuggling, response splitting, web cache poisoning | Use HTTP/2; validate Content-Length vs Transfer-Encoding at proxy | L2 |
| **Links / navigation** | Tabnabbing, open redirect | `rel="noopener noreferrer"` on all `target="_blank"` links | L1 |
| **Business logic / workflows** | Race condition (TOCTOU), business logic abuse (coupon stacking, quota bypass) | Idempotency keys, transactional locking, state machine validation | L3 |
| **Mobile: deep links / intents** | Deep link hijacking, intent interception, custom scheme spoofing | Validate URL authority, verify source app package, prefer verified links | L2 |
| **Mobile: WebView bridges** | JS bridge injection, protocol handler abuse, local file access via WebView | Restrict bridge API to minimum, validate origin + message format, disable file access | L3 |
| **Mobile: app integrity** | Sideloading, repackaging, runtime hooking (Frida), rooted/jailbroken device | Play Integrity / DeviceCheck attestation at login + sensitive actions | L3 |

\* LLM row only when project uses AI/LLM features.

### Privacy & Browser Fingerprinting (all levels)

- [ ] **Limit fingerprinting APIs**: restrict Canvas, WebGL, AudioContext, Battery API via Permissions-Policy or conditional gating — fingerprinting poses a privacy risk without a security benefit
- [ ] **No third-party fingerprinting**: audit all embedded scripts for canvas reads, font enumeration, WebGL queries, and navigator property collection
- [ ] **Minimize passive collection**: avoid keystroke pattern logging, scroll depth tracking, and mouse movement recording unless the core feature requires it

### Agent & AI Security (all levels)

Covers two surfaces: **AI agents that build/maintain your code** and **AI features your app exposes to users**.

#### AI coding agents & MCP (build-time)

- [ ] **Instruction-file poisoning scan**: scan `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `.github/prompts`, `.mcp.json` for zero-width Unicode (`[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF\u202A-\u202E]`) and Unicode Tags (`U+E0000–E007F`) — invisible characters are the TrapDoor hiding technique; review changes to these files in every PR
- [ ] **Don't let agents modify their own instructions**: instruction/config files merged only via human-reviewed PR (see Review Gate) — never accepted mid-conversation
- [ ] **Assume boundary bypass**: agents and their outputs are untrusted — run agents with least privilege, in a sandbox (container), with no access to production secrets/DBs, and network restricted unless required
- [ ] **CI agent least privilege**: read-only `GITHUB_TOKEN` (`permissions: contents: read`), no `bypassPermissions`, no admin/PAT credentials on build runners — TrustFall, GhostApproval, and CVE-2026-33068 all exploit over-privileged agent harnesses
- [ ] **Tool allowlist**: explicitly enumerate the tools/commands an agent may call — deny `exec`/shell/network/file-writes-outside-workspace unless approved; log every tool invocation with before/after file state (audit trail)
- [ ] **MCP servers**: allowlist + pin versions + verify origin/publisher before adding; prefer OAuth-connected MCPs (91.8% of public servers have no auth); deny unknown servers; no auto-approve tool calls (auto-approved MCP tools succeed 84.2% of the time; 5.5% of public MCP servers are malicious)
- [ ] **Human-in-the-loop**: high-risk actions (deploys, secret access, DB writes, financial operations) require explicit human approval — never agent-only
- [ ] **Machine identities**: agents/CI use short-lived, scoped tokens with rotation (identities are ~82:1 machine-to-human) — long-lived agent tokens are a standing backdoor

#### AI features in the product (runtime)

- [ ] **Prompt injection defense**: separate system vs user prompts; never grant the LLM tools/privileges from untrusted content; validate and constrain output before it's used (indirect injection via retrieved docs/emails is the #1 GenAI risk — OWASP LLM Top 10)
- [ ] **Blast-radius control**: if a prompt injection succeeds, it must not reach auth, money, or admin paths — least-privilege scoping of what the model can trigger (LLM "Excessive Agency" #3)
- [ ] **Data sent to AI providers**: minimize PII/user data sent to third-party LLM APIs; opt out of training/retention where offered; consider self-hosted or regional models for sensitive data (NIST AI 600-1, EU AI Act)
- [ ] **LLM endpoint hardening**: authenticate calls, rate limit, size-limit inputs, log model calls for audit, monitor for anomalous usage (abuse, exfiltration)

---

## Level 1 — PUBLIC

*Applied to: static sites, portfolios, landing pages, no login, no payments*

### Frontend

- [ ] No secrets / API keys / tokens in source code or bundled JS
- [ ] SRI (Subresource Integrity) on all external CDN scripts and stylesheets
- [ ] HTTPS enforced — flag if served over HTTP
- [ ] CSP header applied (baseline from Cross-Cutting)
- [ ] No `eval()` — ever
- [ ] Sanitize any dynamic content rendered to DOM
- [ ] No `dangerouslySetInnerHTML` / `innerHTML` without sanitization
- [ ] Trusted Types enabled (from Cross-Cutting)
- [ ] Third-party scripts (analytics, fonts, widgets) loaded with `integrity=` attribute
- [ ] All forms use POST (never GET for mutations)
- [ ] CSRF token on every form POST (valid even without sessions — prevents login CSRF and cross-site form submission)
- [ ] Honeypot hidden field + time-trap (form submitted too fast = bot) for spam control
- [ ] Server-side validation on any form that hits an API/backend (client validation is convenience only)
- [ ] Email-forwarding forms: reject CRLF (`\r\n`) in name/email/subject — prevents email header injection when the form emails you
- [ ] PRG pattern (Post → Redirect → Get) after successful submit — prevents duplicate submissions and history-based re-POST
- [ ] Rate limit per IP on form endpoints (e.g. 5 submits/hour) — stops spam/abuse on public forms
- [ ] Don't collect PII (phone, address) unless the feature genuinely requires it — less data = smaller breach surface
- [ ] Alt text on all meaningful images (a11y + basic SEO, not security but doubly enforces intent)
- [ ] All `target="_blank"` links use `rel="noopener noreferrer"` — prevents tabnabbing

### Backend / API

- [ ] CSP headers set on every response
- [ ] CORS: allow specific origins only (no `Access-Control-Allow-Origin: *` if any dynamic content)
- [ ] Security headers from Cross-Cutting all confirmed present
- [ ] Static asset serving: disable directory listing
- [ ] No sensitive data in static file names or paths
- [ ] Cloud storage: buckets/containers default-deny public access — verify each bucket's ACL/block-public-access policy (RedAccess: misconfigured public S3 buckets are the #1 exposure in AI/vibe-built apps)
- [ ] No open admin/API endpoints reachable without auth — probe externally with `curl` before launch (unauth probing found 5,000 exposed vibe-coded apps)
- [ ] Subdomain takeover check: no stale DNS/CNAME records pointing to deleted/expired hosts or repos
- [ ] Domain email: SPF + DKIM + DMARC configured to prevent spoofing of your domain
- [ ] `security.txt` + `/.well-known/` served where applicable

---

## Level 2 — AUTHENTICATED

*Applied to: SaaS, dashboards, e-commerce, apps with user accounts and sessions*

Includes **all Level 1 rules** plus the following.

### Frontend

- [ ] Auth tokens → httpOnly cookies only (never localStorage/sessionStorage/IndexedDB)
- [ ] OAuth / OIDC flow: use **Authorization Code + PKCE**, never Implicit Grant
- [ ] Session: show "Session expiring in 5 minutes" warning before auto-logout
- [ ] Logout clears ALL client-side state: cookies, cached user data, any stored UI state
- [ ] Login error messages must NOT reveal whether the email exists:
      BAD:  "No account found for this email"
      GOOD: "Invalid email or password"
- [ ] Disable autocomplete on sensitive fields:
      `autocomplete="new-password"` on password fields
      `autocomplete="one-time-code"` on OTP fields
- [ ] No sensitive data in URL query params (`?redirect=`, `?token=`, `?email=`)
- [ ] Input validation on ALL user-facing forms (client-side convenience + flag for server)
- [ ] Sensitive fields masked: passwords always, card numbers partially (`**** **** **** 4242`)
- [ ] Disable submit button after click until response received
- [ ] Show loading state during async operations ("Sending...", spinner)
- [ ] After N failed login attempts → show cooldown message in UI (no immediate retry)
- [ ] Dependency vulnerability scanning: automated scan on every PR — fail CI on critical/high
- [ ] Scheduled scanning: daily scan for new CVEs between PRs
- [ ] SCA tooling: use dedicated scanner (Dependabot, Grype, Snyk) — not just npm audit
- [ ] Auto-remediate: auto-PR for patch-level fixes, manual review for minor/major
- [ ] No packages with known XSS vulnerabilities
- [ ] CSP: upgrade to `'strict-dynamic'` with nonces — no `'unsafe-inline'`
- [ ] Third-party scripts: only what's required (strip unused analytics/widget SDKs)
- [ ] Error messages never reveal system internals:
      BAD:  "PostgreSQL error: duplicate key value"
      GOOD: "Something went wrong. Please try again."
- [ ] `SameSite=Lax` or `Strict` on all session/cookie set operations
- [ ] `Secure` flag on all cookies (only sent over HTTPS)
- [ ] `Path=/` scoped narrowly per cookie (not global `/`)
- [ ] DevTools leak prevention from Cross-Cutting fully verified before launch

### Backend / API

- [ ] **Password hashing**: bcrypt (cost ≥12) or argon2id — never plaintext, never MD5/SHA1
- [ ] **JWT**: short expiry access tokens (≤15 min), refresh tokens with rotation (7 days max)
- [ ] **JWT algorithm enforcement**: enforce a single algorithm server-side (RS256 or EdDSA) — never derive it from the JWT header (prevents algorithm confusion: `alg: none`, RS256→HS256 with public key)
- [ ] **JWT secret**: strong random value, rotated periodically, never in source code
- [ ] **Server-side input validation** — client validation is convenience, server is authoritative
- [ ] **SQL injection prevention**: parameterized queries / prepared statements — never string concatenation
- [ ] **CORS**: allowlist specific origins, methods, and headers — no wildcard with credentials
- [ ] **Rate limiting**: per IP + per user (e.g., 5 login attempts/min, 100 requests/min general)
- [ ] **CSRF tokens**: on all state-mutating endpoints (POST/PUT/PATCH/DELETE)
- [ ] **Session fixation prevention**: regenerate session/cookie ID on login and privilege escalation
- [ ] **Cookie attributes**: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- [ ] **Cookie name prefix**: `__Host-` prefix for session/auth cookies (implies `Secure` + `Path=/` + no `Domain`) — prevents domain/path confusion; use `__Secure-` when a `Domain` attribute is unavoidable
- [ ] **CHIPS `Partitioned`**: `Partitioned` requires `Secure`; `SameSite=None` also requires `Secure` — a cookie set without `Secure` in these modes is silently dropped (an insecure fallback is a misconfiguration signal)
- [ ] **Session cookie expiry**: set `Max-Age`/`Expires` (e.g. 24h rolling) so a stolen cookie doesn't last forever; rotate session ID on login and privilege change
- [ ] **Logout**: clear the auth cookie and send `Clear-Site-Data` on logout endpoints
- [ ] **Password strength policy**: minimum 8 chars (NIST recommends 12+), common password check
- [ ] **Account lockout**: temporary lockout after N failed attempts (e.g., 5 attempts → 15-min lockout)
- [ ] **Email verification**: verify email before granting full access
- [ ] **Password reset**: use time-limited, single-use tokens — never email password in plaintext
- [ ] **Security headers**: all headers from Cross-Cutting confirmed on every response
- [ ] **Helmet.js** (Express/Node) or equivalent middleware active
- [ ] **Request size limits**: cap body size (e.g., 1MB for JSON, 10MB for file uploads)
- [ ] **API versioning**: versioned endpoints (`/api/v2/`) to avoid breaking changes from old clients
- [ ] **OAuth / OIDC**: validate `aud`, `iss`, `exp`, `nonce` on every token verification
- [ ] **PKCE**: enforce S256 challenge method, reject plain
- [ ] **BOLA / IDOR prevention** (OWASP API1:2023): the server must resolve who owns a resource on **every** request and compare against the authenticated principal — comparing the JWT `user.id` to the ID in the URL is NOT authorization; verify against the object's actual owner in the data layer. Apply to all resource types (users, files, orders, orgs, attachments) and test with a second user account to confirm you can't read/write another user's objects
- [ ] **Mass assignment protection**: define explicit allowlists of writable fields per endpoint — never blindly write request body to DB/models
- [ ] **ReDoS prevention**: anchor regex patterns, enforce max input length, set regex execution timeout at the application level
- [ ] **Timing attack prevention**: use constant-time comparison (`crypto.timingSafeEqual`) for passwords, tokens, HMACs — never use `==`/`===` on secrets
- [ ] **HTTP request smuggling prevention**: prefer HTTP/2; validate Content-Length vs Transfer-Encoding; reject conflicting headers at the reverse proxy

#### Backend-as-a-Service (Supabase / Firebase) — RLS

If using a BaaS, the browser holds a **public** anon key — your entire data layer depends on the backend's policy engine being correct. ~61% of vibe-coded BaaS apps have misconfigured access control (Moltbook/RLS).

- [ ] **RLS / security rules enabled per table** — the default-off state is a full data breach; never use `USING(true)` / `true` policies that let anyone read or write
- [ ] **Per-operation policies**: define `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies separately — being able to read your own row is not permission to delete or modify other rows
- [ ] **Service-role / admin keys**: NEVER shipped in client code or bundles — they bypass all policies; use them only in server/Edge Functions / trusted backend
- [ ] **Type-match pitfall**: `auth.uid()` returns `uuid`, JWT claims are text — an `uid = auth.jwt()->>'sub'` comparison can fail open or never match; test with a second user
- [ ] **Test as anonymous/second user**: verify policies with the anon key and with a *different* user's token — not just your own admin session
- [ ] **Storage buckets + realtime channels**: they have their own policy engines — apply the same rules to file access and realtime subscriptions (a public channel can leak live data)
- [ ] **Expose minimal schema**: prefer RPC / Edge Functions over direct table access for sensitive operations; don't expose the full table schema through the client SDK

---

## Level 3 — SENSITIVE

*Applied to: fintech, healthcare, legal, admin panels, PII-handling apps*

Includes **all Level 1 + Level 2 rules** plus the following.

### Frontend

- [ ] CSP: `'unsafe-inline'` and `'unsafe-eval'` are strictly forbidden — use nonces or SHA hashes
- [ ] CSP `report-uri` / `report-to` configured with active monitoring
- [ ] Inline event handlers (`onclick="..."`) replaced with `addEventListener` (required by strict CSP)
- [ ] No inline `<style>` blocks in production — external stylesheets only
- [ ] Third-party scripts: every one audited and justified — no unapproved third-party code
- [ ] All external scripts loaded with SRI + `async`/`defer`
- [ ] Prefer self-hosted over CDN for critical libraries (minimize supply chain risk)
- [ ] PII, health info, financial data NEVER in: localStorage / sessionStorage / URL params / browser history / hidden DOM
- [ ] Audio/visual confirmation before destructive actions ("Type DELETE to confirm")
- [ ] Bundle audit — verify no sensitive data leaks via Network tab or bundled source
- [ ] Mask all sensitive data in UI:
      Card numbers:  `**** **** **** 4242`
      Account numbers: `••••1234`
      SSN / National ID: `***-**-6789`
      Phone numbers: `+*** *** ** 789`
- [ ] MFA / 2FA flow: clear UI on each step, never expose backup codes in plain view
- [ ] WebAuthn / passkeys: support as primary or MFA method — prefer platform authenticator (Touch ID, Windows Hello, Android biometric) over SMS/OTP where available
- [ ] Auto-logout on inactivity (default ≤15 min, configurable)
- [ ] Show inactivity warning 2 minutes before auto-logout
- [ ] Re-authentication required for sensitive actions (change password, transfer funds, delete account, change MFA)
- [ ] Allowlist input validation: define exactly what's valid, reject everything else
- [ ] Max length enforced on ALL inputs (prevent buffer overflow / storage abuse)
- [ ] File upload: validate type + size + magic bytes client-side + flag server validation
- [ ] Drag-and-drop upload: validate file before drop event is accepted
- [ ] Screen capture prevention: `@media print` styles or overlay on sensitive data (not foolproof, defense-in-depth)
- [ ] Clipboard: don't write sensitive data to clipboard without explicit user action
- [ ] Payment forms: use iframe-based tokenization (Stripe Elements, etc.) — never touch raw card data

#### Mobile

- [ ] **Deep link validation**: verify URL authority on every incoming deep link — reject unrecognized schemes and hosts
- [ ] **Android App Links / iOS Universal Links**: prefer verified links over custom URL schemes — they can't be hijacked by another app
- [ ] **WebView bridge security**: expose the minimum JS bridge API surface — validate origin and message format on every bridge call
- [ ] **WebView hardening**: disable file access (`setAllowFileAccess(false)`), disable content URL access, disable clipboard access from WebView
- [ ] **App integrity**: implement Play Integrity (Android) or DeviceCheck (iOS) at login and before sensitive actions — detect rooted/jailbroken devices, repackaging, and runtime hooking
- [ ] **Certificate pinning**: pin TLS certificates or public keys in the mobile app — prevent MITM via compromised CA or proxy tools

### Backend / API

- [ ] **CSP**: strict with nonces, `report-uri` active, violations monitored and alerted
- [ ] **Data encryption at rest**: database-level encryption (AES-256) for PII/financial/health data
- [ ] **Data encryption in transit**: TLS 1.3 minimum, disable TLS 1.0/1.1
- [ ] **Audit logging**: every admin/privileged action logged with:
      User ID · Timestamp · Action · Resource ID · Before/After values · IP address
- [ ] **Audit log storage**: append-only, tamper-evident (e.g., signed logs or external log service)
- [ ] **Idempotency keys**: on all payment/financial endpoints — prevent double charges on retry
- [ ] **MFA enforcement**: require 2FA for all accounts, not optional
- [ ] **Re-authentication**: sensitive actions require fresh password or 2FA step-up
- [ ] **Data retention**: automatic purge of stale sessions, logs (retain as required by regulation, then delete)
- [ ] **Data deletion (right to be forgotten)**: user-initiated full data wipe — documented, verifiable
- [ ] **Cookie consent**: GDPR/Turkish KVKK compliant — explicit consent, granular opt-out
- [ ] **API keys for service accounts**: scoped to least privilege, per-environment, rotation policy
- [ ] **Webhook signature verification**: HMAC-SHA256 over the **raw body** (verify before JSON parsing — re-serializing changes the payload), constant-time comparison (`crypto.timingSafeEqual`), accept only the current signature scheme (`v1`, Stripe-style) and reject scheme-downgrade attempts
- [ ] **Webhook replay protection**: verify the event timestamp against a tolerance window (e.g. ±5 min) and deduplicate by event ID — replaying a "payment confirmed" event is a classic fraud vector
- [ ] **Webhook event allowlist**: subscribe to the minimal set of event types and ignore/delete unknown ones; never branch on an unvalidated `event` type string for privileged actions
- [ ] **Idempotent webhook handlers**: retries are normal (Stripe and similar senders retry for hours) — handlers must be safe to run multiple times for the same event
- [ ] **SSRF protection**: allowlist outbound URLs, block internal IP ranges in proxy/API gateway
- [ ] **Secrets management**: use a secrets vault (HashiCorp Vault, AWS Secrets Manager, etc.) — never in `.env` files
- [ ] **Container security**: non-root user in Docker, read-only filesystem where possible, no privileged mode
- [ ] **Dependency scanning**: automated SCA (Snyk, Dependabot, or equivalent) in CI/CD pipeline
- [ ] **Penetration testing**: scheduled third-party testing at least annually
- [ ] **Incident response**: documented plan for data breach — notification timeline, rollback procedure

#### API Security

- [ ] **API gateway security**: enforce WAF rules at the edge (block SQLi, XSS, path traversal); IP allowlisting; edge rate limiting per API key; request size limits per endpoint
- [ ] **mTLS**: mutual TLS for service-to-service communication — verify client certificates at ingress for all internal traffic
- [ ] **API key rate limiting**: distinct per-key rate limits for service accounts (e.g., 1000 req/min per key) — decoupled from user session rate limits
- [ ] **WebSocket security**: validate `Origin` header on upgrade, authenticate on connect, validate message format and size on every frame
- [ ] **Race condition / TOCTOU**: use idempotency keys, pessimistic locking, or optimistic concurrency for all mutating workflows — prevent double-spend, inventory oversell, coupon multi-redeem
- [ ] **Business logic validation**: define allowed state transitions for stateful objects (order status, account tier, subscription) — reject any transition outside the workflow graph

#### Data Protection

- [ ] **Data classification**: tag every DB column with a tier — `public` / `internal` / `confidential` / `restricted` — enforce access controls based on tag
- [ ] **Database encryption detail**: column-level encryption (AES-256-GCM with key rotation) for individual sensitive fields (PII, credentials); whole-database TDE/disk encryption for bulk at-rest protection; document which strategy applies per table
- [ ] **Backup encryption**: encrypt all backups with AES-256 — store encryption key in a separate KMS from backup storage — test full restore process quarterly
- [ ] **Key management lifecycle**: use a dedicated KMS (AWS KMS, Azure Key Vault, HashiCorp Vault Enterprise) — automate key rotation, never hardcode keys, audit every key access

#### CI/CD & Pipeline Security

- [ ] **Secrets scanning in CI**: scan every commit and PR for secrets (Gitleaks, truffleHog) — block merge on confirmed match
- [ ] **SAST scanning**: static analysis in CI (CodeQL, Semgrep, SonarQube) — block PR merge on critical/high findings
- [ ] **DAST scanning**: dynamic scanning against staging environment before production deploy (OWASP ZAP, Burp Suite) — flag regression in known vulnerability classes
- [ ] **Cloud security posture scanning**: CSPM scanning for cloud config drift (AWS Config, Azure Policy, GCP Org Policy); IaC scanning for misconfigurations (tfsec, checkov, cdk-nag) — gated in CI pipeline
- [ ] **SBOM generation**: produce CycloneDX or SPDX SBOM at every build — attach to release artifact, submit to centralized dependency dashboard
- [ ] **Least-privilege CI permissions**: explicit `permissions:` block (GitHub Actions) per workflow and per job (`contents: read`, `id-token: write` only where needed) — never the default full-`GITHUB_TOKEN`
- [ ] **Pin Actions to SHAs**: reference third-party Actions by full commit SHA (not moving tags like `@v4`) and verify provenance — Actions supply chain is a real injection vector
- [ ] **Never `pull_request_target` with untrusted code**: it runs with base-branch secrets against PR-controlled content — if used, checkout the merge commit with a restricted token and no secret exposure to PR-controlled code
- [ ] **OIDC federation over long-lived secrets**: authenticate cloud deploys via OIDC (AWS/GCP/Azure workload identity) with short-lived tokens instead of storing cloud keys in CI
- [ ] **Secret masking**: CI systems mask secrets in logs; ensure no workflow echoes env vars or dumps `.env`
- [ ] **Branch protection + required reviews**: production branches require CI pass + human approval (from the Review Gate) — no agent self-merges
- [ ] **Install from lockfile in CI**: `npm ci` (not `npm install`) so builds reproduce the reviewed dependency tree
- [ ] **Secrets breach remediation**: rotate → `git filter-repo` → force-push + purge caches → rescan (see Supply Chain section)

#### Session & Monitoring

- [ ] **Concurrent session limits**: cap active sessions per user (default 5) — "kill all other sessions" on password change or privilege escalation
- [ ] **Logging standards**: structured JSON format — always log user ID, timestamp, action, resource ID, outcome, IP, correlation ID; **never log** passwords, tokens, PANs, secrets, raw request bodies, PII fields
- [ ] **Anomaly alerting**: alert on patterns — N failed logins from same IP in 5 min, privileged action outside business hours, unexpected spike in API key usage, new device/location for existing user

---

## Compliance Mapping

Key L3 controls mapped to common regulatory frameworks. Use this table during audits to demonstrate coverage.

| L3 Control | PCI-DSS 4.0 | HIPAA | SOC 2 (TSC) | GDPR |
|---|---|---|---|---|
| Encryption at rest (DB) | 3.4 | §164.312(a)(1) | CC6.1 | Art. 32 |
| Encryption in transit (TLS 1.3) | 4.1 | §164.312(e)(1) | CC6.7 | Art. 32 |
| Audit logging (admin actions) | 10.2 | §164.312(b) | CC7.2 | Art. 5(2) |
| Access control / least privilege | 7.1 | §164.312(a)(1) | CC6.2 | Art. 25 (PbD) |
| MFA enforcement | 8.4 | §164.312(d) | CC6.1 | — |
| Backup encryption + restore test | 3.5 | §164.308(a)(7) | CC6.1 | Art. 32 |
| Data retention + deletion | 3.1 | §164.316(b)(2) | CC6.4 | Art. 5(1)(e), 17 |
| Incident response plan | 12.10 | §164.308(a)(6) | CC7.3 | Art. 33 |
| Penetration testing | 11.4 | §164.308(a)(8) | CC7.1 | Art. 32 |
| Dependency scanning (SCA) | 6.4 | §164.308(a)(1) | CC8.1 | Art. 32 |
| SAST / DAST scanning | 6.4 | §164.308(a)(1) | CC8.1 | Art. 32 |
| Secrets management (vault) | 3.5 | §164.312(a)(1) | CC6.1 | Art. 25 |
| Webhook signature verification | — | §164.312(c)(2) | CC6.1 | Art. 32 |
| Cookie consent / GDPR | — | — | CC6.8 | Art. 7, 25 |
| SSRF / outbound allowlist | 6.4 | §164.308(a)(1) | CC6.1 | Art. 32 |
| SBOM / supply chain | 6.4 | — | CC8.1 | — |
