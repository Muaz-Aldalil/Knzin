---
name: next-server-action-guard
description: >-
  Security and architecture guard for Next.js 14-16+ App Router Server Actions.
  Enforces server-side authentication derivation, anti-IDOR resource ownership checks,
  Zod payload validation, and secure error boundaries. Use whenever creating, editing,
  or reviewing Server Actions in 'actions.ts' or App Router endpoints.
compatibility: Next.js 14+, 15+, 16+ App Router, React 19 Server Actions.
---

# Next.js Server Actions Security & Quality Guard (SKILL.md)

## Status & Purpose
This skill serves as the automated security and quality gatekeeper for Server Actions in the Next.js App Router. It protects applications from the OWASP Top 10 vulnerabilities unique to Server Actions: Broken Object-Level Authorization (IDOR), untrusted client parameters, unvalidated payloads, and database connection leaks.

---

# 1. CORE THREAT MODEL: SERVER ACTIONS ARE PUBLIC POST ENDPOINTS

Developers frequently make the fatal mistake of treating Server Actions as private internal module functions because they reside alongside React components.

**The Reality**:
* Every `"use server"` function exported from a file is assigned an internal action ID and becomes a **publicly addressable POST endpoint**.
* Anyone can trigger this endpoint via `curl` or Postman with arbitrary JSON payloads, bypassing any client-side UI form checks.

---

# 2. THE 5 NON-NEGOTIABLE INVARIANTS

### INVARIANT 1: Zero Client Trust (Never Accept User ID from Client)
- **Forbidden**: Passing `userId`, `role`, `isAdmin`, or `organizationId` from a client component into a Server Action argument.
- **Mandatory**: Always re-authenticate and derive the caller's identity directly from the secure server session or JWT cookie:
  ```typescript
  // ❌ VULNERABLE: Client can pass another user's ID (IDOR)
  export async function deleteDocument(docId: string, userId: string) { ... }

  // ✅ SECURE: Server authoritative
  export async function deleteDocument(docId: string) {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("UNAUTHORIZED");
    }
    // Proceed with session.user.id
  }
  ```

### INVARIANT 2: Mandatory Schema Validation at System Boundary
- Every Server Action input must be validated using `zod`, `valibot`, or an equivalent schema validator before touching any database, API, or service layer:
  ```typescript
  const UpdateProfileSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email(),
  });

  export async function updateProfileAction(rawInput: unknown) {
    const session = await requireAuth();
    const result = UpdateProfileSchema.safeParse(rawInput);
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }
    // Use result.data safely
  }
  ```

### INVARIANT 3: Anti-IDOR Authorization Check on Every Resource
- Checking if a user is logged in is NOT enough. You must verify that the authenticated user **owns** the target resource or possesses explicit permission:
  ```typescript
  const resource = await db.project.findUnique({ where: { id: projectId } });
  if (!resource || resource.userId !== session.user.id) {
    return { success: false, error: "NOT_FOUND_OR_FORBIDDEN" };
  }
  ```

### INVARIANT 4: Strict Error Masking & Exception Hygiene
- **Never re-throw raw database or system errors to the client.**
- Database driver errors can expose table schemas, connection strings, and internal IP addresses.
- **Rule**: Catch internal errors, log them server-side, and return a clean, user-safe error message:
  ```typescript
  try {
    await db.transferFunds(...);
    return { success: true };
  } catch (error) {
    console.error("[CRITICAL_ACTION_ERROR]", error); // Server-side log
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
  ```

### INVARIANT 5: Safe Cache Revalidation
- Only call `revalidatePath()` or `revalidateTag()` AFTER the database transaction has successfully committed.
- Calling revalidation inside an uncommitted transaction causes dirty reads in concurrent sessions.

---

# 3. AUDIT CHECKLIST FOR STAGE 7 CONVERGENCE

During Stage 7 of `engineering-workflow`, the agent must inspect all modified files containing `"use server"`:

```
[ ] 1. Does every exported action derive identity from server session?
[ ] 2. Is there zero instance of userId/role accepted as an argument?
[ ] 3. Does every input pass through a safeParse() schema?
[ ] 4. Are database mutations guarded by user ownership checks?
[ ] 5. Are all internal exceptions caught and masked from browser responses?
[ ] 6. Are state mutations idempotent?
```

If any check fails: **Definite Defect.** Apply the fix immediately before presenting verification handoff.
