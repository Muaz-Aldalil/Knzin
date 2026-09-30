# Frontend UI Component Contracts: Feature 004

**Feature**: Front-of-House Trust, Engagement & Social Proof Suite  
**Branch**: `004-front-of-house-trust-engagement`  
**Status**: Ready  
**Date**: 2026-09-30  

---

## 1. Component Interface Matrix

| Component | File Path | Scope | Primary Props | Key State / Behaviors |
| :--- | :--- | :--- | :--- | :--- |
| **TheHookSection** | `frontend/src/components/home/TheHookSection.tsx` | Homepage | None | Verbatim founder quote, responsive typography, `#vision` anchor with `scroll-mt-20 sm:scroll-mt-24` |
| **HowItWorksModal** | `frontend/src/components/layout/HowItWorksModal.tsx` | Global Header HUD | `open: boolean`, `onOpenChange: (open: boolean) => void` | Focus trap, Escape dismissal, returns focus to trigger, renders 3 canonical steps |
| **ActivityTicker** | `frontend/src/components/layout/ActivityTicker.tsx` | Global Layout | None | Polls `GET /api/v1/activity/recent` every 30–60s, pauses on hover/focus, respects `prefers-reduced-motion`, `<bdi>` isolation |
| **FloatingWhatsAppButton** | `frontend/src/components/layout/FloatingWhatsAppButton.tsx` | Global Layout | None | Anchored `bottom-6 end-6`, reads `NEXT_PUBLIC_WHATSAPP_SUPPORT_URL`, opens fallback dialog when unconfigured |
| **WhatsAppFallbackDialog** | `frontend/src/components/layout/WhatsAppFallbackDialog.tsx` | Global Layout | `open: boolean`, `onOpenChange: (open: boolean) => void` | Offline notice, points to `#faq`, zero invented contact info |
| **FaqAccordion** | `frontend/src/components/faq/FaqAccordion.tsx` | Homepage & Views | None | 5 categories, first item in each category expanded by default, WAI-ARIA keyboard navigation, `#faq` anchor |
| **WinnerKycCard** | `frontend/src/components/compliance/WinnerKycCard.tsx` | `/raffle` & FAQ | `variant?: 'standalone' \| 'embedded'` | Verbatim National ID legal claim disclaimer, zero file upload forms |

---

## 2. Component Specifications

### 2.1 `TheHookSection.tsx`
- **Location**: Homepage between `HeroGrandPrizeCountdown` (and `ResumeHeroCard`) and the Course Grid (`CatalogClientView.tsx`).
- **Semantic HTML**: `<section id="vision" aria-labelledby="vision-heading" className="scroll-mt-20 sm:scroll-mt-24">`.
- **Text Invariant**:
  - Arabic: *«نحن نؤمن بأن الشباب يحتاجون إلى المهارة ورأس المال معاً. لذلك، نحن نعلمك مهارات العمل الحر، ونمنحك فرصة لربح تمويل مشروعك في نفس الوقت.»*
  - English: *«We believe youth need both skill and capital together. Therefore, we teach you freelance skills, while giving you the chance to win funding for your project at the same time.»*
- **Visual Design**: Glassmorphic dark card with subtle primary gradient glow, Tajawal typography, responsive line heights.

---

### 2.2 `HowItWorksModal.tsx`
- **Trigger Points**:
  1. Desktop: Header HUD button `«كيف تعمل كَنزين؟»` / `«How It Works»` (1 click).
  2. Mobile Header HUD: Compact shortcut button (`HelpCircle` icon, 1 click).
  3. Mobile Sheet Drawer: Dedicated item inside `MobileNavSheet.tsx` (2 clicks).
- **Dialog Composition**:
  - Root: `Dialog` from `@/components/ui/dialog`
  - Content: `DialogContent` with `aria-labelledby="how-it-works-title"`.
  - Close: Built-in `DialogPrimitive.Close` with `X` icon and `Escape` key handling.
- **RTL/LTR Directionality**:
  - Steps flow right-to-left in Arabic and left-to-right in English with matching directional chevron arrows.

---

### 2.3 `ActivityTicker.tsx`
- **Container**: `h-10 w-full bg-surface-secondary/80 border-b border-border-subtle overflow-hidden relative flex items-center`.
- **Marquee Engine**: Pure CSS marquee (`animate-marquee` / `animate-marquee-rtl`) using Tailwind CSS logical transforms.
- **Micro-Interactions**:
  - `onMouseEnter` / `onFocus`: Adds `[animation-play-state:paused]` to immediately freeze scrolling.
  - `onMouseLeave` / `onBlur`: Resumes marquee animation.
- **Bidirectional Safety**: Every text snippet is wrapped in `<bdi>` to prevent number/currency flipping in mixed Arabic/English contexts.
- **Reduced Motion**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .ticker-track {
      animation: none;
      overflow-x: auto;
    }
  }
  ```

---

### 2.4 `FloatingWhatsAppButton.tsx`
- **Fixed Coordinates**: `fixed bottom-6 end-6 z-40`.
- **Directional Mirroring**:
  - Arabic (`dir="rtl"`): Floats at bottom-left (`left: 1.5rem`).
  - English (`dir="ltr"`): Floats at bottom-right (`right: 1.5rem`).
- **Touch Target**: `w-14 h-14` (56x56px), with accessible label `aria-label="تواصل عبر واتساب"`.
- **Environment Handling**:
  ```typescript
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL;
  if (!whatsappUrl || whatsappUrl.trim() === '') {
    // Open in-app fallback dialog
    setIsFallbackOpen(true);
  } else {
    // Navigate securely
    window.open(buildWhatsAppUrl(whatsappUrl, locale), '_blank', 'noopener,noreferrer');
  }
  ```

---

### 2.5 `FaqAccordion.tsx`
- **Container**: `<section id="faq" aria-labelledby="faq-heading" className="scroll-mt-20 sm:scroll-mt-24 space-y-6">`.
- **Primitive**: Built on `@/components/ui/accordion`.
- **Expansion State**: `type="multiple"` with `defaultValue` including the first item of all 5 categories (`['faq-model-1', 'faq-downloads-1', 'faq-draws-1', 'faq-referral-1', 'faq-kyc-1']`).
- **Keyboard Navigation**:
  - `Tab`: Moves between accordion triggers.
  - `Enter` or `Space`: Expands or collapses active item.
  - `ArrowUp` / `ArrowDown`: Moves focus to previous / next trigger.

---

### 2.6 `WinnerKycCard.tsx`
- **Props**:
  ```typescript
  interface WinnerKycCardProps {
    variant?: 'standalone' | 'embedded';
  }
  ```
- **Placements**:
  1. Standalone card on `/raffle` between the Legal Shield and the Draws FAQ.
  2. Embedded compliance highlight inside `FaqAccordion.tsx` under category `kyc`.
- **Strict Boundary**: Purely informational text and badges. No input fields, file pickers, or submission buttons.
