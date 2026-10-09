# SEO — Structured Data, Meta Tags & Social Preview

Load on any public-facing site. Skip for authenticated-only dashboards.

---

## Meta Tags per Stack

### Next.js (app router)
```typescript
export const metadata = {
  title: 'Page Title — Site Name',
  description: 'Page description for search results.',
  openGraph: {
    title: 'Page Title',
    description: 'OG description',
    url: 'https://example.com/page',
    siteName: 'Site Name',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title',
    description: 'Twitter description',
    images: ['/og.png'],
  },
  alternates: { canonical: 'https://example.com/page' },
};
```

### Nuxt 3
```typescript
useSeoMeta({
  title: 'Page Title — Site Name',
  ogTitle: 'Page Title',
  description: 'Description',
  ogDescription: 'Description',
  ogImage: '/og.png',
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: 'https://example.com/page' }],
});
```

### Vue (plain)
```typescript
import { useHead } from '@unhead/vue';

useHead({
  title: 'Page Title — Site Name',
  meta: [
    { name: 'description', content: 'Description' },
    { property: 'og:title', content: 'Page Title' },
    { property: 'og:image', content: '/og.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ],
  link: [{ rel: 'canonical', href: 'https://example.com/page' }],
});
```

### Angular
```typescript
import { Meta, Title } from '@angular/platform-browser';

constructor(private meta: Meta, private title: Title) {}

ngOnInit() {
  this.title.setTitle('Page Title — Site Name');
  this.meta.updateTag({ name: 'description', content: 'Description' });
  this.meta.updateTag({ property: 'og:title', content: 'Page Title' });
  this.meta.updateTag({ property: 'og:image', content: '/og.png' });
}
```

### Astro (in Layout.astro)
```astro
---
const { title, description, ogImage = '/og.png' } = Astro.props;
---
<!doctype html>
<html lang="en">
<head>
  <title>{title} — Site Name</title>
  <meta name="description" content={description}>
  <meta property="og:title" content={title}>
  <meta property="og:image" content={ogImage}>
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href={Astro.url}>
```

### Plain HTML
```html
<title>Page Title — Site Name</title>
<meta name="description" content="Description">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="/og.png">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Description">
<meta name="twitter:image" content="/og.png">
<link rel="canonical" href="https://example.com/page">
```

---

## JSON-LD Structured Data

### Organization (homepage)
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": ["https://twitter.com/...", "https://linkedin.com/company/..."]
}
</script>
```

### Product
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "description": "Product description",
  "image": "https://example.com/product.jpg",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

### Article / Blog Post
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "author": { "@type": "Person", "name": "Author Name" },
  "datePublished": "2026-01-15T08:00:00Z",
  "image": "https://example.com/article-hero.jpg"
}
</script>
```

### BreadcrumbList
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": "https://example.com"
  }, {
    "@type": "ListItem",
    "position": 2,
    "name": "Category",
    "item": "https://example.com/category"
  }]
}
</script>
```

### FAQ
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Question text?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Answer text."
    }
  }]
}
</script>
```

### LocalBusiness
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345"
  },
  "telephone": "+1234567890"
}
</script>
```

---

## Technical SEO

- **Canonical URLs** on every page to prevent duplicate content
- **Sitemap.xml** generated via framework plugin (next-sitemap, @astrojs/sitemap, nuxt-sitemap)
- **robots.txt** — allow all for public, disallow `/admin` `/api` for authenticated apps
- **hreflang** for i18n: `<link rel="alternate" hreflang="en" href="https://example.com/en">`
- **Meta robots** — `noindex` on staging, paginated pages >1, filtered/search result pages
- **Core Web Vitals** — LCP < 2.5s, INP < 200ms, CLS < 0.1 (Google ranking signal)
- **Mobile-first** — Google mobile-first indexing; 375px verified

---

## OG Image Generation

- 1200×630px, PNG, < 200KB
- Text at least 30px for readability when previewed small
- Brand color background + white text
- Auto-generation: `@vercel/og` (Next.js), `unplugin-og-image` (Nuxt), `satori`

**Rule:** Every page gets its own OG image with dynamic title text. Never serve the same OG image for all pages.

---

## Phase 5 Checklist
- [ ] Meta tags (title, description, OG, Twitter) set per page
- [ ] Canonical URL on every page
- [ ] JSON-LD structured data applied (Organization + page-specific)
- [ ] Sitemap.xml generated and submitted to Google Search Console
- [ ] robots.txt present (allow or disallow as appropriate)
- [ ] OG image exists, 1200×630px, < 200KB, unique per page type
- [ ] hreflang tags correct for i18n sites
- [ ] Lighthouse SEO score >= 90
