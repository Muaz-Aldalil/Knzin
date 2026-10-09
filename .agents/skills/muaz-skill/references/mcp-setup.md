# MCP Setup — Design Intelligence

How to configure MCPs for muaz-skill. MCPs are optional enhancements — the skill works without them, but design quality improves significantly with Mobbin.

---

## Where to Add MCPs

### Global (all projects)

Edit `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "mobbin": {
      "type": "sse",
      "url": "https://api.mobbin.com/mcp"
    }
  }
}
```

### Project-level (single project)

Create `.opencode/config.json` in project root:

```json
{
  "mcp": {
    "mobbin": {
      "type": "sse",
      "url": "https://api.mobbin.com/mcp"
    }
  }
}
```

---

## Available MCPs

### Mobbin (Highest Impact)

**What it does**: 600k+ real app screens from 1600+ shipped products. Search by pattern type (pricing, onboarding, dashboard, etc.) and get real examples with annotations.

**Setup**:
1. Add to opencode.json:
```json
"mobbin": {
  "type": "sse",
  "url": "https://api.mobbin.com/mcp"
}
```
2. Restart OpenCode
3. Authenticate via OAuth when prompted
4. Verify: ask agent "search Mobbin for pricing page examples"

**Pricing**: Free tier (limited searches) / Pro ($19/mo) / Team ($49/mo)

**When to use**: Before Phase 3 — agent MUST search real screens before designing (Hard Rule 17)

**Agent workflow**:
```
1. Search Mobbin for "[pattern]" (e.g., "SaaS pricing page")
2. Get 3-5 real examples from shipped products
3. Analyze patterns: layout structure, component choices, whitespace strategy
4. Cite specific examples in blueprint DESIGN EVIDENCE field
5. Design from those patterns, not from training data
```

### Figma

**What it does**: Read/write Figma files directly. Extract colors, typography, layout, components from existing designs.

**Setup**:
1. Add to opencode.json:
```json
"figma": {
  "type": "sse",
  "url": "https://mcp.figma.com/mcp"
}
```
2. Restart OpenCode
3. Authenticate via OAuth when prompted
4. Verify: ask agent "extract design DNA from this Figma link: [url]"

**When to use**: Only when user provides a Figma file link. Not needed for designs created from scratch.

**Agent workflow**:
```
1. User provides Figma link
2. Extract design DNA: colors, typography, layout, components
3. Cross-reference with search engine results
4. Merge: Figma aesthetic + product-appropriate structure
```

### Higgsfield (Optional)

**What it does**: AI image/video generation with 30+ models (Flux, SDXL, etc.). Generate custom visuals for projects.

**Setup**:
1. Add to opencode.json:
```json
"higgsfield": {
  "type": "sse",
  "url": "https://mcp.higgsfield.ai/mcp"
}
```
2. Restart OpenCode
3. Authenticate via OAuth when prompted
4. Verify: ask agent "generate a hero image for a SaaS landing page"

**Pricing**: Paid credits per generation (varies by model)

**When to use**: When project needs custom hero images, illustrations, or product shots. Not required for most projects.

---

## Full Example Config

```json
{
  "mcp": {
    "mobbin": {
      "type": "sse",
      "url": "https://api.mobbin.com/mcp"
    },
    "figma": {
      "type": "sse",
      "url": "https://mcp.figma.com/mcp"
    },
    "higgsfield": {
      "type": "sse",
      "url": "https://mcp.higgsfield.ai/mcp"
    }
  }
}
```

---

## Verification

After adding MCPs, restart OpenCode and verify:

1. **Mobbin**: "Search Mobbin for onboarding flow examples" — should return real screens
2. **Figma**: "Extract design DNA from [figma link]" — should return color/typography/layout data
3. **Higgsfield**: "Generate a hero image for a dark-themed SaaS" — should return image

If verification fails:
- Check MCP URL is correct
- Check OAuth authentication completed
- Check internet connection
- Restart OpenCode

---

## Windows Notes

- `anti-slop.sh` requires bash. On Windows, use git bash: `& "C:\Program Files\Git\bin\bash.exe" scripts/anti-slop.sh .`
- WSL also works if configured: `wsl -- bash scripts/anti-slop.sh .`

---

## How MCPs Interact with the Skill

MCPs are **not dependencies** — the skill works without them. But when available:

| MCP | Phase | What It Enables |
|---|---|---|
| Mobbin | Phase 2-3 | Search real screens → cite in blueprint field 13 |
| Figma | Phase 2-3 | Extract design DNA → merge with search engine |
| Higgsfield | Phase 4-5 | Generate custom images → no stock photos |

The skill's CSV data (styles, colors, fonts, compositions) provides the foundation. MCPs add real-world evidence on top.

---

## Priority Order

1. **Mobbin** — highest impact, solves generic design problem directly
2. **Figma** — only needed when user has Figma file
3. **Higgsfield** — optional, adds cost per generation
