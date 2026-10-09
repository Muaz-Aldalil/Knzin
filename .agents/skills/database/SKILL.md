---
name: database
description: >
  Use when designing database schemas, writing queries, creating migrations, optimizing
  performance, or managing data layer across PostgreSQL, MongoDB, SQLite, Firebase, Redis.
  Triggers on: schema, query, migration, database, SQL, index, relation, collection, Firestore.
---

# Database Skill

Database design, management, and optimization across SQL (PostgreSQL, SQLite) and NoSQL (MongoDB, Firebase, Redis).

---

## When to Load

- Designing new database schemas
- Writing or optimizing queries
- Creating migrations
- Setting up indexes for performance
- Debugging data issues
- Planning data architecture
- Setting up caching layers

## Database Selection Guide

| Use Case | Database | Why |
|---|---|---|
| Complex relations, ACID | PostgreSQL | Relational integrity, full SQL |
| Simple local storage | SQLite | Zero config, embedded |
| Flexible schema, scale | MongoDB | Document model, horizontal scale |
| Real-time, serverless | Firebase/Firestore | Built-in auth, real-time sync |
| Caching, sessions | Redis | In-memory, fast, TTL support |
| All of the above | PostgreSQL + Redis | Primary + cache layer |

## Schema Design Rules

1. **Normalization**: 3NF for relational (avoid duplication)
2. **Denormalization**: When read performance matters more than write simplicity
3. **Foreign keys**: Always enforce referential integrity
4. **Timestamps**: created_at, updated_at on every table
5. **Soft deletes**: deleted_at instead of DELETE (unless audit not required)
6. **UUID vs Auto-increment**: UUID for distributed, auto-increment for simple

## SQL Patterns

```sql
-- Safe pagination (avoid OFFSET for large datasets)
SELECT * FROM users WHERE id > $last_id ORDER BY id LIMIT 20;

-- Prevent N+1 (use JOIN or batch)
SELECT u.*, p.* FROM users u
LEFT JOIN posts p ON p.author_id = u.id
WHERE u.id IN ($user_ids);

-- Upsert (PostgreSQL)
INSERT INTO users (email, name) VALUES ($email, $name)
ON CONFLICT (email) DO UPDATE SET name = $name;
```

## Migration Rules

1. Never modify production DB directly — always use migrations
2. Migrations must be reversible (up + down)
3. Test migrations on a copy before production
4. Back up data before destructive migrations
5. Migrations should be idempotent (safe to run multiple times)

## Performance Checklist

- [ ] Indexes on frequently queried columns
- [ ] Indexes on foreign keys
- [ ] EXPLAIN ANALYZE slow queries
- [ ] Avoid SELECT * — select only needed columns
- [ ] Use connection pooling
- [ ] Cache expensive queries with Redis
- [ ] Batch inserts/updates instead of one-by-one
