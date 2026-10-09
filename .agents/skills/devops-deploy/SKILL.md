---
name: devops-deploy
description: >
  Use when setting up CI/CD pipelines, Docker containers, deployment configurations,
  environment management, or infrastructure automation. Triggers on: deploy, Docker, CI,
  GitHub Actions, Vercel, Netlify, AWS, nginx, hosting, pipeline.
---

# DevOps & Deployment Skill

CI/CD, containerization, and deployment automation for any platform.

---

## When to Load

- Setting up CI/CD pipelines
- Writing Dockerfiles or docker-compose
- Configuring deployment (Vercel, Netlify, AWS)
- Setting up nginx or reverse proxies
- Managing environment variables
- Configuring domains and SSL
- Setting up monitoring

## Deployment Platform Guide

| Platform | Best For | Free Tier |
|---|---|---|
| Vercel | Next.js, frontend | Yes (generous) |
| Netlify | Static sites, JAMstack | Yes |
| Railway | Full-stack, databases | Yes (limited) |
| Render | Backend services | Yes |
| AWS EC2 | Full control | 12 months free |
| Docker + VPS | Any stack | Depends on VPS |

## Dockerfile Template

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## CI/CD Pipeline Template (GitHub Actions)

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      # Add your deployment step here
```

## Environment Management

```
.development.env    → Local development
.staging.env        → Staging environment
.production.env     → Production (never commit!)
.env.example        → Template (committed, no values)
```

**Rule**: Secrets in env vars, never in code or config files committed to git.

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    location / {
        root /var/www/app/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
