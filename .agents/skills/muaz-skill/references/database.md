# Database Guidance

This reference helps you choose a database for your web app and set it up. It assumes you are a frontend developer with little or no backend experience. It explains concepts in plain language and gives concrete recommendations.

---

## SQL vs NoSQL — What's the difference and when does it matter?

**SQL databases** (PostgreSQL, MySQL, SQLite) store data in tables with rows and columns. Each table has a fixed structure, and you use SQL to query the data. SQL enforces structure: every row has the same columns, and relationships between tables are defined with foreign keys.

**When SQL is right:** When your data has a clear structure that doesn't change much — users, products, orders, posts, anything with relationships between entities. When you need strong consistency (write data, read it back exactly as written). When you need transactions (multiple operations that must all succeed or all fail — e.g., creating an order and deducting inventory).

**NoSQL databases** (MongoDB) store data as documents (like JSON) without a fixed schema. Each document can have different fields. NoSQL is flexible — you can add fields to some documents without changing others.

**When NoSQL is right:** When your data is document-heavy and structure varies a lot between records — content management, logs, event data, rapidly evolving prototypes where the schema changes constantly. When horizontal scaling (sharding across many servers) matters more than consistency.

**Practical takeaway:** For most web apps (SaaS, e-commerce, dashboards, any app with users/orders/products), **start with SQL (PostgreSQL)**. The structure prevents data quality problems, and foreign keys are a feature, not a limitation. Consider NoSQL only when your data is genuinely document-heavy and schema flexibility matters more than consistency.

---

## PostgreSQL — The default database for most web apps

**PostgreSQL** is the default recommendation for most web apps. It is a relational SQL database that is:

- **Mature and well-supported:** Decades of development, huge community, excellent docs, supported by every major cloud provider and hosting platform.
- **Strong consistency:** Write data, read it back exactly as written. Critical for user data, orders, payments — anything where correctness matters.
- **Transaction support:** Group multiple operations into a transaction that either all succeed or all fail. Prevents partial updates.
- **Advanced features:** Rich data types (JSON, arrays, ranges, geospatial with PostGIS), full-text search, window functions, CTEs. You don't need all of these, but they're there when you do.
- **Huge ecosystem:** Every ORM supports it (Prisma, Drizzle, TypeORM, Sequelize). Every hosting platform supports it (Vercel Postgres, Supabase, Neon, Railway, Render, AWS RDS, GCP). You have options.

**When PostgreSQL is right:** Almost every web app. SaaS, e-commerce, dashboards, content sites with structured data, any app with users/orders/products — PostgreSQL works.

**When to consider something else:** MongoDB if data is document-heavy and schema flexibility matters more than consistency. Supabase or Firebase if you want a managed BaaS (database + auth + storage + realtime). SQLite for local/desktop/mobile apps or very small projects. Redis for caching/ephemeral data (use alongside PostgreSQL, not instead of it).

---

## Basic schema patterns — What your tables might look like

These are example table designs for common app types. Use them as a starting point — adapt to your actual app.

### Users table (every app with users)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String?  // only if using custom auth; omit if using Clerk/NextAuth
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```

- `id`: primary key, unique per user. `cuid()` generates a short, collision-resistant ID.
- `email`: unique — no two users can share an email.
- `password`: only for custom auth. If using Clerk/NextAuth, link the user by a provider ID instead.
- `createdAt`/`updatedAt`: timestamps for sorting, debugging, "joined X ago" in UI.

### Products table (e-commerce, marketplaces)

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2) // DECIMAL, not Float — money needs exactness
  images      String[]
  inventory   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}
```

- `price`: use `Decimal`, not `Float`. Floats have precision issues (0.1 + 0.2 ≠ 0.3). Decimals store exact values — critical for money.
- `images`: array of URL strings. PostgreSQL supports array columns. Use a separate `ProductImage` table if you need more metadata per image.
- `inventory`: stock count. Decrement when an order is placed. Handle out-of-stock (inventory = 0 or isActive = false).
- `isActive`: soft-delete — hide products without deleting data. Preserves order history.

### Orders + OrderItems (e-commerce)

```prisma
model Order {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  status    String   @default("pending") // "pending", "paid", "shipped", "cancelled"
  total     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     OrderItem[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // price at time of purchase, not current price
}
```

- Orders and OrderItems are separate tables. An order has many items — one-to-many relationship.
- `userId` on Order is a foreign key — references User table's `id`. The `@relation` attribute defines the relationship.
- `price` on OrderItem is the price at purchase time — copied from the product's current price. If the product price changes later, the order still shows what the user paid. Do not reference the product's current price on the order.
- `status` tracks order lifecycle: pending, paid, shipped, delivered, cancelled.

---

## Prisma — The default ORM for TypeScript/JavaScript

**Prisma** is an ORM that lets you interact with your database using TypeScript/JavaScript instead of raw SQL. It generates types from your schema so your queries are type-safe — if you query a field that doesn't exist, TypeScript catches it at build time.

**Why Prisma is the default:** Type safety (schema generates TypeScript types — catches errors before production), good DX (clear schema syntax, helpful errors, editor autocomplete), migrations (generate SQL to apply schema changes, can undo them), broad database support, mature and widely used.

**Drizzle** is a lighter alternative — more SQL-like, no code generation, smaller bundles, better cold-start for serverless/edge. Choose Drizzle if deploying to serverless/edge and cold starts matter, or if you prefer SQL-like queries and don't need code generation. For most apps, Prisma's DX and type safety outweigh these tradeoffs.

### Setting up Prisma (basic steps)

1. **Install:** `npm install prisma @prisma/client`
2. **Initialize:** `npx prisma init` (creates `prisma/schema.prisma`)
3. **Configure connection** in `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   `DATABASE_URL` from your `.env` file (e.g., `postgresql://postgres:password@localhost:5432/mydb`). For production: connection string from your hosting provider.
4. **Define models** in `schema.prisma` (the User, Product, Order models above).
5. **Generate Client:** `npx prisma generate` (creates typed client). Run after schema changes.
6. **Run migrations:** `npx prisma migrate dev --name init` (creates and applies a migration).
7. **Use Prisma Client:**
   ```typescript
   import { PrismaClient } from "@prisma/client";
   const prisma = new PrismaClient();

   // Create, read, update, delete
   const user = await prisma.user.create({ data: { email: "x@y.com", name: "Jane" } });
   const users = await prisma.user.findMany();
   const user = await prisma.user.findUnique({ where: { email: "x@y.com" } });
   await prisma.user.update({ where: { id: user.id }, data: { name: "Jane Smith" } });

   // Transaction: all succeed or all fail
   await prisma.$transaction(async (tx) => {
     const order = await tx.order.create({
       data: { userId: user.id, status: "pending", total: 50.00 }
     });
     await tx.orderItem.create({
       data: { orderId: order.id, productId: "xyz", quantity: 2, price: 25.00 }
     });
   });
   ```

### Basic queries you will use often

- **Find many:** `prisma.user.findMany({ where: { role: "admin" } })`
- **Find one:** `prisma.user.findUnique({ where: { id: "abc" } })` — returns `null` if not found
- **Create:** `prisma.user.create({ data: { email: "x@y.com", name: "Jane" } })`
- **Update:** `prisma.user.update({ where: { id: "abc" }, data: { name: "Jane Smith" } })`
- **Delete:** `prisma.user.delete({ where: { id: "abc" } })`
- **Create with relations:** `prisma.order.create({ data: { userId: "abc", items: { create: [{ productId: "xyz", quantity: 1, price: 10.00 }] } } })`
- **Include relations:** `prisma.order.findMany({ include: { items: true, user: true } })`
- **Transactions:** `prisma.$transaction(async (tx) => { ... })` — all succeed or all fail

---

## Migrations — How to change your database schema over time

**Migrations** are versioned schema changes. When you change `schema.prisma` (add a field, create a table, change a type), Prisma generates a migration that applies those changes to your database.

**Why they matter:** They let you evolve your schema without manually writing SQL. They keep a history of changes (useful for debugging, collaboration, rollback). They apply the same changes to every environment — migration files are the source of truth.

**Basic workflow:**
1. Change `schema.prisma` (add a field, create a table, etc.).
2. Generate and apply: `npx prisma migrate dev --name descriptive-name` (creates migration in `prisma/migrations/` and applies to local DB).
3. Generate Client: `npx prisma generate` (if schema changed).
4. Commit migration file and schema change to version control.

**Common scenarios:**
- **Add a field:** Add to model, run `migrate dev`. Existing rows get the default value (or null if optional).
- **Add a table:** Add model, run `migrate dev`. New table is created.
- **Rename a field:** Prisma may not detect renames. Add new field, migrate, then rename in a subsequent migration (or use `prisma db execute` for custom SQL).
- **Change a field type:** Prisma may require dropping and re-adding the column. Be careful with existing data — you may need to transform it.
- **Rollback:** `npx prisma migrate reset` resets DB to initial state (drops all tables, re-applies all migrations). Deletes data — use with caution. For production, use `prisma migrate resolve` to mark a failed migration as resolved, or write a rollback migration.

**Data migrations:** Sometimes you need to change data, not just schema — populate a new field, transform values, clean up. Prisma migrations are primarily for schema changes. For data migrations, write custom SQL in the migration file (Prisma allows this), or write a script using Prisma Client to update data and run it during deployment.

---

## Things a frontend developer might not know

### Indexes

**What they are:** A data structure that speeds up queries on a specific column. Like a book's index — instead of scanning every page, you look up the topic and go straight to it.

**When you need them:** When you query a column often and the table has many rows. E.g., looking up users by email — an index on `email` makes it fast even with millions of users. Without an index, the database scans every row — slow for large tables. Small tables (thousands of rows or fewer) are fast enough without indexes. Indexes cost space and slow down writes — don't add blindly.

**In Prisma:**
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique // @unique auto-creates a unique index
  name  String
  @@index([name]) // index on name
  @@index([createdAt]) // index on createdAt (useful for sorting by date)
}
```
- `@unique` auto-creates a unique index — enforces uniqueness and speeds up lookups.
- `@@index([field])` creates a non-unique index.

### Foreign keys

**What they are:** A column that references another table's primary key. The database ensures the value actually exists in the referenced table.

**Why they matter:** They prevent orphaned data. Creating an Order with a `userId` that doesn't exist in User is rejected. Deleting a User with Orders can be rejected (or cascade).

**In Prisma:**
```prisma
model Order {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
```
- `userId`: foreign key column. `user`: relation field — navigate from Order to User.
- `fields: [userId]`: which column holds the foreign key. `references: [id]`: which column in User is referenced.

**Cascade deletes:** By default, deleting a User with Orders is rejected (prevents orphaned orders). Configure cascade:
```prisma
model Order {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
With `onDelete: Cascade`, deleting a User also deletes their Orders. Use carefully — can delete a lot of data. For orders, you usually don't want cascade (preserve order history). Prohibit deletion of users with orders, or use `onDelete: SetNull`.

### Transactions

**What they are:** Group multiple operations into a unit that either all succeed or all fail. If any operation fails, all changes are rolled back.

**When you need them:** When multiple operations must be consistent — e.g., creating an order and deducting inventory. If the order is created but inventory deduction fails, you have an order for an out-of-stock product. A transaction ensures both happen or neither happens.

**In Prisma:**
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { userId, status: "pending", total } });
  await tx.inventory.update({
    where: { productId },
    data: { count: { decrement: quantity } }
  });
});
```
If inventory update fails (insufficient stock), order creation is rolled back.

### Connection pooling

**What it is:** Maintains a set of open database connections your app can reuse, instead of opening a new connection per query. Opening a connection is expensive (network handshake, auth), so reusing connections improves performance. Without pooling, each query opens a new connection — under load, this can exhaust the database's connection limit (PostgreSQL defaults to 100, often lower on managed services).

**How Prisma handles it:** Prisma Client uses connection pooling internally. In serverless (Vercel, Cloudflare), you may need to configure pool size explicitly. Managed services (Supabase, Neon, Vercel Postgres) often provide connection pooling — check your provider's docs. Prisma's default pooling is sufficient for most apps. If you see connection limit errors in production, check your provider's pooling options and configure Prisma's `connection_limit`.

---

## When to use Supabase or Firebase instead

**Supabase** is a PostgreSQL-based BaaS — PostgreSQL database, auth, file storage, real-time subscriptions, edge functions, all managed, generous free tier, good DX.

**Choose Supabase when:** Quick start (auth + database + storage in one, minimal backend code). Real-time features (live updates, presence — built-in on PostgreSQL changes). Small-to-medium app where you don't want to manage a database server. You're comfortable with less backend control and vendor lock-in in exchange for faster development.

**Supabase tradeoffs:** PostgreSQL under the hood — data modeling and queries are PostgreSQL-compatible. Use Prisma with Supabase via the PostgreSQL connection string. Built-in auth (Supabase Auth), similar to Firebase Auth but PostgreSQL-based. Vendor lock-in: migrating away keeps your PostgreSQL data, but you lose managed auth, storage, and realtime.

**Firebase** is a NoSQL BaaS by Google — Firestore (NoSQL database), auth, storage, hosting, more.

**Choose Firebase when:** Mobile-first app (excellent mobile SDKs). Real-time sync (Firestore has real-time listeners). Simplest possible setup.

**Firebase tradeoffs:** NoSQL (Firestore), not SQL — no joins, limited querying, eventual consistency. For structured relational data, SQL (PostgreSQL) is usually better. Vendor lock-in (Google) — migrating away is harder than from Supabase. Pricing can be unpredictable at scale — Firestore charges per read/write.

**Practical guidance:** For a web app, **start with PostgreSQL** (Vercel Postgres, Supabase, Neon, Railway, Render). Use **Supabase** if you want BaaS convenience (auth + storage + realtime + database in one). Use **Firebase** if mobile-first or need real-time NoSQL and you're comfortable with the tradeoffs. Avoid Firebase for structured relational data — use PostgreSQL instead.

---

## Quick decision guide

| Your situation | Recommendation |
|---|---|
| SaaS, e-commerce, dashboard, any app with users/orders/products | **PostgreSQL** + **Prisma** |
| Next.js app, simplest setup | **PostgreSQL** + **Prisma** (Vercel Postgres, Supabase, or Neon) |
| Mobile-first app with real-time needs | **Firebase** (Firestore + Auth) |
| Small app, want auth + database + storage in one | **Supabase** (PostgreSQL + Auth + Storage + Realtime) |
| Local/desktop/mobile app or very small project | **SQLite** |
| Document-heavy data, schema changes frequently | **MongoDB** (but consider if SQL would work — structure is usually an advantage) |
| Caching, sessions, rate limiting | **Redis** (alongside PostgreSQL, not instead of it) |
| Separate backend app wanting serverless PostgreSQL | **Neon** or **Supabase** |

---

## What's next

- **Auth implementation** — `references/auth.md` for adding login (Clerk, NextAuth, custom auth).
- **Payments** — `references/payments.md` for Stripe/PayPal integration (checkout flows, webhooks, what to store).
- **Backend structure** — `references/backend.md` for backend structure (API routes, separate backend, serverless, BaaS) and frontend connection.
- **Deployment** — `references/deployment.md` for deploying a full-stack app (frontend + backend + database + secrets).
