---
name: testing-qa
description: >
  Use when writing unit tests, integration tests, E2E tests, setting up test infrastructure,
  debugging test failures, or improving test coverage. Triggers on: test, spec, vitest, jest,
  playwright, pytest, mock, stub, fixture, coverage.
---

# Testing & QA Skill

Comprehensive testing across all stacks — unit, integration, E2E.

---

## When to Load

- Writing new tests for code
- Setting up test infrastructure
- Debugging failing tests
- Improving test coverage
- Setting up E2E tests
- Writing test fixtures or helpers
- Reviewing test quality

## Framework Selection

| Stack | Unit/Integration | E2E |
|---|---|---|
| JS/TS (modern) | **Vitest** | Playwright |
| JS/TS (legacy) | Jest | Playwright |
| Python | pytest | Playwright |
| Swift | XCTest | — |
| Multi-stack | Vitest + pytest | Playwright |

## Test Structure (AAA Pattern)

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const input = { email: 'test@example.com', name: 'Test' };
      const mockDB = createMockDB();

      // Act
      const user = await createUser(mockDB, input);

      // Assert
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test');
      expect(user.id).toBeDefined();
    });

    it('should throw on duplicate email', async () => {
      // Arrange
      const input = { email: 'existing@example.com', name: 'Test' };
      const mockDB = createMockDB({ existingUser: true });

      // Act & Assert
      await expect(createUser(mockDB, input))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

## Test Naming Convention

```
should [expected behavior] when [condition]

Examples:
- should return user when valid ID provided
- should throw NotFoundError when user does not exist
- should validate email format before creating account
- should show loading spinner while fetching data
- should display error message when API fails
```

## What to Test

### Always Test
- Happy path (correct input → correct output)
- Error cases (invalid input → proper error)
- Edge cases (empty, null, undefined, boundary values)
- Authentication/authorization (unauthorized → 401, forbidden → 403)

### Don't Test
- Third-party library internals
- Simple getters/setters
- Framework boilerplate
- Implementation details (test behavior, not code)

## Mocking Rules

1. Mock external services (APIs, databases, file system)
2. Don't mock the code under test
3. Use dependency injection for testable code
4. Reset mocks between tests
5. Verify mock calls when side effects matter

## E2E Test Pattern (Playwright)

```typescript
test('user can sign up and see dashboard', async ({ page }) => {
  // Navigate to sign up
  await page.goto('/signup');

  // Fill form
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'SecurePass123!');
  await page.click('[data-testid="submit"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

## Coverage Targets

| Type | Target | Notes |
|---|---|---|
| Business logic | 80%+ | Critical paths |
| API endpoints | 90%+ | All status codes |
| UI components | 70%+ | User interactions |
| Overall | 75%+ | Meaningful coverage |

## CI Test Integration

```yaml
# Run in CI
- run: npm run lint        # Code style
- run: npm run typecheck   # Type safety
- run: npm test            # Unit + integration
- run: npm run test:e2e    # E2E (optional, can be separate job)
```
