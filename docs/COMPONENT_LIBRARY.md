# Component Library

**My Workout Scheduler - UI Component Reference**

This document provides complete API documentation, usage examples, and best practices for all reusable UI components in the My Workout Scheduler design system.

**Version:** 2.36
**Last Updated:** April 22, 2026
**Location:** `components/ui/`

---

## Table of Contents

**Core Components:**
1. [Button](#button)
2. [Card](#card)
3. [Badge](#badge)
4. [Modal](#modal)

**Form Components:**
5. [Input](#input)
6. [Select](#select)
7. [Combobox](#combobox)
8. [TimeInput](#timeinput)
9. [Checkbox](#checkbox)
10. [FormField](#formfield)

**Navigation:**
10. [DropdownMenu](#dropdownmenu)
11. [Tabs](#tabs)

**Feedback:**
12. [Alert](#alert)
13. [Toast](#toast)
14. [Skeleton](#skeleton)

**Display:**
15. [StatusIndicator](#statusindicator)
16. [StatCard](#statcard)
17. [Divider](#divider)

**Layout:**
18. [Header](#header)
19. [Footer](#footer)

**Feature Components:**
20. [NextClassCard](#nextclasscard)
21. [SuccessRateCard](#successratecard)

**Guidelines:**
22. [Usage Guidelines](#usage-guidelines)

---

## Button

**File:** `components/ui/Button.tsx`

**Purpose:** Universal button component for all interactive actions. Eliminates 40+ duplicate button implementations across the codebase.

**When to use:**
- ✅ Form submissions (save, cancel, delete)
- ✅ Navigation triggers (next, back)
- ✅ Action buttons (skip, copy, edit)
- ✅ Modal actions (confirm, dismiss)

**When NOT to use:**
- ❌ Navigation links (use `<Link>` instead)
- ❌ Non-interactive elements (use `<div>` or semantic HTML)

### API

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'ghost-primary' | 'outline' | 'outline-primary' | 'outline-danger' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string // For rare overrides
}
```

**10 variants available:** primary, secondary, success, danger, ghost, ghost-primary, outline, outline-primary, outline-danger, purple

### Variants

#### Primary (Default)
**Use for:** Main CTAs, primary actions, most important button on page

```tsx
<Button variant="primary">Book Now</Button>
<Button variant="primary" size="lg">Get Started</Button>
```

**Style:**
- Background: `primary-500` (blue)
- Text: white
- Hover: `primary-600`
- Active: `primary-700`
- Shadow: none (flat design)

#### Secondary
**Use for:** Secondary actions, alternative choices

```tsx
<Button variant="secondary">Skip Next</Button>
<Button variant="secondary" size="sm">Copy</Button>
```

**Style:**
- Background: `secondary-500` (orange)
- Text: white
- Hover: `secondary-600`
- Active: `secondary-700`

#### Success
**Use for:** Confirmations, positive actions

```tsx
<Button variant="success">Confirm Booking</Button>
<Button variant="success">Save Changes</Button>
```

**Style:**
- Background: `success-500` (green)
- Text: white
- Hover: `success-600`
- Active: `success-700`

#### Danger
**Use for:** Destructive actions (delete, cancel, remove)

```tsx
<Button variant="danger">Delete Class</Button>
<Button variant="danger">Cancel Booking</Button>
```

**Style:**
- Background: `danger-500` (red)
- Text: white
- Hover: `danger-600`
- Active: `danger-700`

#### Ghost
**Use for:** Tertiary actions, inline actions, less prominent buttons

```tsx
<Button variant="ghost">Cancel</Button>
<Button variant="ghost" size="sm">Edit</Button>
```

**Style:**
- Background: transparent
- Text: `gray-700`
- Hover: `gray-100` background
- No shadow

#### Ghost-Primary
**Use for:** Primary-styled ghost buttons, subtle primary emphasis, secondary actions with primary color

```tsx
<Button variant="ghost-primary">View All</Button>
<Button variant="ghost-primary" size="sm">Learn More</Button>
```

**Style:**
- Background: `primary-50` (light blue)
- Text: `primary-600`
- Hover: `primary-100` background
- No shadow

#### Outline
**Use for:** Alternative secondary actions, toggles

```tsx
<Button variant="outline">Filter</Button>
<Button variant="outline">View Details</Button>
```

**Style:**
- Background: white/transparent
- Border: `gray-300`
- Text: `gray-700`
- Hover: `gray-50` background

#### Outline-Primary
**Use for:** Primary-styled outline buttons, secondary emphasis

```tsx
<Button variant="outline-primary">Add Class</Button>
<Button variant="outline-primary">Learn More</Button>
```

**Style:**
- Background: transparent
- Border: `primary-500` (blue)
- Text: `primary-500`
- Hover: `primary-50` background

#### Outline-Danger
**Use for:** Destructive actions with less visual weight

```tsx
<Button variant="outline-danger">Remove</Button>
<Button variant="outline-danger">Cancel Booking</Button>
```

**Style:**
- Background: transparent
- Border: `danger-500` (red)
- Text: `danger-500`
- Hover: `danger-50` background

#### Purple
**Use for:** Premium features, achievements, special actions

```tsx
<Button variant="purple">Upgrade</Button>
<Button variant="purple">View Achievements</Button>
```

**Style:**
- Background: `bg-gradient-purple` (`#8B5CF6` → `#7C3AED`)
- Text: white
- Hover: Lighter gradient
- Shadow: `shadow-btn-purple`

### Sizes

| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| **sm** | `px-3 py-1.5` | `text-sm` (14px) | Inline actions, tight spaces |
| **md** | `px-4 py-2` | `text-base` (16px) | **DEFAULT** - Most buttons |
| **lg** | `px-6 py-3` | `text-lg` (18px) | Hero CTAs, primary page actions |

### States

#### Loading
Shows spinner, disables interaction

```tsx
<Button loading>Saving...</Button>
<Button variant="primary" loading>Processing</Button>
```

**Behavior:**
- Button disabled
- Text hidden or dimmed
- Spinner icon shown (animated)
- `aria-busy="true"` set

#### Disabled
Visually disabled, no interaction

```tsx
<Button disabled>Unavailable</Button>
<Button variant="danger" disabled>Delete</Button>
```

**Style:**
- Opacity: 50%
- Cursor: `not-allowed`
- No hover effects
- `aria-disabled="true"` set

### Code Examples

```tsx
// Basic usage
<Button>Click Me</Button>

// Primary CTA
<Button variant="primary" size="lg">
  Get Started
</Button>

// Destructive action
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>

// Loading state
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</Button>

// Disabled state
<Button disabled={!canSubmit}>
  Submit
</Button>

// Ghost button for cancel
<Button variant="ghost" onClick={onCancel}>
  Cancel
</Button>

// With icon (example)
<Button variant="primary">
  <PlusIcon className="w-4 h-4 mr-2" />
  Add Class
</Button>
```

### Accessibility

- ✅ Keyboard accessible (Tab, Enter, Space)
- ✅ Focus ring: `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
- ✅ ARIA attributes: `aria-disabled`, `aria-busy`
- ✅ Color contrast: All variants meet WCAG AA (4.5:1)
- ✅ Touch target: Minimum 44px height on mobile

### Common Mistakes

❌ **DON'T create inline buttons:**
```tsx
// BAD - Inline Tailwind classes
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click Me
</button>
```

✅ **DO use Button component:**
```tsx
// GOOD - Use Button component
<Button variant="primary">Click Me</Button>
```

❌ **DON'T use buttons for navigation:**
```tsx
// BAD - Button for navigation
<Button onClick={() => router.push('/dashboard')}>
  Go to Dashboard
</Button>
```

✅ **DO use Link component:**
```tsx
// GOOD - Link for navigation
<Link href="/dashboard" className="btn-primary">
  Go to Dashboard
</Link>
```

---

## Card

**File:** `components/ui/Card.tsx`

**Purpose:** Consistent container component for grouped content. Creates visual hierarchy and separation.

**When to use:**
- ✅ Class items in schedule list
- ✅ Dashboard stat widgets
- ✅ Form sections
- ✅ Content groupings

**When NOT to use:**
- ❌ Page-level containers (use semantic HTML)
- ❌ Every single element (avoid over-carding)

### API

```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean // Enable hover effect
  children: React.ReactNode
  className?: string
}
```

### Variants

#### Default
**Use for:** Standard content cards

```tsx
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</Card>
```

**Style:**
- Background: white
- Shadow: `card` (subtle 1px shadow)
- Border: none
- Rounded: `rounded-lg` (8px)

#### Elevated
**Use for:** Important cards, featured content, CTAs

```tsx
<Card variant="elevated">
  <h3>Featured Class</h3>
</Card>
```

**Style:**
- Background: white
- Shadow: `card-hover` (more prominent)
- Border: none
- Rounded: `rounded-lg`

#### Outlined
**Use for:** Secondary cards, less emphasis

```tsx
<Card variant="outlined">
  <p>Secondary information</p>
</Card>
```

**Style:**
- Background: white
- Shadow: none
- Border: `border border-gray-200`
- Rounded: `rounded-lg`

#### Gradient (Optional)
**Use for:** Hero cards, special emphasis, promotional content

```tsx
<Card variant="gradient">
  <h2>Welcome to My Workout Scheduler!</h2>
</Card>
```

**Style:**
- Background: Subtle gradient (e.g., `bg-gradient-to-br from-primary-50 to-secondary-50`)
- Shadow: `card`
- Rounded: `rounded-xl` (12px for larger cards)

### Padding

| Size | Value | Use Case |
|------|-------|----------|
| **none** | `p-0` | Custom padding needed (e.g., full-bleed images) |
| **sm** | `p-4` (16px) | Compact cards, tight spaces |
| **md** | `p-6` (24px) | **DEFAULT** - Standard cards |
| **lg** | `p-8` (32px) | Spacious cards, hero sections |

### Hover Effect

Enable hover effect for interactive cards (e.g., clickable class cards)

```tsx
<Card hover onClick={handleClick}>
  <h3>Click me!</h3>
</Card>
```

**Behavior:**
- Shadow transitions from `card` to `card-hover`
- Slight scale transform: `scale-[1.02]`
- Smooth transition: `transition-all duration-200`
- Cursor changes to `cursor-pointer`

### Code Examples

```tsx
// Basic card
<Card>
  <h3 className="font-bold text-lg mb-2">Class Title</h3>
  <p className="text-gray-600">Mon 4:15 PM</p>
</Card>

// Elevated card with custom padding
<Card variant="elevated" padding="lg">
  <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
  <p>Get started by adding your first class.</p>
</Card>

// Interactive card with hover
<Card hover onClick={() => setSelectedClass(class)}>
  <div className="flex justify-between items-center">
    <h3>{class.name}</h3>
    <Badge status="confirmed">Confirmed</Badge>
  </div>
</Card>

// Outlined card for secondary content
<Card variant="outlined" padding="sm">
  <p className="text-sm text-gray-600">
    Next booking: Jan 6, 2025 at 2:15 PM
  </p>
</Card>

// No padding for custom layout
<Card padding="none">
  <img src="/hero.jpg" alt="Hero" className="w-full rounded-t-lg" />
  <div className="p-6">
    <h3>Image Card</h3>
  </div>
</Card>
```

### Accessibility

- ✅ Semantic HTML: Use `<article>` or `<section>` internally
- ✅ Keyboard accessible if interactive
- ✅ Focus indicator if clickable
- ✅ ARIA role if needed (e.g., `role="button"` for clickable cards)

### Common Mistakes

❌ **DON'T nest cards unnecessarily:**
```tsx
// BAD - Nested cards create visual clutter
<Card>
  <Card>Content</Card>
</Card>
```

✅ **DO use Card for distinct sections:**
```tsx
// GOOD - Cards for separate concerns
<div className="grid grid-cols-2 gap-6">
  <Card>Section 1</Card>
  <Card>Section 2</Card>
</div>
```

---

## Badge

**File:** `components/ui/Badge.tsx`

**Purpose:** Visual status indicators and labels. Provides at-a-glance information about state.

**When to use:**
- ✅ Booking status (confirmed, pending, failed)
- ✅ Class type labels
- ✅ Counts/numbers (e.g., "3 classes this week")
- ✅ Feature flags (e.g., "NEW")

**When NOT to use:**
- ❌ Buttons (use Button component)
- ❌ Long text content

### API

```typescript
interface BadgeProps {
  status?: 'confirmed' | 'pending' | 'waitlisted' | 'failed' | 'skipped' | 'retrying'
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md' | 'lg'
  diagonal?: boolean // Default: true - Uses clip-diagonal-badge; false uses rounded-full
  icon?: React.ReactNode // Optional icon (e.g., checkmark)
  children: React.ReactNode
  className?: string
}
```

### Shape Control

The `diagonal` prop controls the badge shape:

```tsx
// Default: Diagonal clip-path (v2 design)
<Badge status="confirmed">Booked</Badge>

// Pill shape (rounded-full)
<Badge status="confirmed" diagonal={false}>Booked</Badge>
```

**Default is `diagonal={true}`** - Uses the signature `clip-diagonal-badge` style. Set `diagonal={false}` for traditional pill-shaped badges.

### Status Variants (Booking-specific)

#### Confirmed
```tsx
<Badge status="confirmed">Confirmed</Badge>
```
- **Color:** Green (`success-500`)
- **Icon:** Checkmark ✓
- **Use:** Successfully booked classes

#### Pending
```tsx
<Badge status="pending">Pending</Badge>
```
- **Color:** Amber (`warning-500`)
- **Icon:** Clock ⏳
- **Use:** Booking scheduled but not yet attempted

#### Waitlisted
```tsx
<Badge status="waitlisted">Waitlisted</Badge>
```
- **Color:** Blue (`primary-500`)
- **Icon:** Ticket 🎫
- **Use:** On waitlist for full classes

#### Failed
```tsx
<Badge status="failed">Failed</Badge>
```
- **Color:** Red (`danger-500`)
- **Icon:** X ✗
- **Use:** Failed booking attempts

#### Skipped
```tsx
<Badge status="skipped">Skipped</Badge>
```
- **Color:** Gray (`gray-500`)
- **Icon:** Forward skip ⏭
- **Use:** User-skipped occurrences

#### Retrying
```tsx
<Badge status="retrying">Retrying</Badge>
```
- **Color:** Amber (`warning-500`) with pulse animation
- **Icon:** Refresh 🔄
- **Use:** Auto-retry in progress

### Generic Variants

#### Default
```tsx
<Badge>Default</Badge>
```
- **Color:** Gray background, gray text
- **Use:** Neutral labels

#### Success
```tsx
<Badge variant="success">Active</Badge>
```
- **Color:** Green background, white text
- **Use:** Positive states

#### Warning
```tsx
<Badge variant="warning">Attention Needed</Badge>
```
- **Color:** Yellow background, dark text
- **Use:** Warnings, pending actions

#### Danger
```tsx
<Badge variant="danger">Error</Badge>
```
- **Color:** Red background, white text
- **Use:** Errors, critical issues

#### Info
```tsx
<Badge variant="info">New</Badge>
```
- **Color:** Blue background, white text
- **Use:** Informational labels

#### Purple
```tsx
<Badge variant="purple">Premium</Badge>
<Badge variant="purple">Achievement</Badge>
```
- **Color:** Purple gradient (`#8B5CF6` → `#7C3AED`), white text
- **Use:** Premium features, achievements, special status

### Sizes

| Size | Padding | Font Size | Use Case |
|------|---------|-----------|----------|
| **sm** | `px-2 py-0.5` | `text-xs` (12px) | Inline labels, tight spaces |
| **md** | `px-2.5 py-0.5` | `text-sm` (14px) | **DEFAULT** - Most badges |
| **lg** | `px-3 py-1` | `text-base` (16px) | Prominent status indicators |

### Code Examples

```tsx
// Status badges
<Badge status="confirmed">Confirmed</Badge>
<Badge status="pending">Pending</Badge>
<Badge status="waitlisted">Waitlisted</Badge>
<Badge status="failed">Failed</Badge>

// With custom icon
<Badge status="confirmed" icon={<CheckIcon />}>
  Booked
</Badge>

// Generic variants
<Badge variant="success">Active</Badge>
<Badge variant="warning">3 Action Items</Badge>
<Badge variant="info">NEW</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>

// In context (class card)
<Card>
  <div className="flex justify-between items-center">
    <h3>BODYPUMP</h3>
    <Badge status="confirmed">Confirmed</Badge>
  </div>
  <p className="text-gray-600">Mon 4:15 PM</p>
</Card>
```

### Accessibility

- ✅ Color is not the only indicator (includes icon/text)
- ✅ Sufficient color contrast (4.5:1 minimum)
- ✅ Screen reader friendly with semantic text

### Common Mistakes

❌ **DON'T use badges for actions:**
```tsx
// BAD - Badge looks clickable but isn't a button
<Badge onClick={handleClick}>Click me</Badge>
```

✅ **DO use Button for actions:**
```tsx
// GOOD - Use Button for interactive elements
<Button variant="outline" size="sm">Click me</Button>
```

---

## FormField

**File:** `components/ui/FormField.tsx`

**Purpose:** Consistent wrapper for all form inputs. Provides label, helper text, error messages, and required indicators.

**When to use:**
- ✅ All text inputs, selects, textareas
- ✅ Custom form controls (date pickers, etc.)
- ✅ Any user input that needs a label

**When NOT to use:**
- ❌ Buttons (use Button component)
- ❌ Non-form UI elements

### API

```typescript
interface FormFieldProps {
  label: string
  htmlFor: string // ID of input element
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode // The actual input element
  className?: string
}
```

### Structure

```tsx
<FormField
  label="Class Type"
  htmlFor="classType"
  required
  helperText="Select the type of class you want to book"
  error={errors.classType}
>
  <input
    id="classType"
    type="text"
    className="form-input"
    {...register('classType')}
  />
</FormField>
```

**Rendered output:**
```
┌─────────────────────────────────────┐
│ Class Type *                        │  ← Label with required indicator
├─────────────────────────────────────┤
│ [Input field]                       │  ← Input element (children)
├─────────────────────────────────────┤
│ Select the type of class...         │  ← Helper text (gray)
│ ⚠ This field is required            │  ← Error message (red, if present)
└─────────────────────────────────────┘
```

### Props Details

#### label (required)
The visible label text for the input

```tsx
<FormField label="Email Address" htmlFor="email">
  <input id="email" type="email" />
</FormField>
```

#### htmlFor (required)
Must match the `id` of the input element for accessibility

```tsx
<FormField label="Password" htmlFor="password">
  <input id="password" type="password" />
</FormField>
```

#### required (optional)
Shows asterisk (*) next to label, sets `aria-required="true"`

```tsx
<FormField label="Class Name" htmlFor="className" required>
  <input id="className" required />
</FormField>
```

#### helperText (optional)
Descriptive text shown below input (gray color)

```tsx
<FormField
  label="Booking Window"
  htmlFor="bookingWindow"
  helperText="Hours before class that booking opens (e.g., 26)"
>
  <input id="bookingWindow" type="number" />
</FormField>
```

#### error (optional)
Error message shown below input (red color), sets `aria-invalid="true"`

```tsx
<FormField
  label="Email"
  htmlFor="email"
  error={errors.email?.message}
>
  <input id="email" type="email" />
</FormField>
```

### Code Examples

```tsx
// Basic text input
<FormField label="Class Name" htmlFor="className" required>
  <input
    id="className"
    type="text"
    className="form-input"
    {...register('className', { required: 'Class name is required' })}
  />
</FormField>

// Select dropdown
<FormField
  label="Branch"
  htmlFor="branch"
  required
  helperText="Select your preferred gym location"
>
  <select id="branch" className="form-select" {...register('branch')}>
    <option value="">Choose a branch...</option>
    <option value="downtown">Downtown YMCA</option>
    <option value="westside">Westside YMCA</option>
  </select>
</FormField>

// With error message
<FormField
  label="Email"
  htmlFor="email"
  required
  error={errors.email?.message}
>
  <input
    id="email"
    type="email"
    className={`form-input ${errors.email ? 'border-red-500' : ''}`}
    {...register('email', {
      required: 'Email is required',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address',
      },
    })}
  />
</FormField>

// Textarea
<FormField
  label="Notes"
  htmlFor="notes"
  helperText="Optional notes about this class"
>
  <textarea
    id="notes"
    rows={4}
    className="form-textarea"
    {...register('notes')}
  />
</FormField>

// Number input with helper text
<FormField
  label="Booking Window (hours)"
  htmlFor="bookingWindow"
  required
  helperText="Typically 26 hours for YMCA classes"
>
  <input
    id="bookingWindow"
    type="number"
    min="1"
    className="form-input"
    {...register('bookingWindow', { required: true, min: 1 })}
  />
</FormField>
```

### Styling Guidelines

**Input styles (apply to input element):**
```css
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
         disabled:bg-gray-100 disabled:cursor-not-allowed;
}

.form-input.error {
  @apply border-red-500 focus:ring-red-500;
}
```

### Accessibility

- ✅ Label associated with input via `htmlFor` and `id`
- ✅ Required fields have `aria-required="true"`
- ✅ Error fields have `aria-invalid="true"` and `aria-describedby`
- ✅ Helper text has unique ID for `aria-describedby`
- ✅ Error messages announced by screen readers

### Common Mistakes

❌ **DON'T create inline form fields:**
```tsx
// BAD - Inline markup without FormField
<div>
  <label htmlFor="email">Email *</label>
  <input id="email" type="email" />
  <span className="text-red-500">{error}</span>
</div>
```

✅ **DO use FormField wrapper:**
```tsx
// GOOD - Consistent FormField component
<FormField label="Email" htmlFor="email" required error={error}>
  <input id="email" type="email" className="form-input" />
</FormField>
```

❌ **DON'T forget to match htmlFor and id:**
```tsx
// BAD - Mismatched IDs break accessibility
<FormField label="Email" htmlFor="email">
  <input id="userEmail" type="email" />
</FormField>
```

✅ **DO ensure IDs match:**
```tsx
// GOOD - Matching IDs for proper association
<FormField label="Email" htmlFor="email">
  <input id="email" type="email" />
</FormField>
```

---

## Modal

**File:** `components/ui/Modal.tsx`

**Purpose:** Dialog/modal wrapper for overlays, confirmations, and focused interactions.

**When to use:**
- ✅ Confirmations (delete, skip, book now)
- ✅ Forms that need focus (add class, edit class)
- ✅ Alerts and important messages
- ✅ Multi-step wizards

**When NOT to use:**
- ❌ Large forms (use dedicated page)
- ❌ Always-visible content
- ❌ Navigation

### API

```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'danger' // Default: 'default'
  closeOnOverlayClick?: boolean // Default: true
  showCloseButton?: boolean // Default: true
  children: React.ReactNode
  footer?: React.ReactNode // Optional footer with actions
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `boolean` | - | Controls modal visibility |
| onClose | `() => void` | - | Callback when modal closes |
| title | `string` | - | Modal header title |
| size | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal width |
| variant | `'default' \| 'danger'` | `'default'` | Header accent style |
| closeOnOverlayClick | `boolean` | `true` | Close when clicking overlay |
| showCloseButton | `boolean` | `true` | Show X button in header |
| children | `React.ReactNode` | - | Modal body content |
| footer | `React.ReactNode` | - | Optional footer actions |

### Variants

| Variant | Description | Use Case |
|---------|-------------|----------|
| `default` | Blue-to-green gradient header accent | Standard modals, forms, info |
| `danger` | Red gradient header accent | Delete confirmations, destructive actions |

### Sizes

| Size | Max Width | Use Case |
|------|-----------|----------|
| **sm** | 400px | Simple confirmations, alerts |
| **md** | 500px | **DEFAULT** - Standard forms, dialogs |
| **lg** | 700px | Complex forms, multi-section content |
| **xl** | 900px | Large forms, detailed views |

### Structure

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Delete Class"
  size="sm"
  footer={
    <>
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>Are you sure you want to delete this class? This action cannot be undone.</p>
</Modal>
```

**Rendered output:**
```
┌──────────────────────────────────────────┐
│  [Overlay - semi-transparent dark bg]   │
│                                          │
│    ┌─────────────────────────────┐      │
│    │ Delete Class           [X]  │      │ ← Title + Close button
│    ├─────────────────────────────┤      │
│    │ Are you sure you want to    │      │
│    │ delete this class? This     │      │ ← Body (children)
│    │ action cannot be undone.    │      │
│    ├─────────────────────────────┤      │
│    │         [Cancel] [Delete]   │      │ ← Footer with actions
│    └─────────────────────────────┘      │
└──────────────────────────────────────────┘
```

### Code Examples

```tsx
// Simple confirmation modal
<Modal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  title="Confirm Deletion"
  size="sm"
>
  <p className="text-gray-600 mb-6">
    Are you sure you want to delete this class? This action cannot be undone.
  </p>
  <div className="flex justify-end gap-3">
    <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>

// Form modal with footer
<Modal
  isOpen={showAddClassModal}
  onClose={handleClose}
  title="Add New Class"
  size="md"
  footer={
    <div className="flex justify-end gap-3">
      <Button variant="ghost" onClick={handleClose}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
        Add Class
      </Button>
    </div>
  }
>
  <RecurringClassForm onSubmit={handleSubmit} />
</Modal>

// Alert modal (no close on overlay click)
<Modal
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  title="Booking Failed"
  size="sm"
  closeOnOverlayClick={false}
>
  <p className="text-gray-600 mb-4">
    Unable to book class. Please check your gym credentials and try again.
  </p>
  <Button variant="primary" onClick={() => setShowAlert(false)} className="w-full">
    OK
  </Button>
</Modal>

// Book Now confirmation (from RecurringClassForm)
<Modal
  isOpen={showBookNowDialog}
  onClose={() => setShowBookNowDialog(false)}
  title="Book Now"
  size="md"
>
  <p className="text-gray-700 mb-6">
    Booking window is open for <strong>{classType}</strong> -{' '}
    <strong>{dayOfWeek} {classTime}</strong> @ <strong>{branch}</strong>.
    Would you like to book now?
  </p>
  <div className="flex justify-end gap-3">
    <Button variant="ghost" onClick={() => setShowBookNowDialog(false)}>
      No, Schedule for Later
    </Button>
    <Button variant="primary" onClick={handleBookNow} loading={isBooking}>
      Yes, Book Now
    </Button>
  </div>
</Modal>
```

### Behavior

**Opening:**
- Modal fades in (200ms)
- Focus traps inside modal
- Body scroll disabled
- Escape key closes modal (if `closeOnOverlayClick=true`)

**Closing:**
- Modal fades out (200ms)
- Focus returns to trigger element
- Body scroll re-enabled
- Overlay click closes modal (if `closeOnOverlayClick=true`)

### Accessibility

- ✅ `role="dialog"` on modal container
- ✅ `aria-modal="true"` to indicate modal state
- ✅ `aria-labelledby` pointing to title
- ✅ Focus trap (Tab cycles within modal)
- ✅ Escape key closes modal
- ✅ Focus returns to trigger element on close
- ✅ Body scroll locked when open

### Common Mistakes

❌ **DON'T nest modals:**
```tsx
// BAD - Nested modals create confusion
<Modal isOpen={showModal1}>
  <Modal isOpen={showModal2}>Content</Modal>
</Modal>
```

✅ **DO use single modal at a time:**
```tsx
// GOOD - Close first modal before opening second
<Modal isOpen={currentModal === 'delete'}>Delete content</Modal>
<Modal isOpen={currentModal === 'confirm'}>Confirm content</Modal>
```

❌ **DON'T forget to handle Escape key:**
```tsx
// BAD - No way to close modal with keyboard
<Modal isOpen={isOpen} onClose={() => {}}>
  Content
</Modal>
```

✅ **DO provide close handler:**
```tsx
// GOOD - Always provide onClose handler
<Modal isOpen={isOpen} onClose={handleClose}>
  Content
</Modal>
```

---

## Input

**File:** `components/ui/Input.tsx`

**Purpose:** Text input component with built-in label, error/success states, hint text, and icon support. Features a diagonal focus accent bar for v2 design consistency.

**When to use:**
- ✅ All text inputs (email, password, text, number, etc.)
- ✅ Search fields
- ✅ Form fields requiring validation feedback

**When NOT to use:**
- ❌ Dropdowns/selects (use Select component)
- ❌ Checkboxes (use Checkbox component)
- ❌ Large text areas (use native textarea with FormField wrapper)

### API

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string           // Label text above input
  error?: string           // Error message (shows red state)
  success?: string         // Success message (shows green state)
  hint?: string            // Helper text below input
  leftIcon?: React.ReactNode  // Icon on left side
  rightIcon?: React.ReactNode // Icon on right side
  showNativeValidation?: boolean // Default: false - Enable browser validation API
}
```

### Native Validation

The `showNativeValidation` prop integrates HTML5 browser validation with the component's styling:

```tsx
// Enable native validation (captures browser validation messages)
<Input
  label="Email"
  type="email"
  required
  showNativeValidation
/>
```

**How it works:**
- Captures native validation messages (e.g., "Please enter a valid email")
- Displays them using the component's error styling
- Tracks "touched" state to only show errors after user interaction
- Adds `touched` CSS class for additional styling hooks

### Code Examples

```tsx
// Basic input
<Input label="Email" type="email" placeholder="you@example.com" />

// With error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// With success state
<Input
  label="Username"
  value="johndoe"
  success="Username is available!"
/>

// With hint text
<Input
  label="Booking Window"
  type="number"
  hint="Hours before class that booking opens (typically 26)"
/>

// With icons
<Input
  label="Search"
  placeholder="Search classes..."
  leftIcon={<SearchIcon className="w-5 h-5" />}
/>
```

### Design Features

- **Focus Accent Bar:** On focus, a subtle gradient accent bar appears on the left edge
- **State Colors:** Error (red), Success (green), Default (blue focus ring)
- **Typography:** DM Sans for labels and input text
- **Accessible:** Proper ARIA attributes, label associations

### Accessibility

- ✅ Labels associated via `htmlFor` and auto-generated IDs
- ✅ `aria-invalid` set when error present
- ✅ `aria-describedby` links to error/hint text
- ✅ Focus ring visible for keyboard navigation


### Form Validation Patterns

**See also:** Section 18 in CLAUDE.md for complete implementation details.

The Input component is used with consistent validation patterns across all forms. Key patterns include:

1. **Email Validation (On Blur)** - Validate format after user leaves field, not on every keystroke
2. **Password Strength Meter** - 4-level visualization (Weak/Fair/Good/Strong) with requirements checklist
3. **Confirm Password Matching** - Real-time feedback with success state showing "Passwords match" + checkmark
4. **Form Reset Keys** - Use \`key={\`field-\${formKey}\`}\` pattern to reset touched state after submission
5. **Show/Hide Password** - Eye icon in \`rightIcon\` prop with aria-labels for accessibility

**Validation utilities:** \`lib/validation.ts\` provides shared \`validateEmail()\` and \`validatePassword()\` functions used consistently across client and server.

**Forms using these patterns:** Signup, Login, Reset Password, Profile, Gym Credentials, Recurring Classes

---

## Select

**File:** `components/ui/Select.tsx`

**Purpose:** Custom dropdown select with consistent styling, error states, and focus accent bar.

**When to use:**
- ✅ Choosing from predefined options
- ✅ Branch selection, day of week, timezone
- ✅ Any single-choice dropdown

**When NOT to use:**
- ❌ Multi-select (not supported yet)
- ❌ Autocomplete/search (use Input with datalist)

### API

```typescript
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}
```

### Code Examples

```tsx
// Basic select
<Select
  label="Branch"
  options={[
    { value: 'downtown', label: 'Downtown YMCA' },
    { value: 'woodfin', label: 'Woodfin YMCA' },
  ]}
/>

// With placeholder
<Select
  label="Day of Week"
  placeholder="Choose a day..."
  options={[
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    // ...
  ]}
/>

// With error
<Select
  label="Timezone"
  error="Please select a timezone"
  options={timezoneOptions}
/>

// With hint
<Select
  label="Class Type"
  hint="Select the type of fitness class"
  options={classTypes}
/>
```

### Design Features

- **Custom Arrow:** Replaced native dropdown arrow with SVG chevron
- **Focus Accent Bar:** Matches Input component styling
- **Consistent Height:** Same padding as Input for alignment

### Accessibility

- ✅ Native select element (works with screen readers)
- ✅ Label association
- ✅ `aria-invalid` and `aria-describedby` for errors

---

## Combobox

**File:** `components/ui/Combobox.tsx`

**Purpose:** Searchable select with optional custom entry support. Combines text input with filtered dropdown list. Used for class name selection with 97 YMCA classes.

### Props

```typescript
interface ComboboxProps {
  label?: string
  name: string
  value: string
  onChange: (value: string, isCustom: boolean) => void
  options: ComboboxOption[]   // { value: string; label: string }
  placeholder?: string        // Default: "Search..."
  hint?: string
  error?: string
  required?: boolean
  allowCustom?: boolean       // Default: false
  customLabel?: string        // Default: "Add custom class"
  filterFn?: (query: string, options: ComboboxOption[]) => ComboboxOption[]
  className?: string
  searchable?: boolean         // Default: true
}
```

### `searchable={false}` — fixed-list dropdown mode (added v2.36)

Use for short, fixed option lists (e.g. 7 YMCA branches) where typing-to-filter is noise and long labels need CSS truncation rather than horizontal overflow. Native `<select>` text doesn't ellipsize reliably at narrow viewports; this mode swaps to a custom read-only dropdown that does.

When `searchable={false}`:
- No search icon, `pl-4` left padding (instead of `pl-11`)
- Input is `readOnly` with `cursor-pointer` + `truncate`
- Click opens the full option list (no query filter)
- No custom-entry option (gated even if `allowCustom={true}`)
- No fuzzy auto-resolve on blur

```tsx
<Combobox
  label="Branch"
  name="branch"
  value={formData.branch}
  onChange={(val) => setFormData(prev => ({ ...prev, branch: val }))}
  options={branchOptions}
  placeholder="Select a branch"
  searchable={false}
  required
/>
```

### Usage

```tsx
<Combobox
  label="Class Name"
  name="class_type"
  value={formData.class_type}
  onChange={(val, isCustom) => {
    setFormData(prev => ({ ...prev, class_type: val }))
    setIsCustomClass(isCustom)
  }}
  options={classOptions}
  filterFn={filterClasses}
  allowCustom
  customLabel="Add custom class"
  placeholder="Search classes..."
  hint="Search by name or browse the list"
  required
/>
```

### Features

- **Fuzzy search:** Filters options as user types via `filterFn` prop
- **Auto-resolve on blur:** Single exact match auto-selects with pulse animation; ambiguous matches show warning hint
- **Custom entry:** When `allowCustom` is true, shows "Add custom class" option at bottom of dropdown
- **Keyboard navigation:** Arrow keys, Enter to select, Escape to close
- **Accessibility:** `role="combobox"`, `aria-expanded`, `aria-activedescendant`, screen reader announcements

---

## TimeInput

**File:** `components/ui/TimeInput.tsx`

**Purpose:** User-friendly time picker with 12-hour format display, hour/minute dropdowns, and AM/PM toggle. Stores values in 24-hour format internally.

**When to use:**
- ✅ Class time selection
- ✅ Any time input where 12-hour format is preferred
- ✅ When native browser time inputs are too inconsistent

**When NOT to use:**
- ❌ Date/time combined (use separate date and time inputs)
- ❌ Duration input (use number input with units)

### API

```typescript
interface TimeInputProps {
  label?: string
  error?: string
  hint?: string
  value?: string          // HH:MM format (24-hour, e.g., "16:30")
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  name?: string           // For form submission
}
```

### Code Examples

```tsx
// Basic usage
<TimeInput
  label="Time"
  value={formData.class_time}
  onChange={(value) => setFormData(prev => ({ ...prev, class_time: value }))}
/>

// With error
<TimeInput
  label="Start Time"
  value={startTime}
  onChange={setStartTime}
  error="Please select a valid time"
/>

// With hint
<TimeInput
  label="Class Time"
  value={classTime}
  onChange={setClassTime}
  hint="When the class starts"
/>

// Disabled state
<TimeInput
  label="Time"
  value="09:00"
  disabled
/>

// In a form with name (for hidden input submission)
<TimeInput
  label="Time"
  name="class_time"
  value={formData.class_time}
  onChange={handleTimeChange}
  required
/>
```

### Design Features

- **12-Hour Display:** Hour (1-12), minute (00-55 in 5-min increments), AM/PM toggle
- **24-Hour Storage:** Converts to/from 24-hour format for database compatibility
- **Clock Icon:** Visual indicator on the left
- **AM/PM Toggle:** Button group with active state highlighting
- **Consistent Styling:** Matches Select component appearance (borders, focus states)

### Behavior

- **Hour dropdown:** 1-12
- **Minute dropdown:** 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
- **AM/PM toggle:** Clickable buttons, active state shows primary color
- **Hidden input:** When `name` prop provided, renders hidden input for form submission

### Accessibility

- ✅ Keyboard accessible (Tab through dropdowns and toggle)
- ✅ ARIA labels on each control ("Hour", "Minute", "AM", "PM")
- ✅ `aria-pressed` on AM/PM toggle buttons
- ✅ Focus rings on all interactive elements

---

## Checkbox

**File:** `components/ui/Checkbox.tsx`

**Purpose:** Custom styled checkbox with label, description, and error support. Features gradient checked state.

**When to use:**
- ✅ Boolean toggles (active/inactive)
- ✅ Terms acceptance
- ✅ Multiple selection lists

**When NOT to use:**
- ❌ Mutually exclusive options (use radio buttons)
- ❌ On/off switches (consider toggle component)

### API

```typescript
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string           // Primary label text
  description?: string     // Secondary description below label
  error?: string           // Error message
}
```

### Code Examples

```tsx
// Basic checkbox
<Checkbox label="Active" checked={isActive} onChange={handleChange} />

// With description
<Checkbox
  label="Skip Next Occurrence"
  description="Skip the next scheduled booking for this class"
/>

// With error
<Checkbox
  label="I agree to the terms"
  error="You must accept the terms to continue"
/>

// Controlled
<Checkbox
  label="Enable notifications"
  checked={notificationsEnabled}
  onChange={(e) => setNotificationsEnabled(e.target.checked)}
/>
```

### Design Features

- **Gradient Checked State:** Uses `bg-gradient-primary` when checked
- **Custom Checkmark:** White SVG checkmark appears on checked
- **Peer Styling:** Uses Tailwind peer classes for state management
- **Touch Friendly:** 20x20px checkbox, larger click area via label

### Accessibility

- ✅ Native checkbox input (hidden but functional)
- ✅ Clickable label
- ✅ Focus ring visible
- ✅ `aria-invalid` and `aria-describedby` for errors

---

## DropdownMenu

**File:** `components/ui/DropdownMenu.tsx`

**Purpose:** Action menu that appears on click, typically attached to a "more" button. Updated with v2 design styling.

**When to use:**
- ✅ Additional actions on cards (edit, delete, copy)
- ✅ User menu in navigation
- ✅ Context menus

**When NOT to use:**
- ❌ Form selection (use Select component)
- ❌ Navigation (use proper nav links)

### API

```typescript
interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface DropdownMenuProps {
  items: (DropdownMenuItem | 'divider')[]
  children: React.ReactNode  // Trigger element
  align?: 'left' | 'right'   // Menu alignment (default: 'right')
  className?: string
}
```

### Code Examples

```tsx
// Basic dropdown
<DropdownMenu
  items={[
    { label: 'Edit', icon: <EditIcon />, onClick: handleEdit },
    { label: 'Copy', icon: <CopyIcon />, onClick: handleCopy },
    'divider',
    { label: 'Delete', icon: <TrashIcon />, onClick: handleDelete, variant: 'danger' },
  ]}
>
  <Button variant="ghost" size="sm">
    <MoreIcon className="w-5 h-5" />
  </Button>
</DropdownMenu>

// Left-aligned
<DropdownMenu items={items} align="left">
  <Button>Actions</Button>
</DropdownMenu>
```

### Design Features (v2)

- **Rounded Container:** `rounded-xl` with subtle shadow
- **Hover States:** Gray background on default, rose on danger
- **Animation:** Fade-in-up animation on open
- **Typography:** DM Sans with medium weight

### Accessibility

- ✅ Closes on outside click
- ✅ Closes on Escape key
- ✅ Disabled items visually indicated
- ✅ Focus management on open/close

---

## Tabs

**File:** `components/ui/Tabs.tsx`

**Purpose:** Tab navigation for switching between content panels. Features diagonal active underline for v2 design.

**When to use:**
- ✅ Switching between related content views
- ✅ Settings pages with sections
- ✅ Dashboard tabs

**When NOT to use:**
- ❌ Primary navigation (use proper nav)
- ❌ Wizard/stepper flows

### API

```typescript
interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string        // Initial active tab ID
  onChange?: (tabId: string) => void
  className?: string
  children?: React.ReactNode // TabPanel components
}

interface TabPanelProps {
  tabId: string              // Must match tab ID
  activeTab: string          // Passed automatically by Tabs
  children: React.ReactNode
  className?: string
}
```

### Code Examples

```tsx
// Basic tabs
<Tabs
  tabs={[
    { id: 'schedule', label: 'Schedule' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ]}
  defaultTab="schedule"
  onChange={(id) => console.log('Tab changed:', id)}
>
  <TabPanel tabId="schedule" activeTab="">
    <ScheduleContent />
  </TabPanel>
  <TabPanel tabId="history" activeTab="">
    <HistoryContent />
  </TabPanel>
  <TabPanel tabId="settings" activeTab="">
    <SettingsContent />
  </TabPanel>
</Tabs>

// With icons
<Tabs
  tabs={[
    { id: 'classes', label: 'Classes', icon: <CalendarIcon /> },
    { id: 'stats', label: 'Stats', icon: <ChartIcon /> },
  ]}
/>

// With disabled tab
<Tabs
  tabs={[
    { id: 'active', label: 'Active' },
    { id: 'premium', label: 'Premium', disabled: true },
  ]}
/>
```

### Design Features (v2)

- **Diagonal Active Indicator:** Gradient underline with parallelogram clip-path
- **Typography:** DM Sans, medium weight
- **Transitions:** Color transition on hover/active
- **Animation:** TabPanel uses `animate-fade-in-up`

### Accessibility

- ✅ `role="tablist"` on tab container
- ✅ `role="tab"` with `aria-selected` on each tab
- ✅ `role="tabpanel"` with `aria-labelledby` on panels
- ✅ Keyboard navigation (Tab, Enter)

---

## Alert

**File:** `components/ui/Alert.tsx`

**Purpose:** Inline alert messages for form-level feedback, validation errors, and success confirmations. Features diagonal accent bar matching the design system.

**When to use:**
- ✅ Form validation errors (at form level, not field level)
- ✅ Success confirmations (form submitted, saved)
- ✅ Warning messages (password will be changed)
- ✅ Informational notices (email verification needed)

**When NOT to use:**
- ❌ Field-level validation (use Input `error` prop)
- ❌ Temporary notifications (use Toast instead)
- ❌ System-level alerts (use Toast or Modal)

### API

```typescript
interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info'
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'success' \| 'error' \| 'warning' \| 'info'` | **required** | Visual style and icon |
| children | `ReactNode` | **required** | Alert message content |
| onDismiss | `() => void` | - | Shows dismiss button when provided |
| className | `string` | `''` | Additional classes |

### Visual Design

Each variant includes:
- **Left accent bar** with diagonal clipPath
- **Variant-specific icon** (error exclamation, success check, etc.)
- **Variant-specific colors** matching design tokens

| Variant | Background | Border | Text | Accent |
|---------|-----------|--------|------|--------|
| error | `rose-50` | `rose-200` | `rose-700` | `#f43f5e` |
| success | `green-50` | `green-200` | `green-700` | `#00c853` |
| warning | `orange-50` | `orange-200` | `orange-700` | `#ff9500` |
| info | `blue-50` | `blue-200` | `blue-700` | `#1a6fff` |

### Usage Examples

**Error Alert:**
```tsx
import { Alert } from '@/components/ui'

{formError && (
  <Alert variant="error">{formError}</Alert>
)}
```

**Success Alert:**
```tsx
{isSubmitted && (
  <Alert variant="success">
    Your changes have been saved successfully.
  </Alert>
)}
```

**Dismissible Alert:**
```tsx
const [showWarning, setShowWarning] = useState(true)

{showWarning && (
  <Alert variant="warning" onDismiss={() => setShowWarning(false)}>
    Your password will be changed after confirmation.
  </Alert>
)}
```

### Accessibility

- Uses semantic HTML with proper color contrast
- Icon provides visual reinforcement of message type
- Dismiss button has proper aria-label

---

## Toast

**File:** `components/ui/Toast.tsx`

**Purpose:** Notification toast for feedback messages. Features diagonal accent bar and auto-dismiss.

**When to use:**
- ✅ Success confirmations (booking confirmed)
- ✅ Error notifications (booking failed)
- ✅ Warning messages
- ✅ Informational notices

**When NOT to use:**
- ❌ Form validation errors (use inline errors)
- ❌ Critical blocking alerts (use Modal)

### API

```typescript
type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant    // Default: 'info'
  duration?: number         // Auto-dismiss in ms (default: 5000, 0 = no auto-dismiss)
  onClose?: () => void
  isVisible?: boolean       // Control visibility externally
}
```

### Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| success | Green (#00c853) | Confirmations, completions |
| error | Red (#f43f5e) | Failures, errors |
| warning | Orange (#ff9500) | Warnings, attention needed |
| info | Blue (#1a6fff) | General information |

### Code Examples

```tsx
// Success toast
<Toast
  message="Class booked successfully!"
  variant="success"
  onClose={() => setShowToast(false)}
/>

// Error toast
<Toast
  message="Failed to save changes. Please try again."
  variant="error"
  duration={0}  // No auto-dismiss for errors
/>

// Warning toast
<Toast
  message="Your session will expire in 5 minutes."
  variant="warning"
/>

// Info toast with custom duration
<Toast
  message="New classes available for next week."
  variant="info"
  duration={8000}
/>
```

### Design Features (v2)

- **Diagonal Accent Bar:** Left-edge bar with gradient and subtle clip-path
- **Icons:** Each variant has a contextual icon
- **Animation:** Slide-in from right
- **Close Button:** Always visible for manual dismiss
- **Width:** 300-400px, doesn't obstruct content

### Accessibility

- ✅ `role="alert"` for screen readers
- ✅ Close button with aria-label
- ✅ Focus management
- ✅ Respects `prefers-reduced-motion`

---

## Skeleton

**File:** `components/ui/Skeleton.tsx`

**Purpose:** Loading placeholder with diagonal shimmer animation. Includes preset components for common patterns.

**When to use:**
- ✅ Loading states for cards, lists, content
- ✅ Placeholder while fetching data
- ✅ Progressive loading UX

**When NOT to use:**
- ❌ Instant content (no loading state needed)
- ❌ Full page loaders (use spinner or page-level loading)

### API

```typescript
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  className?: string
  lines?: number  // For text variant, number of lines
}
```

### Variants

| Variant | Default Size | Use Case |
|---------|--------------|----------|
| text | 100% x 16px | Text lines, titles |
| circular | 48x48px | Avatars, icons |
| rectangular | 100% x 120px | Images, buttons |
| card | 100% x 200px | Full card placeholders |

### Code Examples

```tsx
// Basic text skeleton
<Skeleton variant="text" />

// Multi-line text
<Skeleton variant="text" lines={3} />

// Avatar placeholder
<Skeleton variant="circular" width={48} height={48} />

// Custom sized rectangle
<Skeleton variant="rectangular" width="100%" height={200} />

// Using presets
<SkeletonCard />        // Full card with avatar, text, buttons
<SkeletonClassCard />   // Class card with diagonal corner
```

### Presets

**SkeletonCard:** General-purpose card loading state
```tsx
<SkeletonCard className="w-full" />
```
Includes: Avatar circle, title/subtitle lines, body text, action buttons

**SkeletonClassCard:** Class-specific loading state with diagonal corner
```tsx
<SkeletonClassCard className="w-full" />
```
Includes: Class name, badge, time/location, action buttons, diagonal clip-path

### Design Features (v2)

- **Diagonal Shimmer:** Uses `shimmer-diagonal` animation from globals.css
- **Consistent Roundings:** Matches component library (rounded-lg, rounded-xl)
- **Preset Components:** Pre-built for common patterns

### Code Example (List Loading)

```tsx
function ClassList({ isLoading, classes }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonClassCard />
        <SkeletonClassCard />
        <SkeletonClassCard />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {classes.map(c => <ClassCard key={c.id} {...c} />)}
    </div>
  )
}
```

---

## StatusIndicator

**File:** `components/ui/StatusIndicator.tsx`

**Purpose:** Specialized component for displaying booking status with colored dot, text, and optional tooltip.

**When to use:**
- ✅ Booking status in class cards
- ✅ Status column in tables
- ✅ Status summary in dashboard

**When NOT to use:**
- ❌ Generic labels (use Badge instead)
- ❌ Non-status information

### API

```typescript
interface StatusIndicatorProps {
  status: 'confirmed' | 'pending' | 'waitlisted' | 'failed' | 'skipped' | 'retrying'
  showLabel?: boolean // Default: true
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string // Optional tooltip text
  className?: string
}
```

### Visual Design

**Structure:**
```
[●] Confirmed    ← Colored dot + Label
```

**Dot + Label pairs:**
- Confirmed: 🟢 Green dot + "Confirmed"
- Pending: 🟡 Amber dot + "Pending"
- Waitlisted: 🔵 Blue dot + "Waitlisted"
- Failed: 🔴 Red dot + "Failed"
- Skipped: ⚪ Gray dot + "Skipped"
- Retrying: 🟡 Amber dot (pulsing) + "Retrying"

### Sizes

| Size | Dot Diameter | Font Size | Use Case |
|------|--------------|-----------|----------|
| **sm** | 6px | `text-xs` (12px) | Inline, compact displays |
| **md** | 8px | `text-sm` (14px) | **DEFAULT** - Most uses |
| **lg** | 10px | `text-base` (16px) | Prominent status display |

### Code Examples

```tsx
// Basic usage
<StatusIndicator status="confirmed" />

// Without label (dot only)
<StatusIndicator status="pending" showLabel={false} />

// With tooltip
<StatusIndicator
  status="failed"
  tooltip="Booking failed due to invalid credentials"
/>

// Different sizes
<StatusIndicator status="confirmed" size="sm" />
<StatusIndicator status="waitlisted" size="lg" />

// In context (class card)
<Card>
  <div className="flex justify-between items-center mb-2">
    <h3 className="font-bold text-lg">BODYPUMP</h3>
    <StatusIndicator status="confirmed" />
  </div>
  <p className="text-gray-600">Mon 4:15 PM • Downtown YMCA</p>
</Card>

// In table
<table>
  <tbody>
    <tr>
      <td>BODYPUMP</td>
      <td>Jan 6, 2025</td>
      <td><StatusIndicator status="confirmed" /></td>
    </tr>
  </tbody>
</table>
```

### Special States

#### Retrying (Pulsing Animation)
When status is "retrying", the dot should pulse to indicate activity:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-dot-retrying {
  animation: pulse 2s ease-in-out infinite;
}
```

### Accessibility

- ✅ Color is not the only indicator (includes text label)
- ✅ Sufficient color contrast
- ✅ Tooltip provides additional context if needed
- ✅ `aria-label` for screen readers when `showLabel={false}`

### Common Mistakes

❌ **DON'T use for non-status information:**
```tsx
// BAD - Using StatusIndicator for class type
<StatusIndicator status="yoga" /> // Not a booking status!
```

✅ **DO use Badge for non-status labels:**
```tsx
// GOOD - Use Badge for class type
<Badge variant="info">Yoga</Badge>
```

---

## StatCard

**File:** `components/ui/StatCard.tsx`

**Purpose:** Dashboard widget for displaying key metrics and statistics.

**When to use:**
- ✅ Dashboard overview stats
- ✅ Summary metrics
- ✅ KPI displays

**When NOT to use:**
- ❌ Detailed content (use Card instead)
- ❌ Forms or interactive content

### API

```typescript
interface StatCardProps {
  label: string // Descriptive label (e.g., "Classes This Week")
  value: string | number // The main stat value (e.g., "12")
  icon?: React.ReactNode // Optional icon
  trend?: {
    value: number // Percentage change (e.g., 12.5)
    direction: 'up' | 'down' | 'neutral'
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  onClick?: () => void // Optional click handler for interactivity
}
```

### Visual Design

```
┌─────────────────────────────┐
│  📅 Classes This Week       │  ← Icon + Label (gray-600)
│                             │
│  12                         │  ← Large value (text-3xl, bold)
│                             │
│  ↑ 20% from last week       │  ← Trend (optional, green/red)
└─────────────────────────────┘
```

### Variants

#### Default
```tsx
<StatCard label="Active Classes" value="8" />
```
- **Style:** White background, gray text, `card` shadow

#### Primary
```tsx
<StatCard label="Classes This Week" value="12" variant="primary" />
```
- **Style:** Subtle blue background (`primary-50`), blue accent

#### Success
```tsx
<StatCard label="Success Rate" value="98%" variant="success" />
```
- **Style:** Subtle green background (`success-50`), green accent

#### Warning
```tsx
<StatCard label="Action Items" value="3" variant="warning" />
```
- **Style:** Subtle yellow background (`warning-50`), yellow accent

#### Danger
```tsx
<StatCard label="Failed Bookings" value="2" variant="danger" />
```
- **Style:** Subtle red background (`danger-50`), red accent

### Code Examples

```tsx
// Basic stat card
<StatCard
  label="Active Classes"
  value="8"
  icon={<CalendarIcon className="w-6 h-6" />}
/>

// With trend
<StatCard
  label="Classes This Week"
  value="12"
  trend={{ value: 20, direction: 'up' }}
  variant="primary"
/>

// Success rate
<StatCard
  label="Success Rate"
  value="98%"
  trend={{ value: 2, direction: 'up' }}
  variant="success"
  icon={<CheckCircleIcon className="w-6 h-6" />}
/>

// Action items (clickable)
<StatCard
  label="Action Items"
  value="3"
  variant="warning"
  icon={<ExclamationIcon className="w-6 h-6" />}
  onClick={() => router.push('/dashboard/actions')}
/>

// Dashboard grid - mobile-first responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
  <StatCard
    label="Classes This Week"
    value="12"
    trend={{ value: 20, direction: 'up' }}
    variant="primary"
  />
  <StatCard
    label="Active Classes"
    value="8"
  />
  <StatCard
    label="Success Rate"
    value="98%"
    trend={{ value: 2, direction: 'up' }}
    variant="success"
  />
  <StatCard
    label="Action Items"
    value="3"
    variant="warning"
  />
</div>
```

### Trend Display

**Trend formatting:**
- **Up (positive):** Green arrow ↑ + percentage (e.g., "↑ 20% from last week")
- **Down (negative):** Red arrow ↓ + percentage (e.g., "↓ 5% from last week")
- **Neutral:** Gray dash — + percentage (e.g., "— 0% from last week")

**When to show:**
- Only show trend if it provides meaningful context
- Always include comparison period (e.g., "from last week")

### Accessibility

- ✅ Semantic HTML structure
- ✅ Keyboard accessible if clickable
- ✅ Focus indicator if interactive
- ✅ ARIA label for screen readers (includes full context)

### Common Mistakes

❌ **DON'T overload with information:**
```tsx
// BAD - Too much content for a stat card
<StatCard
  label="Classes"
  value="12"
>
  <p>Long description...</p>
  <ul><li>Item 1</li></ul>
</StatCard>
```

✅ **DO keep it simple and focused:**
```tsx
// GOOD - Single metric with optional trend
<StatCard
  label="Classes This Week"
  value="12"
  trend={{ value: 20, direction: 'up' }}
/>
```

---

## Divider

**File:** `components/ui/Divider.tsx`

**Purpose:** Visual separator for content sections. Supports multiple variants including an editorial style with centered label.

**When to use:**
- ✅ Separating major page sections
- ✅ Visual break between form sections
- ✅ Editorial layouts (with text label)

**When NOT to use:**
- ❌ Tight spacing (use CSS margin/padding instead)
- ❌ Table rows (use table-specific styling)

### API

```typescript
interface DividerProps {
  variant?: 'default' | 'gradient' | 'editorial'
  label?: string
  className?: string
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'gradient' \| 'editorial'` | `'default'` | Visual style |
| label | `string` | - | Text label (editorial variant) |
| className | `string` | `''` | Additional classes |

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard gray divider line |
| `gradient` | Primary-to-success gradient line with subtle glow |
| `editorial` | Centered text label with decorative gradient accent |

### Usage Examples

**Default Divider:**
```tsx
import { Divider } from '@/components/ui'

<Divider />
```

**Editorial Divider:**
```tsx
<Divider variant="editorial" className="my-8" />
```

---

## Header

**File:** `components/ui/Header.tsx`

**Purpose:** Production header component for dashboard pages with full navigation, user dropdown, and mobile menu.

**When to use:**
- ✅ Dashboard pages (via EditorialLayout)
- ✅ Protected/authenticated pages
- ✅ Pages requiring full navigation

**When NOT to use:**
- ❌ Auth pages (use AuthLayout's simplified header)
- ❌ Landing page (has custom hero header)
- ❌ Prototype pages (may use custom headers)

### API

```typescript
interface HeaderProps {
  className?: string
}
```

### Features

- **Logo/Brand:** Calendar icon + "My Workout Scheduler" linking to dashboard
- **Desktop Navigation:** Schedule link + user dropdown menu
- **User Dropdown:** Account, Credentials, Logout options
- **Mobile Menu:** Hamburger icon with slide-down navigation drawer
- **Diagonal Accent Bar:** Gradient bar at bottom (blue → green → purple)
- **Responsive:** Mobile-first design with md breakpoint

### Code Examples

```tsx
// Basic usage (typically via EditorialLayout)
import { Header } from '@/components/ui'

<Header />

// With custom class
<Header className="border-b-2" />
```

### Design Features (v2)

- **Background:** `bg-white/80 backdrop-blur-sm`
- **Height:** `h-14` mobile, `h-16` desktop
- **Accent Bar:** Gradient with diagonal clip-path at bottom
- **User Avatar:** Gradient circle with user icon
- **Typography:** Sora for brand, DM Sans for nav items

### Accessibility

- ✅ Keyboard navigation (Tab through links)
- ✅ ESC closes dropdowns
- ✅ Click outside closes menus
- ✅ Focus management on menu open/close
- ✅ `aria-label` for mobile menu button

---

## Footer

**File:** `components/ui/Footer.tsx`

**Purpose:** Standard two-row footer for all pages — actionable support + personal-site links on top, copyright signature on bottom.

**When to use:**
- ✅ All front-end pages (dashboard, auth, landing, admin)
- ✅ Any page requiring the product's canonical footer

### API

```typescript
interface FooterProps {
  className?: string
  style?: React.CSSProperties
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | `string` | `''` | Additional CSS classes |
| style | `CSSProperties` | - | Inline styles (useful for animations) |

> **v2.36 breaking change:** the `showTagline` prop was removed along with the generic "Made for gym enthusiasts who value their time" tagline. The footer is now factual (support + attribution), not positioning — factual footers serve both voice registers (showcase + coach) without feeling off in either. See `docs/VOICE.md` for the voice rationale.

### Content

```
help@beerock.com · brockbusby.com           <- actionable row (text-sm gray-500)
© 2026 Beerock                               <- signature row (text-xs gray-400)
```

- **Row 1 — actionable facts.** Mailto link to `help@beerock.com` (the monitored inbox per VOICE.md) and external link to `brockbusby.com` (the owner's fractional site). Middot separator. Both links wrap via `flex-wrap` at very narrow viewports.
- **Row 2 — closing signature.** Unchanged from earlier versions — copyright text with a subtle `beerock.com` link on "Beerock".

### Code Examples

```tsx
import { Footer } from '@/components/ui'

// Standard usage
<Footer />

// With animation (e.g., in AuthLayout)
<Footer
  className="opacity-0 animate-fade-in-up"
  style={{ animationDelay: '0.2s' }}
/>
```

### Design Features

- **Border:** Top border `border-t border-gray-200/50`
- **Padding:** `py-6` with max-width container
- **Typography:** DM Sans, centered text
- **Tagline:** `text-sm text-gray-500`
- **Copyright:** `text-xs text-gray-400`
- **Position:** `mt-auto` for flex layouts (sticks to bottom)

### Accessibility

- ✅ Semantic `<footer>` element
- ✅ Sufficient color contrast for text
- ✅ No interactive elements require focus management

---

## NextClassCard

**File:** `components/NextClassCard.tsx`

**Purpose:** Featured dark gradient card displaying the user's next scheduled class with booking status. Hero component on dashboard.

**When to use:**
- ✅ Dashboard homepage to show upcoming class
- ✅ Schedule page header

**When NOT to use:**
- ❌ Listing multiple classes (use class list components)
- ❌ Historical bookings (use booking history components)

### API

```typescript
interface NextClassCardProps {
  className?: string        // Additional CSS classes
  dayTime: string          // e.g., "Saturday 9:30 AM"
  classType: string        // e.g., "BODYPUMP"
  branch: string           // e.g., "Woodfin YMCA"
  hoursUntil: number       // Hours until class starts
  bookingStatus?: 'confirmed' | 'waitlisted' | 'pending'  // Default: 'pending'
  bookingOpensAt?: string | null  // v2.36: pre-formatted opens-at timestamp for pending pre-window state
  onViewSchedule?: () => void  // Callback for "View" link (desktop only)
}
```

> **v2.36 pending-state split.** `bookingStatus='pending'` now renders two coach-voice Working-on-it variants depending on whether `bookingOpensAt` is provided:
> - **Pre-window** (`bookingOpensAt` is a string): shows **"On deck / Opens Tue 6:00 AM"** — the booking window hasn't opened yet; the system is waiting to fire.
> - **Post-window retry** (`bookingOpensAt` is null/undefined): shows **"Watching / Checking every 15 min"** — the window is open and the retry loop is actively running.
>
> Both `/dashboard` and `/dashboard/schedule` must pass `bookingOpensAt` or the card defaults to the post-window retry copy for pending classes that haven't actually hit their window yet. Computed server-side via `getDashboardStats` from a 7-day confirmed-attempt lookback.

### Usage

```tsx
import NextClassCard from '@/components/NextClassCard'

// Confirmed booking
<NextClassCard
  dayTime="Saturday 9:30 AM"
  classType="BODYPUMP"
  branch="Woodfin YMCA"
  hoursUntil={23}
  bookingStatus="confirmed"
/>

// Waitlisted
<NextClassCard
  dayTime="Monday 6:00 PM"
  classType="Cycle"
  branch="Downtown YMCA"
  hoursUntil={48}
  bookingStatus="waitlisted"
/>

// Pending (not yet booked)
<NextClassCard
  dayTime="Wednesday 4:15 PM"
  classType="Yoga Flow"
  branch="Asheville YMCA"
  hoursUntil={72}
  bookingStatus="pending"
/>
```

### Booking Status States

| Status | Background | Display |
|--------|------------|---------|
| `confirmed` | Green tint (`bg-success-500/20`) | ✓ Booked • in X hrs |
| `waitlisted` | Amber tint (`bg-warning-500/20`) | ⏳ Waitlist • in X hrs |
| `pending` | Dark glass (`bg-slate-950/50`) | X DAYS until class |

### Visual Features

- **Dark gradient background** with diagonal clip-path
- **Glass morphism** status modules with ring borders
- **Pulsing indicator** on "Next Class" label
- **Category emoji** based on class type (💪 strength, 🚴 cycling, 🧘 yoga, etc.)
- **Responsive layout**: Stacked on mobile, side-by-side on desktop

### Countdown Logic

**Tiered precision model** (matches human time perception):

| Time Range | Display | Example | Rationale |
|------------|---------|---------|-----------|
| `< 1 hour` | "Now" | "Now" | Urgency |
| `1-47 hours` | Hours | "40 hrs" | Precise planning window |
| `≥ 48 hours` | Days (rounded) | "4 days" | Calendar-based thinking |

**Key UX decisions:**
- **48-hour threshold**: Under 48 hours, people think in hours; over 48, they think in days
- **Math.round for days**: 88 hours → 4 days (not 3), matching user intuition of counting calendar days
- **Day name provides context**: "40 hrs" paired with "Wednesday 4:15 PM" is immediately clear

---

## SuccessRateCard

**File:** `components/SuccessRateCard.tsx`

**Purpose:** Hero stat card with prominent semi-circular gauge visualization displaying the all-time booking success rate. Dominates the dashboard stats grid.

**When to use:**
- ✅ Dashboard homepage as hero stat
- ✅ Stats overview pages

**When NOT to use:**
- ❌ Inline stats (use StatCard instead)
- ❌ Multiple success metrics side-by-side

### API

```typescript
interface SuccessRateCardProps {
  successRate: number          // 0-100 percentage
  totalAttempts?: number       // Total booking attempts for context
  animationDelay?: string      // CSS animation delay (default: '0.1s')
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| successRate | `number` | **required** | Percentage 0-100 |
| totalAttempts | `number` | - | Integrates into subtitle: "of X bookings confirmed" |
| animationDelay | `string` | `'0.1s'` | Animation delay for staggered fade-in |

### Usage

```tsx
import SuccessRateCard from '@/components/SuccessRateCard'

// Basic usage
<SuccessRateCard successRate={95} />

// With total context
<SuccessRateCard
  successRate={95}
  totalAttempts={150}
  animationDelay="0.1s"
/>
```

### Visual Features

- **Large percentage display** - Hero element on all screens
- **Contextual subtitle** - "of X bookings confirmed" integrates sample size with stat
- **Semi-circular gauge** - Animated arc visualization (hidden on mobile)
- **Legend row** - Confirmed/Waitlisted/Failed indicators (hidden on mobile)
- **Gradient glow** - Subtle success-500 glow effect behind gauge
- **Hover interaction** - Slight lift on hover

### Success Rate Calculation (v2.22)

The success rate reflects **all-time system reliability**:

**Formula:**
```
Success Rate = (confirmed + waitlisted) / (confirmed + waitlisted + failed) × 100
```

**Scope:**
- **All classes** - Includes active AND inactive class booking history
- **All-time** - No time window limit (not just 30 days)
- **Excludes skipped** - User choice, not system failure
- **Excludes pending** - Not finalized attempts

**Rationale:** This builds user trust by showing true lifetime system reliability. Deactivating a class doesn't remove its successful bookings from the calculation.

### Responsive Design

| Breakpoint | Gauge Size | Legend | Subtitle |
|------------|------------|--------|----------|
| Mobile (< 640px) | Hidden | Hidden | "of X bookings confirmed" |
| Tablet (640px+) | 144px | Visible | "of X bookings confirmed" |
| Desktop (1024px+) | 240px | Visible | "of X bookings confirmed" |

### Accessibility

- ✅ Semantic HTML structure
- ✅ Animation respects `prefers-reduced-motion`
- ✅ Color not sole indicator (percentage text always visible)
- ✅ Sufficient color contrast

---

## Usage Guidelines

### General Best Practices

1. **Always use components from `components/ui/`**
   - Never create inline UI with Tailwind classes
   - Check component library before creating new components

2. **Follow design tokens**
   - Use colors from `tailwind.config.ts` (never arbitrary hex values)
   - Use spacing scale (4, 6, 8, 12, 16, 24, 32)
   - Use typography scale (text-sm, text-base, text-lg, etc.)

3. **Maintain consistency**
   - Use same variant names across components
   - Use same size scale (sm, md, lg)
   - Use same prop patterns

4. **Prioritize accessibility**
   - Always provide labels and ARIA attributes
   - Test with keyboard navigation
   - Ensure color contrast meets WCAG AA

5. **Use frontend-design skill**
   - For new UI/UX work, use `/frontend-design` skill
   - Ensures production-grade, polished designs
   - Avoids generic AI aesthetics

### Component Selection Guide

**Need a clickable element?**
- ✅ Use `Button` for actions
- ✅ Use `Link` for navigation

**Need a container?**
- ✅ Use `Card` for grouped content
- ✅ Use semantic HTML (`<section>`, `<article>`) for page structure

**Need a status indicator?**
- ✅ Use `StatusIndicator` for booking status
- ✅ Use `Badge` for generic labels/tags

**Need a form input?**
- ✅ Always wrap in `FormField`
- ✅ Match `htmlFor` and `id`

**Need a dialog?**
- ✅ Use `Modal` for overlays
- ✅ Provide `onClose` handler

**Need a dashboard stat?**
- ✅ Use `StatCard` for metrics
- ✅ Include trend if meaningful

### Testing Checklist

Before shipping a component:

- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Works on mobile (≥320px width)
- [ ] Touch targets ≥44px on mobile
- [ ] Screen reader announces correctly
- [ ] Respects `prefers-reduced-motion`

---

## Version History

**v2.28 (January 11, 2026):**
- **Button:** Added `ghost-primary` variant for subtle primary emphasis
- Total: 20 components documented

**v2.22 (January 6, 2026):**
- **Button:** Added 3 new variants (`outline-primary`, `outline-danger`, `purple`)
- **Badge:** Added `diagonal` prop (default: true) and `purple` variant
- **Input:** Added `showNativeValidation` prop for browser validation API
- **Modal:** Added `variant` prop (`default` | `danger`) for header accent styling
- **Divider:** Replaced `subtle` variant with `gradient` variant
- Synchronized with DESIGN_SYSTEM.md v2.22
- Total: 20 components documented

**v2.19 (January 6, 2026):**
- Added full SuccessRateCard documentation with API, usage, and calculation logic
- Documented new `totalAttempts` prop for showing booking count context
- Added to Table of Contents under Feature Components
- Total: 20 components documented

**v2.18 (January 6, 2026):**
- Updated NextClassCard countdown logic documentation
- New tiered precision model: hours until 48h, then days
- Changed from Math.floor to Math.round for day calculation (matches user intuition)
- Added UX rationale for countdown thresholds

**v2.16 (January 2, 2026):**
- Added Header component (`components/ui/Header.tsx`) - production header with nav, user dropdown, mobile menu
- Added Footer component (`components/ui/Footer.tsx`) - standard footer with copyright and tagline
- Footer applied to all front-end pages (dashboard, auth, landing, prototypes)
- Header extracted from EditorialLayout for reusability
- Component prototype page updated with new component showcases (Button, Badge, Alert, StatusIndicator, StatCard, Divider, Footer)
- Total: 19 components documented

**v2.15 (January 2, 2026):**
- Updated StatCard grid example with mobile-first responsive classes (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- Documented mobile-first responsive patterns
- Updated responsive gap sizing (`gap-4 sm:gap-5`)
- Added `overflow-x-hidden` requirement for layout containers (prevents mobile horizontal scroll)
- Updated SuccessRateCard adaptive sizes: Tablet 144px, Desktop 240px gauge

**v2.14 (January 1, 2026):**
- Added 8 new Design System v2 components: Input, Select, Checkbox, DropdownMenu (v2), Tabs, Toast, Skeleton
- Updated Table of Contents with categorized component list
- Total: 15 components documented
- All form components (Input, Select, Checkbox) include focus accent bar styling
- Added Skeleton presets (SkeletonCard, SkeletonClassCard)
- Updated DropdownMenu with v2 styling notes

**v2.13 (December 29, 2025):**
- Initial component library documentation
- Documented 7 core components (Button, Card, Badge, FormField, Modal, StatusIndicator, StatCard)
- Established consistent API patterns
- Defined accessibility requirements for all components

---

## References

- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Tailwind Config:** `tailwind.config.ts`
- **CLAUDE.md Section 13:** Design System rules
- **PRD Section 3.5:** UX/UI requirements
