# muaz-skill Design Rules

Priority order: User explicit request > These rules > Defaults

---

## Typography
1. Display text (h1, hero): weight 300-400, tracking -0.02em to -0.04em
2. Body text: weight 400, line-height 1.5-1.7
3. NEVER use weight 700+ on headings

## Color
4. NEVER use pure black (#000) or pure white (#FFF)
   Use #1A1A1A / #FAFAF8 instead
5. EXACTLY ONE action color per project — all accents derive from it
6. Background neutrals MUST be tinted (warm or cool), never flat gray

## Layout
7. Use asymmetric layouts (60/40, 2/3-1/3) — NEVER center everything
8. Section padding = 96px minimum (48px on mobile)
9. Use border, NOT box-shadow, for card/container elevation

## Effects
10. NEVER use gradient text (linear-gradient on text)
11. NEVER use glass morphism (backdrop-blur on containers)
12. NEVER use box-shadows on cards — use 1px border instead

## Anti-Hallucination
13. NEVER assume a library is installed — check package.json first
14. NEVER invent a function — grep for existing implementations
15. NEVER use `any` type in TypeScript — define or infer properly

## Accessibility
16. Use semantic HTML (<nav>, <main>, <section>, <article>)
17. Add alt text to all images
18. Ensure keyboard navigation works
19. Use aria-label on interactive elements without visible text

## Performance
20. Use CSS transitions over Framer Motion when possible
21. Don't import entire libraries — use named imports
22. Lazy load images below the fold

## Existing Code
23. Match the project's existing code style (naming, imports, structure)
24. Don't create new files if an existing file serves the purpose
25. Check neighboring files before writing new code

## Error Handling
26. Handle loading/success/error states on all async operations
27. Add form validation before submission
28. Don't swallow errors silently — log or surface them

## Workflow
29. Search 3-5 real design examples before building any section
30. Complete the pre-flight checklist before Phase 3
31. Write `.design-lock.md` after Phase 3 — re-read at session start, override only with user confirmation
32. Before claiming done, paste `anti-slop.sh` output + self-score — verbal claims without tool evidence are defects
33. Ask clarifying questions when requirements are ambiguous
34. Always detect before asking — never ask what you can read from the project
35. Pre-fill detected values — user confirms, not re-answers
36. Skip irrelevant questions — landing pages don't need auth/API/state questions
37. User answers always win over detection — detection is suggestion, not constraint
