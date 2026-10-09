# Project Brief — Persistent Source of Truth

---

## Purpose

After Phase 3 (blueprint confirmed), write a `.context/PROJECT_BRIEF.md` file at the project root. This file becomes the single source of truth for the entire project. Every future AI response reads it first.

---

## Auto-Generation (end of Phase 3)

After blueprint is confirmed, write this exact structure to `.context/PROJECT_BRIEF.md`:

```markdown
# Project Brief

Goal       : [one sentence]
Stack      : [framework]
Pages      : [ordered list]
Users      : [personas]
Theme      : [light/dark/both]
Auth       : [login method or none]
Content    : [static/CMS/API]
Brand      : [existing assets or none]
i18n       : [languages + RTL]
Hard reqs  : [non-negotiable constraints]
Security   : [L1/L2/L3]
```

If the user filled the prompt template, map fields directly.
If not, extract from Phase 1 Q&A answers.

---

## Read Sequence (every response)

1. Check if `.context/PROJECT_BRIEF.md` exists at project root
2. If yes → read it silently
3. Cross-check the user's new message against the brief:
   - **Contradiction detected?** (user says "make it dark" but brief says light)
     → Flag it: "The brief says Light theme. Update it to Dark?"
   - **New info outside existing brief?** (user asks for a feature not in Pages)
     → Ask: "Add this to the brief?"
   - **On topic?** → Proceed with the brief as context
4. After the response, if anything changed, update the file

---

## Update Rules

- Only update when explicitly confirmed by the user
- One update per conversation turn (don't update on every keystroke)
- Keep the file under 30 lines — it's a summary, not a spec
- If the file grows past 30 lines, archive to `.context/DECISIONS.md`

---

## Conflict Resolution

| User says | Brief says | AI action |
|---|---|---|
| "Add login" | Auth: None | "The brief says no auth. Adding auth changes security from L1 to L2. Confirm?" |
| "Dark mode" | Theme: Light | "Change theme to Both (light+dark)?" |
| "Deploy to Netlify" | Not specified | "Add Netlify as deployment target?" |
| "Add a blog section" | Pages: [no blog] | "Add Blog to the pages list?" |

**Never silently override the brief.** Always flag contradictions.

---

## Why

- Prevents drift across long conversations
- Lets the AI pick up where it left off in a new session
- A junior developer reading the file can understand the project in 30 seconds
