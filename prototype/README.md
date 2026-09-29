# KNZiN Visual Prototype (Frozen Reference)

> [!WARNING]
> **DO NOT USE AS AUTHORITATIVE LOGIC, TEXT, OR PRICING SOURCE.**  
> This directory (`prototype/`) is a preserved, client-side visual and layout prototype from Phase 1. It serves exclusively as a visual and responsive design reference.

## Superseded Artifacts in this Prototype

1. **Mandatory Legal Shield Text**:
   - `prototype/index.html:216` contains an outdated draft string lacking required privacy policy and non-exchangeable clauses.
   - **Canonical Authority**: Always use the canonical verbatim text from [.specify/memory/constitution.md:49](file:///d:/Work%20Projects/Knzin%20Project/.specify/memory/constitution.md#L49) and [specs/002-auth-catalog-checkout/spec.md:124](file:///d:/Work%20Projects/Knzin%20Project/specs/002-auth-catalog-checkout/spec.md#L124):
     > *"أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل"*

2. **Course Part Pricing**:
   - `prototype/index.html:87` contains an obsolete prototype subtitle mentioning `"$1"`.
   - **Canonical Authority**: Single parts are strictly **$2.00 USD (2,620 IQD accounting / 2,000 IQD marketing display)** awarding **1 promotional ticket**. Full bundles are **$10.00 USD (13,100 IQD accounting / 13,000 IQD marketing display)** awarding **15 promotional tickets**.

3. **Countdown Timers**:
   - `prototype/js/app.js` contains a prototype demo bug where `heroTime++` increments instead of decrementing.
   - **Canonical Authority**: Real countdown timers must decrement toward target draw timestamps.

4. **Architecture & Persistence**:
   - `prototype/js/app.js` uses dummy browser `localStorage`.
   - **Canonical Authority**: Full-stack Next.js 14 App Router + Laravel 11 REST API + MySQL 8+ + Redis per Constitution Principle I.
