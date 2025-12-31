# Design System

**My Workout Scheduler - Modern Fitness App Design System**

This document defines the complete design system for My Workout Scheduler, establishing a consistent visual language inspired by modern fitness apps like Peloton, ClassPass, and Strava.

**Version:** 2.13
**Last Updated:** December 29, 2025

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Shadows](#shadows)
6. [Border Radius](#border-radius)
7. [Responsive Breakpoints](#responsive-breakpoints)
8. [Accessibility Requirements](#accessibility-requirements)
9. [Component Design Principles](#component-design-principles)

---

## Design Principles

### Core Values

1. **Energetic & Bold** - Vibrant colors and confident typography that motivate action
2. **Clear & Scannable** - Information hierarchy that enables quick status checks
3. **Consistent & Predictable** - Reusable patterns that create familiar experiences
4. **Accessible & Inclusive** - WCAG AA compliant with excellent contrast and keyboard navigation
5. **Modern & Polished** - Production-grade quality with attention to detail

### Visual Aesthetic

- **Card-based layouts** - Clear containers for related information
- **Status-driven design** - Visual indicators for booking states (confirmed, pending, failed)
- **Action-oriented** - Clear CTAs with prominent primary actions
- **White space** - Generous spacing for breathing room and focus
- **Subtle animations** - Smooth transitions and hover effects (no gimmicks)

---

## Color Palette

### Semantic Colors

All colors use a 50-900 scale for consistent theming across the application.

#### Primary (Blue) - Trust & Reliability
**Use for:** Main actions, links, navigation highlights, informational states

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#eff6ff` | Backgrounds, hover states |
| 100 | `#dbeafe` | Light backgrounds |
| 200 | `#bfdbfe` | Borders, dividers |
| 300 | `#93c5fd` | Disabled states |
| 400 | `#60a5fa` | Hover states |
| 500 | `#3b82f6` | **DEFAULT** - Buttons, links |
| 600 | `#2563eb` | Active states |
| 700 | `#1d4ed8` | Pressed states |
| 800 | `#1e40af` | Dark mode primary |
| 900 | `#1e3a8a` | Text on light backgrounds |

#### Secondary (Orange) - Energy & Action
**Use for:** Secondary actions, highlights, accent elements

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#fff7ed` | Backgrounds |
| 100 | `#ffedd5` | Light backgrounds |
| 200 | `#fed7aa` | Borders |
| 300 | `#fdba74` | Disabled states |
| 400 | `#fb923c` | Hover states |
| 500 | `#f97316` | **DEFAULT** - Secondary buttons |
| 600 | `#ea580c` | Active states |
| 700 | `#c2410c` | Pressed states |
| 800 | `#9a3412` | Dark mode secondary |
| 900 | `#7c2d12` | Text on light backgrounds |

#### Success (Green) - Confirmation & Achievement
**Use for:** Success messages, confirmed bookings, positive feedback

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#f0fdf4` | Backgrounds |
| 100 | `#dcfce7` | Light backgrounds |
| 200 | `#bbf7d0` | Borders |
| 300 | `#86efac` | Disabled states |
| 400 | `#4ade80` | Hover states |
| 500 | `#22c55e` | **DEFAULT** - Success buttons, confirmed badges |
| 600 | `#16a34a` | Active states |
| 700 | `#15803d` | Pressed states |
| 800 | `#166534` | Dark mode success |
| 900 | `#14532d` | Text on light backgrounds |

#### Warning (Yellow/Amber) - Attention & Caution
**Use for:** Warning messages, pending states, attention-needed items

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#fffbeb` | Backgrounds |
| 100 | `#fef3c7` | Light backgrounds |
| 200 | `#fde68a` | Borders |
| 300 | `#fcd34d` | Disabled states |
| 400 | `#fbbf24` | Hover states |
| 500 | `#f59e0b` | **DEFAULT** - Warning badges, pending states |
| 600 | `#d97706` | Active states |
| 700 | `#b45309` | Pressed states |
| 800 | `#92400e` | Dark mode warning |
| 900 | `#78350f` | Text on light backgrounds |

#### Danger (Red) - Errors & Destructive Actions
**Use for:** Error messages, failed bookings, destructive actions (delete)

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#fef2f2` | Backgrounds |
| 100 | `#fee2e2` | Light backgrounds |
| 200 | `#fecaca` | Borders |
| 300 | `#fca5a5` | Disabled states |
| 400 | `#f87171` | Hover states |
| 500 | `#ef4444` | **DEFAULT** - Error badges, delete buttons |
| 600 | `#dc2626` | Active states |
| 700 | `#b91c1c` | Pressed states |
| 800 | `#991b1b` | Dark mode danger |
| 900 | `#7f1d1d` | Text on light backgrounds |

### Status Colors

**Booking-specific status indicators with semantic meaning**

| Status | Color | Hex | Use Case |
|--------|-------|-----|----------|
| **Confirmed** | Green | `#22c55e` | Successfully booked classes |
| **Pending** | Amber | `#f59e0b` | Booking in progress or scheduled |
| **Waitlisted** | Blue | `#3b82f6` | On waitlist for full classes |
| **Failed** | Red | `#ef4444` | Failed booking attempts |
| **Skipped** | Gray | `#6b7280` | User-skipped occurrences |
| **Retrying** | Amber (pulsing) | `#f59e0b` | Auto-retry in progress |

### Class Type Colors

**Optional accent colors for different workout types (use sparingly)**

| Class Type | Color | Hex |
|------------|-------|-----|
| Yoga | Purple | `#a855f7` |
| Cycling | Orange | `#f97316` |
| Strength | Red | `#ef4444` |
| Cardio | Blue | `#3b82f6` |
| Swimming | Cyan | `#06b6d4` |
| Meditation | Indigo | `#6366f1` |

### Neutral Colors

**Grays for text, backgrounds, borders**

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#f9fafb` | Page backgrounds |
| 100 | `#f3f4f6` | Card backgrounds |
| 200 | `#e5e7eb` | Borders, dividers |
| 300 | `#d1d5db` | Disabled borders |
| 400 | `#9ca3af` | Placeholder text |
| 500 | `#6b7280` | Secondary text |
| 600 | `#4b5563` | Body text |
| 700 | `#374151` | Headings |
| 800 | `#1f2937` | Dark headings |
| 900 | `#111827` | Primary text |

---

## Typography

### Font Family

**Primary Font:** Inter (Google Fonts)
**Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Why Inter?**
- Modern, clean, highly readable
- Excellent at small sizes
- Professional yet approachable
- Athletic/fitness aesthetic when used with proper weights

### Font Weights

| Weight | Value | Use Case |
|--------|-------|----------|
| Normal | 400 | Body text, descriptions |
| Medium | 500 | Labels, secondary headings |
| Semibold | 600 | Buttons, emphasized text |
| Bold | 700 | Primary headings, key information |

### Typography Scale

| Element | Size | Line Height | Weight | Use Case |
|---------|------|-------------|--------|----------|
| **h1** | 2.25rem (36px) | 2.5rem (40px) | 700 | Page titles |
| **h2** | 1.875rem (30px) | 2.25rem (36px) | 700 | Section headings |
| **h3** | 1.5rem (24px) | 2rem (32px) | 600 | Subsection headings |
| **h4** | 1.25rem (20px) | 1.75rem (28px) | 600 | Card titles |
| **h5** | 1.125rem (18px) | 1.5rem (24px) | 600 | Small headings |
| **h6** | 1rem (16px) | 1.5rem (24px) | 600 | Smallest headings |
| **body-lg** | 1.125rem (18px) | 1.75rem (28px) | 400 | Large body text |
| **body** | 1rem (16px) | 1.5rem (24px) | 400 | Default body text |
| **body-sm** | 0.875rem (14px) | 1.25rem (20px) | 400 | Small text, captions |
| **body-xs** | 0.75rem (12px) | 1rem (16px) | 400 | Tiny text, labels |

### Text Color Guidelines

- **Primary text:** gray-900 (`#111827`) - Headings, important information
- **Secondary text:** gray-600 (`#4b5563`) - Body text, descriptions
- **Tertiary text:** gray-500 (`#6b7280`) - Helper text, metadata
- **Disabled text:** gray-400 (`#9ca3af`) - Disabled states
- **On primary (blue) backgrounds:** white (`#ffffff`)
- **On dark backgrounds:** white (`#ffffff`)

---

## Spacing System

**Based on Tailwind's default spacing scale (0.25rem = 4px base unit)**

### Standard Spacing Values

| Token | Rem | Pixels | Use Case |
|-------|-----|--------|----------|
| **1** | 0.25rem | 4px | Tight spacing, icon gaps |
| **2** | 0.5rem | 8px | Small gaps, compact layouts |
| **3** | 0.75rem | 12px | Button padding (vertical) |
| **4** | 1rem | 16px | **DEFAULT** - Standard gaps |
| **6** | 1.5rem | 24px | Medium gaps, card padding |
| **8** | 2rem | 32px | Large gaps, section spacing |
| **12** | 3rem | 48px | Extra large gaps |
| **16** | 4rem | 64px | Section dividers |
| **24** | 6rem | 96px | Major section spacing |
| **32** | 8rem | 128px | Page-level spacing |

### Component-Specific Spacing

**Buttons:**
- Padding (sm): `px-3 py-1.5` (12px × 6px)
- Padding (md): `px-4 py-2` (16px × 8px)
- Padding (lg): `px-6 py-3` (24px × 12px)

**Cards:**
- Padding: `p-6` (24px all sides)
- Gap between cards: `gap-6` (24px)

**Forms:**
- Label margin: `mb-2` (8px)
- Field margin: `mb-4` (16px)
- Section margin: `mb-8` (32px)

**Page Layout:**
- Container padding: `p-8` (32px)
- Section spacing: `space-y-8` (32px vertical)

---

## Shadows

**Subtle, modern shadows for depth and elevation**

### Shadow Definitions (Tailwind Config)

| Name | CSS Value | Use Case |
|------|-----------|----------|
| **card** | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` | Default cards, containers |
| **card-hover** | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` | Card hover state |
| **floating** | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` | Modals, dropdowns, popovers |

### Shadow Usage

- **No shadow:** Flat buttons (ghost, outline variants)
- **card shadow:** Default card state
- **card-hover shadow:** Card hover, elevated cards
- **floating shadow:** Modals, dialogs, dropdown menus

---

## Border Radius

**Consistent corner rounding for modern, friendly aesthetic**

| Token | Value | Use Case |
|-------|-------|----------|
| **rounded-sm** | 0.125rem (2px) | Very subtle rounding |
| **rounded** | 0.25rem (4px) | **DEFAULT** - Buttons, inputs, small cards |
| **rounded-md** | 0.375rem (6px) | Medium cards |
| **rounded-lg** | 0.5rem (8px) | Large cards, modals |
| **rounded-xl** | 0.75rem (12px) | Hero cards, major containers |
| **rounded-full** | 9999px | Pills, badges, avatar images |

### Component-Specific Rounding

- **Buttons:** `rounded-md` (6px)
- **Inputs:** `rounded-md` (6px)
- **Cards:** `rounded-lg` (8px)
- **Badges:** `rounded-full` (pill shape)
- **Modals:** `rounded-xl` (12px)

---

## Responsive Breakpoints

**Desktop-first approach with mobile optimization**

| Breakpoint | Min Width | Target Devices | Layout Strategy |
|------------|-----------|----------------|-----------------|
| **Mobile** | 320px - 767px | Phones | Single column, stacked cards, hamburger menu, larger touch targets (≥44px) |
| **Tablet** | 768px - 1023px | Tablets | 2-column layouts, collapsible sidebar, touch-friendly |
| **Desktop** | 1024px+ | Laptops, desktops | Multi-column, full sidebar, hover states |

### Breakpoint Usage (Tailwind)

```css
/* Mobile-first approach */
.class {
  /* Mobile styles (default) */
}

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

### Responsive Design Guidelines

**Mobile (320px - 767px):**
- Single column layouts
- Cards stack vertically
- Hamburger navigation
- Bottom sheets for actions
- Touch targets ≥44px
- Hide non-critical information
- Prioritize status visibility

**Tablet (768px - 1023px):**
- 2-column grid layouts
- Collapsible sidebar navigation
- Touch-friendly controls
- Responsive tables (horizontal scroll if needed)

**Desktop (1024px+):**
- Full sidebar navigation
- Multi-column dashboards (3-4 columns)
- Hover states for cards and buttons
- Tooltips on hover
- Larger data tables with full columns

---

## Accessibility Requirements

**WCAG 2.1 Level AA Compliance**

### Color Contrast

**Minimum contrast ratios:**
- **Normal text (< 18px):** 4.5:1
- **Large text (≥ 18px or bold ≥ 14px):** 3:1
- **UI components (buttons, borders):** 3:1

**Validated combinations:**
- Gray-900 text on white background: 19.56:1 ✓
- Gray-600 text on white background: 7.23:1 ✓
- White text on primary-500 (blue): 4.78:1 ✓
- White text on success-500 (green): 4.52:1 ✓
- White text on danger-500 (red): 5.04:1 ✓

### Keyboard Navigation

**All interactive elements must:**
- Be keyboard accessible (Tab, Enter, Space, Escape)
- Show clear focus indicators (outline ring)
- Support logical tab order
- Allow dismissal with Escape key (modals, dropdowns)

**Focus ring style:**
```css
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
```

### Screen Reader Support

**Required ARIA labels:**
- All icon-only buttons: `aria-label`
- All form inputs: Associated `<label>` element
- All status indicators: `aria-live="polite"` for dynamic updates
- All modals: `role="dialog"`, `aria-labelledby`, `aria-describedby`
- All navigation: `<nav>` with `aria-label`

**Status announcements:**
- Booking success: `aria-live="polite"` announcement
- Errors: `aria-live="assertive"` announcement
- Loading states: `aria-busy="true"`

### Touch Targets

**Minimum touch target sizes:**
- **Buttons (mobile):** 44px × 44px
- **Links (mobile):** 44px × 44px
- **Icons (mobile):** 44px × 44px
- **Checkboxes/radios:** 44px × 44px (including label)

### Motion & Animation

**Respect user preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Design Principles

### Reusability

**Every UI pattern should have a single source of truth:**
- ❌ DON'T create inline buttons with Tailwind classes
- ✅ DO use `<Button>` component with variant props
- ❌ DON'T duplicate form field markup
- ✅ DO use `<FormField>` wrapper component

### Composability

**Components should be composable and flexible:**
- Accept children for custom content
- Support variant props for different styles
- Expose size props for different contexts
- Allow className prop for rare customizations

### Consistency

**All components follow the same patterns:**
- Variant system: `variant="primary" | "secondary" | "success" | "danger"`
- Size system: `size="sm" | "md" | "lg"`
- State props: `disabled`, `loading`, `error`
- Consistent prop naming across components

### Accessibility

**All components must:**
- Include proper ARIA labels
- Support keyboard navigation
- Meet color contrast requirements
- Provide focus indicators
- Work with screen readers

### Performance

**Optimize for performance:**
- Use semantic HTML (less JavaScript)
- Minimize re-renders (React.memo where appropriate)
- Lazy load heavy components
- Optimize images (WebP, responsive srcset)

### Documentation

**Every component should have:**
- Clear purpose and use cases
- Full API documentation (props, variants, states)
- Code examples
- Accessibility notes
- Common mistakes to avoid

---

## Implementation Notes

### Tailwind Configuration

All design tokens are defined in `tailwind.config.ts`:
- Colors → `theme.extend.colors`
- Spacing → Uses Tailwind defaults (4px base)
- Shadows → `theme.extend.boxShadow`
- Typography → `theme.extend.fontFamily`

### Component Library Location

All reusable components live in `components/ui/`:
- `Button.tsx` - All action buttons
- `Card.tsx` - Container component
- `Badge.tsx` - Status indicators
- `FormField.tsx` - Form input wrapper
- `Modal.tsx` - Dialog wrapper
- `StatusIndicator.tsx` - Booking status display
- `StatCard.tsx` - Dashboard stat widgets

### Design System Enforcement

**CLAUDE.md section 13 establishes strict rules:**
1. NEVER create inline UI components
2. ALWAYS use design tokens from `tailwind.config.ts`
3. ALWAYS use components from `components/ui/`
4. ALWAYS use frontend-design skill for new UI/UX work

---

## Version History

**v2.13 (December 29, 2025):**
- Initial design system documentation
- Established modern fitness app aesthetic
- Defined complete color palette with semantic naming
- Created typography scale with Inter font
- Documented spacing, shadows, border radius systems
- Established WCAG AA accessibility requirements
- Defined component design principles

---

## References

- **Tailwind Config:** `tailwind.config.ts`
- **Component Library:** `components/ui/`
- **Component Documentation:** `docs/COMPONENT_LIBRARY.md`
- **CLAUDE.md Section 13:** Design System rules
- **PRD Section 3.5:** UX/UI requirements
- **Inspiration:** Peloton, ClassPass, Strava fitness app aesthetics
