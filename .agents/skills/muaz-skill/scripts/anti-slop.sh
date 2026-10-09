#!/usr/bin/env bash
# anti-slop.sh — Deterministic AI-slop detection for frontend code (29 checks)
# Usage: bash scripts/anti-slop.sh <directory>
# Exit code: 0 = clean, 1 = violations found

set -uo pipefail

TARGET="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/anti_slop.py"

# --- 1. Preferred: Delegate to Python script for 100% parity ---
if command -v python &>/dev/null && [ -f "$PYTHON_SCRIPT" ]; then
  exec python "$PYTHON_SCRIPT" "$TARGET" --fail-on MEDIUM
elif command -v python3 &>/dev/null && [ -f "$PYTHON_SCRIPT" ]; then
  exec python3 "$PYTHON_SCRIPT" "$TARGET" --fail-on MEDIUM
fi

# --- 2. Fallback: Direct ripgrep (rg) with multiline enabled ---
if ! command -v rg &>/dev/null; then
  echo "ERROR: Neither python nor ripgrep (rg) was found on PATH." >&2
  exit 2
fi

VIOLATIONS=0
FAILS=""

rg_check() {
  local label="$1"
  shift
  local hits
  hits=$(rg -n --no-heading "$@" "$TARGET" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    VIOLATIONS=$((VIOLATIONS + 1))
    FAILS="$FAILS
FAIL [$label]:
$hits
"
  fi
}

ALL_FILES='*.{css,scss,tsx,jsx,ts,js,html}'
CSS_FILES='*.{css,scss}'
COPY_FILES='*.{tsx,jsx,ts,js,html}'
JSX_FILES='*.{tsx,jsx,html}'

# --- CRITICAL CHECKS ---
# 1. PURPLE_GRADIENT
rg_check "PURPLE_GRADIENT" -g "$ALL_FILES" -i \
  -e 'linear-gradient.*#(7c3aed|8b5cf6|a78bfa|6d28d9|5b21b6|4c1d95|9333ea)' \
  -e 'linear-gradient.*(purple|violet)'

# --- HIGH CHECKS ---
# 2. AI_BRAND_GRADIENT
rg_check "AI_BRAND_GRADIENT" -g "$ALL_FILES" -i \
  -e 'linear-gradient[^;]*#(6366f1|818cf8|a5b4fc|8b5cf6|a855f7|ec4899|f472b6)' \
  -e 'linear-gradient[^;]*\b(indigo|violet|purple)\b[^;]*\b(purple|violet|pink|fuchsia)\b' \
  -e '\bfrom-(indigo|violet|purple)-[45]00\b.*\bto-(purple|violet|pink|fuchsia)-[45]00\b'

# 3. INTER_SOLE_FONT
rg_check "INTER_SOLE_FONT" -g "$CSS_FILES" -i -e "font-family.*Inter[\"']?\s*[;,]"

# 4. INTER_TAILWIND
rg_check "INTER_TAILWIND" -g "$ALL_FILES" -i -e 'font-inter' -e 'fontFamily.*Inter'

# 5. TAILWIND_DEFAULT_BLUE
rg_check "TAILWIND_DEFAULT_BLUE" -g "$ALL_FILES" -i \
  -e '\b(bg|text|border|ring|from|to|via)-(blue-[456]00)\b' \
  -e '#(?:3b82f6|2563eb|1d4ed8|60a5fa)\b'

# 6. TAILWIND_DEFAULT_PURPLE
rg_check "TAILWIND_DEFAULT_PURPLE" -g "$ALL_FILES" -i \
  -e '\b(bg|text|border|ring|from|to|via)-(purple-[456]00)\b'

# 7. PURE_BLACK_BG
rg_check "PURE_BLACK_BG" -g "$CSS_FILES" -i \
  -e 'background(-color)?:\s*(#000000|#000\b|black)'

# 8. PURE_BLACK_TAILWIND
rg_check "PURE_BLACK_TAILWIND" -g "$ALL_FILES" -e 'bg-black(?![0-9])'

# 9. GRADIENT_TEXT
rg_check "GRADIENT_TEXT" -g "$ALL_FILES" -i \
  -e 'background.*-clip:\s*text' -e 'text-transparent.*bg-clip'

# 10. SCROLL_LISTENER
rg_check "SCROLL_LISTENER" -g "$ALL_FILES" -i \
  -e 'window\.addEventListener\(\s*["\x27]scroll["\x27]' \
  -e 'document\.addEventListener\(\s*["\x27]scroll["\x27]' \
  -e '\bonscroll\s*='

# 11. TRANSITION_ALL
rg_check "TRANSITION_ALL" -g "$ALL_FILES" -i \
  -e 'transition:\s*all\b' -e '\btransition-all\b'

# 12. TRANSITION_LAYOUT_PROP
rg_check "TRANSITION_LAYOUT_PROP" -g "$ALL_FILES" -i \
  -e 'transition:\s*[^;]*\b(width|height|top|left|right|bottom|margin|padding)\b' \
  -e '\btransition-\[(width|height|top|left|right|bottom|margin|padding)\]' \
  -e '@keyframes\s+[\w-]+\s*\{[^}]*\b(width|height|top|left|right|bottom)\s*:'

# 13. KEYFRAME_LAYOUT_PROP (multiline search)
rg_check "KEYFRAME_LAYOUT_PROP" -U -g "$CSS_FILES" -i \
  -e '@keyframes\s+[\w-]+\s*\{[^}]*?\b(width|height|top|left|right|bottom)\s*:'

# --- MEDIUM CHECKS ---
# 14. AI_BUZZWORDS
rg_check "AI_BUZZWORDS" -g "$ALL_FILES" -i \
  -e 'seamless(ly)?' -e '\bleverage[d]?\b' -e '\bcutting[- ]edge\b' \
  -e '\bgame[- ]chang(ing|er)?\b' -e 'revolutioniz(ing|ation|ed)?' \
  -e '\bparadigm[- ]shift\b' -e '\bempower(ing|ment)?\b' -e '\bharness(ing)?\b' \
  -e '\bunlock\b' -e '\bsupercharge(d)?\b' -e '\belevate(d)?\b' \
  -e '\bunleash(ed)?\b' -e '\bdelve\b' -e '\beffortless(ly)?\b' \
  -e '\bstreamline(d)?\b' -e '\bstate[- ]of[- ]the[- ]art\b' \
  -e '\bbest[- ]in[- ]class\b' -e '\bworld[- ]class\b' -e '\bnext[- ]gen\b' \
  -e '\bholistic\b' -e '\bsynerg(y|ies)\b' -e '\bdisrupt(ive|or)?\b' -e '\bdive\s+into\b'

# 15. GLASS_BLUR
rg_check "GLASS_BLUR" -g "$ALL_FILES" -i -e 'backdrop-blur' -e 'backdrop-filter.*blur'

# 16. EQUAL_3_COL
rg_check "EQUAL_3_COL" -g "$ALL_FILES" \
  -e 'grid-cols-3(?!.*minmax)' -e 'repeat\(\s*3(?![^)]*minmax)' -e ':\s*1fr\s+1fr\s+1fr\s*;'

# 17. EM_DASH
rg_check "EM_DASH" -g '*.tsx' -e '—' -e '&#8212;'

# 18. WELCOME_HERO
rg_check "WELCOME_HERO" -g '*.tsx' -i -e 'Welcome\s+to'

# 19. PLACEHOLDER_COPY
rg_check "PLACEHOLDER_COPY" -g "$COPY_FILES" -i \
  -e 'lorem\s+ipsum' -e '\bJohn Doe\b|\bJane Doe\b' -e '\bAcme\s+(Corp|Corporation|Inc)?\b' \
  -e '\byour[- ](name|username|email|password|company)\b' -e 'via\.placeholder\.(com|net)' \
  -e 'i\.pravatar\.cc' -e '(?:randomuser\.me|picsum\.photos|placeholder\.com)' \
  -e '\bexample\.(com|org|net)\b' -e '\byour_email\b'

# 20. HOVER_ONLY_REVEAL
rg_check "HOVER_ONLY_REVEAL" -g "$ALL_FILES" \
  -e '(opacity-0|hidden|invisible)\s+(group-hover|peer-hover)' \
  -e '\b(hidden|invisible)\s+group-hover:' \
  -e 'group-hover:\s*(opacity-100|block|flex|visible)\b'

# 21. SECTION_EYEBROW_NUMBER
rg_check "SECTION_EYEBROW_NUMBER" -g "$JSX_FILES" \
  -e '(?<![0-9A-Za-z])0[0-9]\s*[/·.–—]\s*[A-Z]' -e '(?<![0-9A-Za-z])0[0-9]\s+\.\s+[A-Z]'

# 22. ITALIC_HEADING (multiline CSS search)
rg_check "ITALIC_HEADING" -U -g "$CSS_FILES" -i \
  -e '(h[1-6]|\.heading|\[class\*="heading"\])[^{]*?\{[^}]*?font-style:\s*italic'

# 23. HERO_CENTERED (multiline file match)
rg_check "HERO_CENTERED" -U -g "$JSX_FILES" \
  -e '(?s)\bmin-h-screen\b.*?\b(justify-center|items-center)\b.*?\btext-center\b'

# 24. SELECTED_STATE_BORDER_ONLY (deai-ledger T4)
rg_check "SELECTED_STATE_BORDER_ONLY" -g "$ALL_FILES" -e 'data-\[state=active\]:border-'

# 25. EYEBROW_CAPS_CRAMPED (deai-ledger T4)
rg_check "EYEBROW_CAPS_CRAMPED" -g "$ALL_FILES" \
  -e '(uppercase[^"\x27]{0,80}tracking-(wider|widest)|tracking-(wider|widest)[^"\x27]{0,80}uppercase)'

# 26. RANDOM_STATUS_PILL (deai-ledger T4)
rg_check "RANDOM_STATUS_PILL" -g "$JSX_FILES" \
  -e 'rounded-full[^>]{0,120}>\s*(●|•|\bLive\b|\bAvailable\b|\bBeta\b)'

# 27. GLOW_LIGHTS (deai-ledger T13)
rg_check "GLOW_LIGHTS" -g "$ALL_FILES" -i \
  -e 'blur-(2xl|3xl)' -e 'radial-gradient[^;]*(purple|violet|pink|indigo)' -e 'drop-shadow[^;"\x27]*(purple|violet|glow)'

# 28. EMOJI_AS_ICON (deai-ledger T14)
rg_check "EMOJI_AS_ICON" -g "$JSX_FILES" -e '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]'

# 29. THREE_TIER_PRICING (deai-ledger T17/T20)
rg_check "THREE_TIER_PRICING" -g "$COPY_FILES" -e '\b(Most Popular|Most popular|Best Value|RECOMMENDED)\b'

echo "=== MUAZ-V3 ANTI-SLOP CHECK ==="
echo "Target: $TARGET"
echo ""

if [ $VIOLATIONS -gt 0 ]; then
  echo "RESULT: $VIOLATIONS VIOLATION GROUPS FOUND"
  echo "$FAILS"
  echo "ACTION REQUIRED: Fix all violations before claiming done."
  exit 1
else
  echo "RESULT: CLEAN — all 29 checks passed."
  exit 0
fi
