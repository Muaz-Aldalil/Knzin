---
name: backend-api
description: >
  Use when building, designing, debugging, or optimizing backend systems, REST/GraphQL APIs,
  authentication, database layers, or server-side logic. Covers Node.js, Python, Swift, PHP.
  Triggers on: API, endpoint, server, auth, JWT, database query, migration, middleware, route.
---

# Backend API Skill

Backend development across Node.js (Express/Fastify), Python (FastAPI/Flask), Swift (Vapor), and PHP (Laravel).

---

## When to Load

- Building new API endpoints or services
- Designing database schemas or migrations
- Implementing authentication/authorization
- Debugging server-side issues
- Optimizing database queries
- Setting up middleware or rate limiting
- Writing API documentation

## Architecture Pattern

```
Routes → Controllers → Services → Repositories → Database
   ↓         ↓            ↓           ↓
Validation  Logic    Business Rules  Data Access
```

**Rule**: Never skip layers. API calls never live in controllers.

## API Design Rules

1. RESTful conventions: GET/POST/PUT/PATCH/DELETE
2. Version all APIs: `/v1/resource`
3. Consistent error format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "issue": "invalid format" }]
  }
}
```
4. Pagination for lists: `?page=1&limit=20` or cursor-based
5. Proper HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500

## Authentication Patterns

- **JWT**: Stateless, use for APIs. Short-lived access tokens + refresh tokens
- **Sessions**: Stateful, use for web apps. Redis/server-side store
- **OAuth2**: Third-party login. Use established libraries, never roll your own

## Security Checklist

- [ ] Input validation at the boundary
- [ ] SQL injection prevention (parameterized queries ORMs)
- [ ] XSS prevention (escape output, CSP headers)
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured properly
- [ ] Secrets in environment variables, never in code
- [ ] HTTPS only in production
- [ ] Audit logging for sensitive operations

## Database Patterns

- **Migrations**: Always version-controlled, never manual DB changes
- **Queries**: Use ORM/query builder, avoid raw SQL unless necessary
- **Indexes**: Add for frequently queried columns, foreign keys
- **Transactions**: Use for multi-step operations that must succeed or fail together
