#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UI/UX Pro Max Core - BM25 search engine for UI/UX style guides
"""

import csv
import re
from pathlib import Path
from math import log
from collections import defaultdict

# ============ CONFIGURATION ============
DATA_DIR = Path(__file__).parent.parent / "data"
MAX_RESULTS = 3

CSV_CONFIG = {
    "style": {
        "file": "styles.csv",
        "search_cols": ["Style Category", "Keywords", "Best For", "Type", "AI Prompt Keywords"],
        "output_cols": ["Style Category", "Type", "Keywords", "Primary Colors", "Effects & Animation", "Best For", "Light Mode ✓", "Dark Mode ✓", "Performance", "Accessibility", "Framework Compatibility", "Complexity", "AI Prompt Keywords", "CSS/Technical Keywords", "Implementation Checklist", "Design System Variables"]
    },
    "color": {
        "file": "colors.csv",
        "search_cols": ["Product Type", "Notes"],
        "output_cols": ["Product Type", "Primary", "On Primary", "Secondary", "On Secondary", "Accent", "On Accent", "Background", "Foreground", "Card", "Card Foreground", "Muted", "Muted Foreground", "Border", "Destructive", "On Destructive", "Ring", "Notes"]
    },
    "chart": {
        "file": "charts.csv",
        "search_cols": ["Data Type", "Keywords", "Best Chart Type", "When to Use", "When NOT to Use", "Accessibility Notes"],
        "output_cols": ["Data Type", "Keywords", "Best Chart Type", "Secondary Options", "When to Use", "When NOT to Use", "Data Volume Threshold", "Color Guidance", "Accessibility Grade", "Accessibility Notes", "A11y Fallback", "Library Recommendation", "Interactive Level"]
    },
    "landing": {
        "file": "landing.csv",
        "search_cols": ["Pattern Name", "Keywords", "Conversion Optimization", "Section Order"],
        "output_cols": ["Pattern Name", "Keywords", "Section Order", "Primary CTA Placement", "Color Strategy", "Conversion Optimization"]
    },
    "compositions": {
        "file": "compositions.csv",
        "search_cols": ["name", "category", "style_tags", "description", "use_cases", "anti_patterns"],
        "output_cols": ["name", "category", "style_tags", "description", "use_cases", "anti_patterns", "examples"]
    },
    "product": {
        "file": "products.csv",
        "search_cols": ["Product Type", "Keywords", "Primary Style Recommendation", "Key Considerations"],
        "output_cols": ["Product Type", "Keywords", "Primary Style Recommendation", "Secondary Styles", "Landing Page Pattern", "Dashboard Style (if applicable)", "Color Palette Focus"]
    },
    "ux": {
        "file": "ux-guidelines.csv",
        "search_cols": ["Category", "Issue", "Description", "Platform"],
        "output_cols": ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity"]
    },
    "typography": {
        "file": "typography.csv",
        "search_cols": ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For", "Heading Font", "Body Font"],
        "output_cols": ["Font Pairing Name", "Category", "Heading Font", "Body Font", "Mood/Style Keywords", "Best For", "Google Fonts URL", "CSS Import", "Tailwind Config", "Notes"]
    },
    "motion": {
        "file": "motion.csv",
        "search_cols": ["Motion Name", "Keywords", "Style Mood", "Best For"],
        "output_cols": ["Motion Name", "Keywords", "Style Mood", "Core Techniques", "Libraries", "Tokens", "Intensity", "Best For", "Reduced-Motion Treatment", "Accessibility Notes", "Source"]
    },
    "icons": {
        "file": "icons.csv",
        "search_cols": ["Category", "Icon Name", "Keywords", "Best For"],
        "output_cols": ["Category", "Icon Name", "Keywords", "Library", "Import Code", "Usage", "Best For", "Style"]
    },
    "react": {
        "file": "react-performance.csv",
        "search_cols": ["Category", "Issue", "Keywords", "Description"],
        "output_cols": ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity"]
    },
    "web": {
        "file": "app-interface.csv",
        "search_cols": ["Category", "Issue", "Keywords", "Description"],
        "output_cols": ["Category", "Issue", "Platform", "Description", "Do", "Don't", "Code Example Good", "Code Example Bad", "Severity"]
    },
    "google-fonts": {
        "file": "google-fonts.csv",
        "search_cols": ["Family", "Category", "Stroke", "Classifications", "Keywords", "Subsets", "Designers"],
        "output_cols": ["Family", "Category", "Stroke", "Classifications", "Styles", "Variable Axes", "Subsets", "Designers", "Popularity Rank", "Google Fonts URL"]
    },
    "reasoning": {
        "file": "ui-reasoning.csv",
        "search_cols": ["UI_Category", "Style_Priority", "Color_Mood", "Anti_Patterns"],
        "output_cols": ["UI_Category", "Recommended_Pattern", "Style_Priority", "Color_Mood", "Typography_Mood", "Key_Effects", "Decision_Rules", "Anti_Patterns", "Severity"]
    },
    "design": {
        "file": "design.csv",
        "parser": "design_blocks",
        "search_cols": ["style_name", "content"],
        "output_cols": ["style_name", "content"]
    },
    "database": {
        "file": "databases.csv",
        "search_cols": ["Database", "Type", "Best For", "Tradeoffs", "ORM Pairs", "Default For"],
        "output_cols": ["Database", "Type", "Best For", "Tradeoffs", "ORM Pairs", "Default For"]
    },
    "auth": {
        "file": "auth-providers.csv",
        "search_cols": ["Provider", "Type", "Features", "Best For", "Default For"],
        "output_cols": ["Provider", "Type", "Features", "Pricing Model", "Integration Complexity", "Best For", "Default For", "MFA", "SSO", "Hosted UI", "Open Source"]
    },
    "payments": {
        "file": "payment-providers.csv",
        "search_cols": ["Provider", "Type", "Features", "Best For", "Default For"],
        "output_cols": ["Provider", "Type", "Features", "Pricing", "Integration Complexity", "Best For", "Default For", "Subscription Support", "International Support"]
    },
    "backend": {
        "file": "backend-stacks.csv",
        "search_cols": ["Stack", "Language", "Runtime", "Best For", "Tradeoffs", "Default For"],
        "output_cols": ["Stack", "Language", "Runtime", "Best For", "Tradeoffs", "Default For"]
    },
    "deployment": {
        "file": "deployment-targets.csv",
        "search_cols": ["Target", "Type", "Best For", "Tradeoffs", "Default For"],
        "output_cols": ["Target", "Type", "Best For", "Tradeoffs", "Cost Model", "Default For"]
    }
}

STACK_CONFIG = {
    "react":            {"file": "stacks/react.csv"},
    "nextjs":           {"file": "stacks/nextjs.csv"},
    "vue":              {"file": "stacks/vue.csv"},
    "svelte":           {"file": "stacks/svelte.csv"},
    "astro":            {"file": "stacks/astro.csv"},
    "swiftui":          {"file": "stacks/swiftui.csv"},
    "react-native":     {"file": "stacks/react-native.csv"},
    "flutter":          {"file": "stacks/flutter.csv"},
    "nuxtjs":           {"file": "stacks/nuxtjs.csv"},
    "nuxt-ui":          {"file": "stacks/nuxt-ui.csv"},
    "html-tailwind":    {"file": "stacks/html-tailwind.csv"},
    "shadcn":           {"file": "stacks/shadcn.csv"},
    "jetpack-compose":  {"file": "stacks/jetpack-compose.csv"},
    "threejs":          {"file": "stacks/threejs.csv"},
    "angular":          {"file": "stacks/angular.csv"},
    "laravel":          {"file": "stacks/laravel.csv"},
}

# Common columns for all stacks
_STACK_COLS = {
    "search_cols": ["Category", "Guideline", "Description", "Do", "Don't"],
    "output_cols": ["Category", "Guideline", "Description", "Do", "Don't", "Code Good", "Code Bad", "Severity", "Docs URL"]
}

AVAILABLE_STACKS = list(STACK_CONFIG.keys())


# ============ BM25 IMPLEMENTATION ============
class BM25:
    """BM25 ranking algorithm for text search"""

    def __init__(self, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus = []
        self.doc_lengths = []
        self.avgdl = 0
        self.idf = {}
        self.doc_freqs = defaultdict(int)
        self.N = 0

    def tokenize(self, text):
        """Lowercase, split, remove punctuation, filter single chars"""
        text = re.sub(r'[^\w\s]', ' ', str(text).lower())
        return [w for w in text.split() if len(w) >= 2]

    def fit(self, documents):
        """Build BM25 index from documents"""
        self.corpus = [self.tokenize(doc) for doc in documents]
        self.N = len(self.corpus)
        if self.N == 0:
            return
        self.doc_lengths = [len(doc) for doc in self.corpus]
        self.avgdl = sum(self.doc_lengths) / self.N

        for doc in self.corpus:
            seen = set()
            for word in doc:
                if word not in seen:
                    self.doc_freqs[word] += 1
                    seen.add(word)

        for word, freq in self.doc_freqs.items():
            self.idf[word] = log((self.N - freq + 0.5) / (freq + 0.5) + 1)

    def score(self, query):
        """Score all documents against query"""
        query_tokens = self.tokenize(query)
        scores = []

        for idx, doc in enumerate(self.corpus):
            score = 0
            doc_len = self.doc_lengths[idx]
            term_freqs = defaultdict(int)
            for word in doc:
                term_freqs[word] += 1

            for token in query_tokens:
                if token in self.idf:
                    tf = term_freqs[token]
                    idf = self.idf[token]
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self.avgdl)
                    score += idf * numerator / denominator

            scores.append((idx, score))

        return sorted(scores, key=lambda x: x[1], reverse=True)


# ============ DESIGN.CSV PARSER ============
def _load_design_blocks(filepath):
    """Parse design.csv freeform text blocks into searchable entries.
    Format: Chinese style headers (Name（Chinese）) delimit blocks.
    Each block has: Chinese header, Chinese description, Chinese use cases,
    then English design system content (tokens, components, motion, etc).
    Returns list of dicts with 'style_name' and 'content' keys."""
    if not filepath.exists():
        return []
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    import re
    lines = text.split('\n')

    # Find style boundary lines: "EnglishName（ChineseName）"
    # Must contain CJK chars inside parens AND be short (header, not content)
    def has_cjk(s):
        return any('\u4e00' <= c <= '\u9fff' for c in s)
    style_boundaries = []
    for i, line in enumerate(lines):
        stripped = line.strip().strip('"')
        if len(stripped) < 60 and has_cjk(stripped) and re.match(r'^[A-Za-z]', stripped):
            # Require parens with CJK inside
            m = re.search(r'[（(]([^）)]+)[）)]', stripped)
            if m and has_cjk(m.group(1)):
                style_boundaries.append(i)

    blocks = []
    for idx, start_line in enumerate(style_boundaries):
        end_line = style_boundaries[idx + 1] if idx + 1 < len(style_boundaries) else len(lines)
        block_lines = lines[start_line:end_line]

        # First line is the style header
        header = block_lines[0].strip().strip('"')
        clean_name = re.sub(r'[（(].*?[）)]', '', header).strip()

        # Separate Chinese metadata from English content
        chinese_lines = []
        english_lines = []
        in_english = False

        for line in block_lines[1:]:
            stripped = line.strip()
            if not stripped:
                if in_english:
                    english_lines.append('')
                continue

            # Detect transition from Chinese to English content
            # English content starts with lines like "Design Style:", "Design Philosophy",
            # "Core Principles:", "System Prompt:", or lines with mostly ASCII
            if not in_english:
                ascii_chars = sum(1 for c in stripped if ord(c) < 128)
                total_chars = len(stripped)
                if total_chars > 0 and ascii_chars / total_chars > 0.7:
                    # Check for known English design headers
                    if any(stripped.startswith(kw) for kw in
                        ['Design Style', 'Design Philosophy', 'Core Principle',
                         'Core Principles', 'System Prompt', 'Vibe:',
                         'The DNA of', 'Design Token', 'Colors', 'Typography',
                         'Component Stylings', 'Animation', 'Non-Generic',
                         'Iconography', 'Accessibility', 'Anti-Pattern',
                         'Implementation', 'Layout']):
                        in_english = True

            if in_english:
                english_lines.append(line)
            else:
                chinese_lines.append(stripped)

        # Build content from Chinese metadata + English design system
        description = chinese_lines[0] if chinese_lines else ""
        use_cases = " ".join(l for l in chinese_lines[1:] if l)
        english_content = '\n'.join(english_lines).strip()

        # If no English content found, use all non-header content
        if not english_content:
            english_content = '\n'.join(l for l in block_lines[1:] if l.strip())

        full_content = english_content if english_content else f"{description}\n{use_cases}"

        blocks.append({
            "style_name": clean_name,
            "original_name": header,
            "description": description,
            "use_cases": use_cases,
            "content": full_content
        })

    return blocks


# ============ SEARCH FUNCTIONS ============
def _load_csv(filepath):
    """Load CSV and return list of dicts"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def _search_csv(filepath, search_cols, output_cols, query, max_results, bias=None):
    """Core search function using BM25."""
    bias = bias or {}
    if not filepath.exists():
        return []

    data = _load_csv(filepath)

    # Build documents from search columns
    documents = [" ".join(str(row.get(col, "")) for col in search_cols) for row in data]

    # BM25 search
    bm25 = BM25()
    bm25.fit(documents)
    ranked = bm25.score(query)

    # Taste-memory re-rank: add learned term weights to matching rows.
    if bias:
        boosted = []
        for idx, score in ranked:
            doc_terms = set(bm25.corpus[idx])
            hit_weight = sum(w for term, w in bias.items() if term in doc_terms)
            boosted.append((idx, score + hit_weight))
        boosted.sort(key=lambda x: x[1], reverse=True)
        ranked = boosted

    # Get top results with score > 0
    results = []
    for idx, score in ranked[:max_results]:
        if score > 0:
            row = data[idx]
            results.append({col: row.get(col, "") for col in output_cols if col in row})

    return results


def _search_design_blocks(filepath, query, max_results, bias=None):
    """Search design.csv blocks using BM25 on style name + content."""
    bias = bias or {}
    blocks = _load_design_blocks(filepath)
    if not blocks:
        return []

    # Build documents from style_name + content
    documents = [f"{b['style_name']} {b.get('description', '')} {b.get('use_cases', '')} {b['content'][:500]}" for b in blocks]

    bm25 = BM25()
    bm25.fit(documents)
    ranked = bm25.score(query)

    if bias:
        boosted = []
        for idx, score in ranked:
            doc_terms = set(bm25.corpus[idx])
            hit_weight = sum(w for term, w in bias.items() if term in doc_terms)
            boosted.append((idx, score + hit_weight))
        boosted.sort(key=lambda x: x[1], reverse=True)
        ranked = boosted

    results = []
    for idx, score in ranked[:max_results]:
        if score > 0:
            block = blocks[idx]
            # Truncate content for output (full content available via --full flag)
            content = block['content']
            if len(content) > 2000:
                content = content[:2000] + "\n... [truncated, full content in design.csv]"
            results.append({
                "Style": block['original_name'],
                "Description": block.get('description', ''),
                "Use Cases": block.get('use_cases', ''),
                "Design System": content
            })

    return results


def detect_domain(query):
    """Auto-detect the most relevant domain from query"""
    query_lower = query.lower()

    domain_keywords = {
        "color": ["color", "palette", "hex", "#", "rgb", "token", "semantic", "accent", "destructive", "muted", "foreground"],
        "chart": ["chart", "graph", "visualization", "trend", "bar", "pie", "scatter", "heatmap", "funnel"],
        "landing": ["landing", "page", "cta", "conversion", "hero", "testimonial", "pricing", "section"],
        "product": ["saas", "ecommerce", "e-commerce", "fintech", "healthcare", "gaming", "portfolio", "crypto", "dashboard", "fitness", "restaurant", "hotel", "travel", "music", "education", "learning", "legal", "insurance", "medical", "beauty", "pharmacy", "dental", "pet", "dating", "wedding", "recipe", "delivery", "ride", "booking", "calendar", "timer", "tracker", "diary", "note", "chat", "messenger", "crm", "invoice", "parking", "transit", "vpn", "alarm", "weather", "sleep", "meditation", "fasting", "habit", "grocery", "meme", "wardrobe", "plant care", "reading", "flashcard", "puzzle", "trivia", "arcade", "photography", "streaming", "podcast", "newsletter", "marketplace", "freelancer", "coworking", "airline", "museum", "theater", "church", "non-profit", "charity", "kindergarten", "daycare", "senior care", "veterinary", "florist", "bakery", "brewery", "construction", "automotive", "real estate", "logistics", "agriculture", "coding bootcamp"],
        "style": ["style", "ui", "minimalism", "glassmorphism", "neumorphism", "brutalism", "dark mode", "flat", "aurora", "prompt", "css", "implementation", "variable", "checklist", "tailwind"],
        "design": ["design system", "design philosophy", "design token", "design language", "bauhaus", "monochrome", "terminal", "kinetic", "material design", "neo brutalism", "bold typography", "academia", "cyberpunk", "web3", "claymorphism", "enterprise", "sketch", "neumorphism mobile", "cinema", "saas mobile", "bitcoin", "hand-drawn", "design style", "component styling", "design dna"],
        "ux": ["ux", "usability", "accessibility", "wcag", "touch", "scroll", "animation", "keyboard", "navigation", "mobile"],
        "typography": ["font pairing", "typography pairing", "heading font", "body font"],
        "google-fonts": ["google font", "font family", "font weight", "font style", "variable font", "noto", "font for", "find font", "font subset", "font language", "monospace font", "serif font", "sans serif font", "display font", "handwriting font", "font", "typography", "serif", "sans"],
        "icons": ["icon", "icons", "lucide", "heroicons", "symbol", "glyph", "pictogram", "svg icon"],
        "react": ["react", "next.js", "nextjs", "suspense", "memo", "usecallback", "useeffect", "rerender", "bundle", "waterfall", "barrel", "dynamic import", "rsc", "server component"],
        "web": ["aria", "focus", "outline", "semantic", "virtualize", "autocomplete", "form", "input type", "preconnect"],
        "reasoning": ["anti-pattern", "anti-patterns", "avoid", "forbidden", "banned", "don't use", "never use", "reasoning", "decision rules", "mood"]
    }

    scores = {domain: sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', query_lower)) for domain, keywords in domain_keywords.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "style"


def search(query, domain=None, max_results=MAX_RESULTS, bias=None):
    """Main search function with auto-domain detection.

    bias: optional dict {term: weight} from taste memory, re-ranks results.
    """
    if domain is None:
        domain = detect_domain(query)

    config = CSV_CONFIG.get(domain, CSV_CONFIG["style"])
    filepath = DATA_DIR / config["file"]

    if not filepath.exists():
        return {"error": f"File not found: {filepath}", "domain": domain}

    # Design blocks use custom parser
    if config.get("parser") == "design_blocks":
        results = _search_design_blocks(filepath, query, max_results, bias)
    else:
        results = _search_csv(filepath, config["search_cols"], config["output_cols"], query, max_results, bias)

    return {
        "domain": domain,
        "query": query,
        "file": config["file"],
        "count": len(results),
        "results": results
    }


def search_stack(query, stack, max_results=MAX_RESULTS, bias=None):
    """Search stack-specific guidelines"""
    if stack not in STACK_CONFIG:
        return {"error": f"Unknown stack: {stack}. Available: {', '.join(AVAILABLE_STACKS)}"}

    filepath = DATA_DIR / STACK_CONFIG[stack]["file"]

    if not filepath.exists():
        return {"error": f"Stack file not found: {filepath}", "stack": stack}

    results = _search_csv(filepath, _STACK_COLS["search_cols"], _STACK_COLS["output_cols"], query, max_results, bias)

    return {
        "domain": "stack",
        "stack": stack,
        "query": query,
        "file": STACK_CONFIG[stack]["file"],
        "count": len(results),
        "results": results
    }
