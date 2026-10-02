# OpenCode Delegation Prompt: KNZiN Feature 005 Status PDF

Act as the document-production specialist for the KNZiN project.

Read the source Markdown file:

`KNZiN_Feature_005_Status_Report.md`

Your task is to convert that source into a polished PDF suitable for the **team lead / project leadership**.

## Source-of-truth rule

The Markdown file is the sole factual source for the report.

Do not invent, infer, estimate, modernize, reinterpret, or add:

- metrics
- dates
- names
- approvals
- project milestones
- screenshots
- architecture claims
- security claims
- completion claims
- production readiness claims

Do not browse the web. Do not use outside information to fill gaps.

Do not modify the source Markdown.

## Required output

Create exactly:

`KNZiN_Feature_005_Status_Report.pdf`

Keep `KNZiN_Feature_005_Status_Report.md` unchanged.

## Hard page limit

**The PDF must be no more than 3 pages.**

Prefer 2 pages when readability remains strong, but never compress the content into unreadably small text merely to meet the page limit.

After generating the PDF, independently verify the page count using an available PDF inspection tool such as `pdfinfo`, `qpdf`, or an equivalent local method.

If the PDF exceeds 3 pages, revise the layout/content density and regenerate it until it is within the limit.

## Audience

The reader is a team lead or project manager, not the developer who implemented the feature.

The report should therefore answer quickly:

1. What was delivered?
2. What has actually been verified?
3. What security/reliability controls exist?
4. What is still required before production?
5. What are the known verification boundaries?
6. What is the current repository/review state?

Keep technical details that establish confidence, but avoid code dumps and implementation trivia.

## Required status distinction

Make this distinction visually obvious near the top:

**IMPLEMENTATION: READY**

**PRODUCTION: OPERATIONAL PREREQUISITES PENDING**

Never collapse those into a single “complete” status.

## Content that must remain visible

The final PDF must preserve the source facts below, without changing their meaning:

- Feature 005 is the Learner Hub / Course Library / Ticket Ledger.
- Branch: `005-learner-hub`.
- 85 backend tests passed, 0 failed, 5,739 assertions.
- 22 backend test files/classes, 20 Feature + 2 Unit.
- 63 frontend tests passed, 21 suites.
- `npm run build` passed, with 0 TypeScript errors and 47 static pages generated.
- Clean migration and rollback/re-migration were verified on isolated `knzin_test`.
- 24 defined security attack scenarios were verified across the stated areas.
- True parallel race testing was **not** executed.
- Automated browser E2E was **not** executed.
- Production launch remains pending.
- T058–T062 remain operational release gates.
- A Redis queue worker processing `GenerateTicketsJob` is required in production.
- `php artisan schedule:run` must run every minute; reconciliation is configured for every 5 minutes.
- Feature 005 produced 0 commits and remains uncommitted for human review.
- Future bundle coverage for newly published parts remains an unresolved product decision.

## Layout guidance

Use a restrained, professional engineering/project-report style.

Recommended hierarchy:

### Page 1
- Title
- Implementation / Production status
- Executive Status
- Delivered Scope
- Verification Results table

### Page 2
- Security & Reliability
- Production Release Prerequisites

### Page 3, only if required
- Verification Boundaries
- Review & Repository State
- Final Status

You may rebalance sections to produce a better result.

Use whitespace intentionally, but do not waste page space.

Use one compact results table rather than multiple large tables.

Prefer short bullets over long paragraphs.

## Visual requirements

- Professional technical report aesthetic.
- Clear section hierarchy.
- Strong status treatment for Ready vs Pending.
- Readable tables.
- Consistent margins and spacing.
- Normal professional body text size.
- No decorative stock imagery.
- No unnecessary charts or diagrams because the source contains no chart data.
- No excessive color or visual effects.

## Accuracy and wording rules

Do not use or introduce:

- enterprise-grade
- unbypassable
- unforgeable
- zero risk
- fully secure
- guaranteed under all concurrency conditions
- 100% production ready
- browser E2E verified

Preserve the source's precise language about verification boundaries.

For concurrency, explicitly distinguish:

- database/design guarantees
- sequential automated simulation
- absence of a true parallel test

For media security, preserve that signed URLs are short-lived bearer capabilities and watermarking is deterrence/forensics, not absolute screen-capture prevention.

## Final quality-control checklist

Before delivering the PDF, verify all of the following against the Markdown source:

- Title is correct.
- Implementation is shown as READY.
- Production is shown as OPERATIONAL PREREQUISITES PENDING.
- 85 / 5,739 backend figures are correct.
- 22 backend files/classes are correct.
- 63 / 21 frontend figures are correct.
- 47 static pages is correct.
- 24 security scenarios is correct.
- Clean migration verification is represented correctly.
- No true parallel concurrency test is claimed.
- No automated browser E2E test is claimed.
- T058–T062 are all present.
- Redis worker requirement is present.
- 5-minute reconciliation schedule is present.
- 0 Feature 005 commits is present.
- Uncommitted human-review state is present.
- Future bundle coverage decision is clearly marked unresolved.
- No unsupported claims were added.
- PDF page count is **<= 3**.
- Source Markdown was not modified.

## Stop condition

Once the PDF passes the checklist and the page count is 3 or fewer, stop.

Do not create additional report variants.
Do not create a DOCX unless explicitly requested.
Do not modify the Feature 005 implementation.
Do not commit any repository changes merely for PDF generation.
