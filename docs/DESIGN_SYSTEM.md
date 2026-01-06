# Design System

**My Workout Scheduler - Modern Fitness App Design System**

This document defines the complete design system for My Workout Scheduler, establishing a consistent visual language inspired by modern fitness apps like Peloton, ClassPass, and Strava.

**Version:** 2.22
**Last Updated:** January 4, 2026

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Shadows](#shadows)
6. [Border Radius](#border-radius)
7. [Custom Utilities](#custom-utilities)
8. [Responsive Breakpoints](#responsive-breakpoints)
9. [UI Patterns](#ui-patterns)
10. [Accessibility Requirements](#accessibility-requirements)
11. [Component Design Principles](#component-design-principles)

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

#### Primary (Electric Blue/Cobalt) - Trust & Action
**Use for:** Main actions, links, navigation highlights, primary buttons

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#e8f4ff` | Backgrounds, hover states |
| 100 | `#d4e9ff` | Light backgrounds |
| 200 | `#b0d7ff` | Borders, dividers |
| 300 | `#7db9ff` | Disabled states |
| 400 | `#4a96ff` | Hover states |
| 500 | `#1a6fff` | **DEFAULT** - Primary buttons, links |
| 600 | `#0052e6` | Active states |
| 700 | `#003eb8` | Pressed states |
| 800 | `#003399` | Dark mode primary |
| 900 | `#002666` | Text on light backgrounds |

#### Secondary (Deep Orange) - Energy & Accent
**Use for:** Secondary actions, highlights, accent elements

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#fff3e0` | Backgrounds |
| 100 | `#ffe0b2` | Light backgrounds |
| 200 | `#ffcc80` | Borders |
| 300 | `#ffb74d` | Disabled states |
| 400 | `#ffa726` | Hover states |
| 500 | `#ff5722` | **DEFAULT** - Secondary buttons |
| 600 | `#f4511e` | Active states |
| 700 | `#e64a19` | Pressed states |
| 800 | `#d84315` | Dark mode secondary |
| 900 | `#bf360c` | Text on light backgrounds |

#### Success (Lime Victory) - Confirmation & Achievement
**Use for:** Success messages, confirmed bookings, positive feedback

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#f0fdf4` | Backgrounds |
| 100 | `#d9f9e3` | Light backgrounds |
| 200 | `#aef2c5` | Borders |
| 300 | `#6ee79f` | Disabled states |
| 400 | `#2dd872` | Hover states |
| 500 | `#00c853` | **DEFAULT** - Success buttons, confirmed badges |
| 600 | `#00a844` | Active states |
| 700 | `#008936` | Pressed states |
| 800 | `#006b2b` | Dark mode success |
| 900 | `#004d1f` | Text on light backgrounds |

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

#### Danger (Hot Pink Alert) - Errors & Destructive Actions
**Use for:** Error messages, failed bookings, destructive actions (delete)

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#fff1f2` | Backgrounds |
| 100 | `#ffe4e6` | Light backgrounds |
| 200 | `#fecdd3` | Borders |
| 300 | `#fda4af` | Disabled states |
| 400 | `#fb7185` | Hover states |
| 500 | `#f43f5e` | **DEFAULT** - Error badges, delete buttons |
| 600 | `#e11d48` | Active states |
| 700 | `#be123c` | Pressed states |
| 800 | `#9f1239` | Dark mode danger |
| 900 | `#881337` | Text on light backgrounds |

#### Purple (Electric) - Achievement & Premium
**Use for:** Achievements, streaks, premium features, accent highlights

| Shade | Hex | Use Case |
|-------|-----|----------|
| 50 | `#faf5ff` | Backgrounds |
| 100 | `#f3e8ff` | Light backgrounds |
| 200 | `#e9d5ff` | Borders |
| 300 | `#d8b4fe` | Disabled states |
| 400 | `#c084fc` | Hover states |
| 500 | `#8B5CF6` | **DEFAULT** - Purple buttons, badges |
| 600 | `#7C3AED` | Active states |
| 700 | `#6d28d9` | Pressed states |
| 800 | `#5b21b6` | Dark mode purple |
| 900 | `#4c1d95` | Text on light backgrounds |

### Status Colors

**Booking-specific status indicators with semantic meaning**

| Status | Color | Hex | Use Case |
|--------|-------|-----|----------|
| **Confirmed** | Lime Victory | `#00c853` | Successfully booked classes |
| **Pending** | Bright Orange | `#ff9500` | Booking in progress or scheduled |
| **Waitlisted** | Cyan | `#00b8ff` | On waitlist for full classes |
| **Failed** | Hot Pink | `#f43f5e` | Failed booking attempts |
| **Skipped** | Slate Gray | `#94a3b8` | User-skipped occurrences |
| **Retrying** | Bright Orange (pulsing) | `#ff9500` | Auto-retry in progress |

### Class Type Colors

**Athletic discipline accent colors for different workout types (use sparingly)**

| Class Type | Color | Hex | Vibe |
|------------|-------|-----|------|
| Yoga | Purple | `#9333ea` | Mindful, spiritual |
| Cycling | Coral Red | `#ff3d3d` | High energy, cardio |
| Strength | Electric Blue | `#1a6fff` | Power, intensity |
| Cardio | Vibrant Orange | `#ff6b00` | Energy, movement |
| Swimming | Cyan | `#00b8ff` | Water, flow |
| Meditation | Soft Indigo | `#818cf8` | Calm, centered |
| HIIT | Magenta | `#ff0080` | Intense, explosive |
| Pilates | Pink | `#ec4899` | Grace, strength |

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

**Display/Headings:** Sora (`font-sora`)
**Body Text:** DM Sans (`font-dm-sans`)
**Fallback:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

**Why Sora + DM Sans?**
- **Sora:** Bold, striking geometric sans-serif for headings - creates strong visual hierarchy
- **DM Sans:** Clean, highly readable humanist sans-serif for body text
- Together they create a modern, athletic aesthetic that feels both professional and energetic
- Excellent readability across all sizes and devices

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

**4-layer shadow system for depth and elevation**

### Shadow Definitions (Tailwind Config)

The design system uses a 4-layer shadow approach for cards, creating smooth, natural depth:

| Name | CSS Value | Use Case |
|------|-----------|----------|
| **card** | `0 1px 2px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.08)` | Default cards, containers |
| **card-hover** | `0 2px 4px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.08)` | Card hover state, elevated cards |
| **floating** | `0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)` | Modals, dropdowns, popovers |

### Button Shadows

Colored shadows that match button variants for a cohesive glow effect:

| Name | CSS Value | Use Case |
|------|-----------|----------|
| **btn-primary** | `0 4px 12px rgba(26, 111, 255, 0.25)` | Primary buttons |
| **btn-primary-lg** | `0 4px 16px rgba(26, 111, 255, 0.3), 0 8px 32px rgba(26, 111, 255, 0.15)` | Large primary buttons |
| **btn-success** | `0 4px 12px rgba(0, 200, 83, 0.25)` | Success buttons |
| **btn-danger** | `0 4px 12px rgba(244, 63, 94, 0.25)` | Danger buttons |
| **btn-purple** | `0 4px 12px rgba(139, 92, 246, 0.25)` | Purple buttons |

### Shadow Usage

- **No shadow:** Flat buttons (ghost, outline variants)
- **card shadow:** Default card state
- **card-hover shadow:** Card hover, elevated cards
- **floating shadow:** Modals, dialogs, dropdown menus
- **btn-* shadows:** Active state glow on solid-color buttons

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

- **Buttons:** `rounded-lg` (8px) - clear affordance, not diagonal
- **Inputs:** `rounded-lg` (8px)
- **Cards:** `rounded-lg` to `rounded-2xl` (8px-16px)
- **Badges:** `clip-diagonal-badge` (default) or `rounded-full` (pill shape via `diagonal={false}`)
- **Modals:** `rounded-xl` (12px)

**UX Decision:** Buttons use rounded corners (not diagonal clip-path) for clear affordance. Only badges use the diagonal clip-path by default.

---

## Custom Utilities

Design System v2 includes custom CSS utilities defined in `app/globals.css`.

### Clip-Path Utilities

Diagonal clip-paths create the signature editorial aesthetic:

| Class | Polygon | Use Case |
|-------|---------|----------|
| `clip-diagonal-badge` | `polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)` | Badge/tag diagonal effect |
| `clip-diagonal-card-tr` | `polygon(0% 0%, calc(100% - 20px) 0%, 100% 20px, 100% 100%, 0% 100%)` | Card top-right corner cut |
| `clip-diagonal-card-br` | `polygon(0% 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%)` | Card bottom-right corner cut |
| `clip-diagonal-card-double` | `polygon(0% 0%, calc(100% - 24px) 0%, 100% 24px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0% 100%)` | Card with both corners cut |
| `clip-diagonal-toast` | `polygon(0% 5%, 100% 0%, 100% 100%, 0% 95%)` | Toast notification slant |
| `clip-diagonal-nav-active` | `polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)` | Navigation active indicator |

### Gradient Utilities

**Background Gradients:**

| Class | Direction | Colors | Use Case |
|-------|-----------|--------|----------|
| `bg-gradient-primary` | to right | `#1a6fff` → `#0052e6` | Primary button backgrounds |
| `bg-gradient-success` | to right | `#00c853` → `#00a844` | Success buttons, confirmed badges |
| `bg-gradient-danger` | to right | `#f43f5e` → `#e11d48` | Danger buttons, failed badges |
| `bg-gradient-purple` | to right | `#8B5CF6` → `#7C3AED` | Purple/premium accents |
| `bg-gradient-warning` | to right | `#ff9500` → `#ff6b00` | Warning/pending states |

**Text Gradients:**

| Class | Direction | Colors | Use Case |
|-------|-----------|--------|----------|
| `text-gradient-primary` | to right | `#1a6fff` → `#0052e6` | Gradient text effect |
| `text-gradient-success` | to right | `#00c853` → `#00a844` | Gradient text effect |

### Focus & Form Utilities

| Class | Description |
|-------|-------------|
| `focus-accent-bar` | Left accent bar on input focus (blue→green gradient) |
| `shimmer` | Horizontal shimmer loading effect |
| `shimmer-diagonal` | Diagonal shimmer for skeleton loading |
| `validation-message` | Styled validation error message |
| `validation-shake` | Form shake animation for invalid submit |

### Component Utilities

| Class | Description |
|-------|-------------|
| `editorial-bg` | Three-layer radial gradient background |
| `modal-header-accent` | Modal header with gradient line |
| `editorial-divider` | Centered gradient divider line |

---

## Responsive Breakpoints

**Mobile-first approach** - Design for 320px, enhance for larger screens

| Breakpoint | Width | Tailwind | Layout Strategy |
|------------|-------|----------|-----------------|
| **XS** | < 640px | (default) | Single column, stacked cards, large touch targets |
| **SM** | ≥ 640px | `sm:` | 2-column grids, more spacing |
| **MD** | ≥ 768px | `md:` | Desktop nav visible, expanded layouts |
| **LG** | ≥ 1024px | `lg:` | Full multi-column, hover states, larger elements |

### Breakpoint Usage (Tailwind)

```tsx
// Mobile-first responsive classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
<div className="p-4 sm:p-6 lg:p-8">
<div className="text-2xl sm:text-4xl lg:text-7xl">
<div className="hidden sm:block">  // Only visible on sm+
<div className="flex sm:hidden">   // Only visible on mobile
```

### Responsive Design Guidelines

**Mobile (< 640px):**
- Single column layouts (`grid-cols-1`)
- Reduced padding (`p-4` instead of `p-6`)
- Cards stack vertically with full width
- Hamburger menu positioned on right
- Touch targets ≥44px
- Hide non-essential visual elements (gauges, legends)
- Larger, bolder typography for hero elements
- Layout containers MUST have `overflow-x-hidden` to prevent horizontal scroll

**Tablet (640px - 1023px):**
- 2-column grid layouts (`sm:grid-cols-2`)
- Standard padding (`sm:p-6`)
- Visual elements visible (gauges, charts)
- Touch-friendly controls

**Desktop (1024px+):**
- Multi-column dashboards (`lg:grid-cols-4`)
- Full padding (`lg:p-8`)
- Prominent visual elements (larger gauges)
- Hover states for cards and buttons
- Tooltips on hover

### Adaptive Component Behavior

Some components adapt their content based on viewport:

**SuccessRateCard:**
- **Mobile (< sm):** Large percentage text as hero, gauge hidden, legend hidden
- **Tablet (sm+):** Gauge visible (144px), legend visible
- **Desktop (lg+):** Prominent gauge (240px), full visualization

**Stats Grid:**
- **Mobile:** Single column, cards stack vertically
- **Tablet:** 2-column grid
- **Desktop:** 4-column grid

**Action Buttons:**
- Use `flex-wrap` to allow graceful wrapping on narrow viewports
- Responsive padding: `px-3 sm:px-5 py-2 sm:py-2.5`

**Form Button Layouts (with metadata):**

When a form has a submit button alongside metadata (e.g., "Last updated", "Created" dates):

```tsx
// Mobile: Stack vertically | Tablet+: Horizontal with metadata right-aligned
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <Button type="submit" variant="primary">
    Save Changes
  </Button>
  <p className="text-sm text-gray-500 font-dm-sans">
    Last updated: {date}
  </p>
</div>
```

- **Mobile (< sm):** Button stacked above metadata text
- **Tablet+ (sm):** Horizontal layout, button left, metadata right-aligned
- **Semantic:** Use `<p>` for metadata text, not `<div>`

**Used in:** GymCredentialsForm, RecurringClassForm

---

## UI Patterns

Production patterns used consistently across the application.

### Editorial Background

Three-layer radial gradient spotlight effect for page backgrounds:

```css
.editorial-bg::before {
  background:
    radial-gradient(ellipse 80% 60% at 20% 40%, rgba(26, 111, 255, 0.12), transparent 50%),
    radial-gradient(ellipse 60% 50% at 80% 70%, rgba(0, 200, 83, 0.08), transparent 50%),
    radial-gradient(ellipse 50% 40% at 50% 20%, rgba(139, 92, 246, 0.06), transparent 50%);
}
```

**Use on:** Dashboard pages, auth pages, any full-page layout

### Staggered Animations

Cascade effect using 0.1s increment delays:

```tsx
// Pattern for staggered fade-in
<Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }} />
<Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }} />
<Card className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }} />
```

**Use on:** Dashboard stat cards, list items, page sections

### Hero Card Spanning

Featured cards span multiple columns in the stats grid:

```tsx
// SuccessRateCard spans 2 columns as hero element
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
  <SuccessRateCard className="col-span-1 sm:col-span-2" />
  <StatCard />
  <StatCard />
</div>
```

### Focus Accent Bar

Left gradient bar appears on input focus:

```css
.focus-accent-bar::before {
  width: 3px;
  background: linear-gradient(to bottom, #1a6fff, #00c853);
  clip-path: polygon(0% 0%, 100% 5%, 100% 95%, 0% 100%);
}
```

Changes to danger gradient on invalid input.

### Card Border Accent

Left 4px border with color matching icon background:

```tsx
<Card className="border-l-4 border-l-primary-500 group-hover:border-l-primary-600">
  <div className="w-12 h-12 rounded-xl bg-primary-100">
    <Icon className="text-primary-600" />
  </div>
</Card>
```

**Use on:** Quick action cards, feature cards, navigation cards

### Responsive Text Scaling

Mobile-first text that may decrease on tablet then increase on desktop:

```tsx
// Hero text: Large on mobile (no gauge), smaller on tablet (with gauge), large on desktop
<p className="text-5xl sm:text-4xl lg:text-7xl font-bold">
  {percentage}%
</p>
```

**Rationale:** When visual elements (gauges, charts) are hidden on mobile, text becomes the hero and should be larger. When visuals are present, text can be smaller.

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

All reusable components live in `components/ui/` (18 components):

**Core:** Button, Badge, Card, Modal
**Form:** Input, Select, Checkbox, FormField
**Navigation:** DropdownMenu, Tabs
**Feedback:** Alert, Toast, Skeleton
**Display:** StatusIndicator, StatCard, Divider
**Layout:** Header, Footer

**Feature Components** (in `components/`):
- `NextClassCard.tsx` - Hero card for next scheduled class
- `SuccessRateCard.tsx` - Dashboard success rate with gauge

### Design System Enforcement

**CLAUDE.md section 13 establishes strict rules:**
1. NEVER create inline UI components
2. ALWAYS use design tokens from `tailwind.config.ts`
3. ALWAYS use components from `components/ui/`
4. ALWAYS use frontend-design skill for new UI/UX work

---

## Version History

**v2.22 (January 4, 2026):**
- **MAJOR UPDATE:** Fixed all color hex values to match actual tailwind.config.ts
- Updated typography from Inter to Sora (headings) + DM Sans (body)
- Updated shadow system to actual 4-layer shadow approach
- Added button shadows (btn-primary, btn-success, btn-danger, btn-purple)
- Added Purple (Electric) color scale for achievements/premium
- Added Custom Utilities section (clip-paths, gradients)
- Added UI Patterns section (editorial bg, staggered animations, hero spanning)
- Added 2 additional class types (HIIT, Pilates)
- Updated Status Colors to match actual config values
- Updated component library listing (18 components + 2 feature components)
- Updated border radius notes with UX decision about diagonal badges

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
