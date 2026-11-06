---
name: LPU Hostel Portal
description: Warm, paper-like academic design system for university residence management
colors:
  brand: "#F26522"
  primary: "#C2410C"
  primary-hover: "#9A3412"
  ink: "#1A1A1A"
  text: "#252525"
  text-muted: "#5C5750"
  bg: "#F7F5F0"
  surface: "#FFFFFF"
  border: "#E8E4DC"
  border-strong: "#CFC8BB"
  focus: "#F26522"
  status-success: "#1E6B3A"
  status-success-bg: "#E7F2EA"
  status-pending: "#8A5A00"
  status-pending-bg: "#FBF1DC"
  status-waitlisted: "#5C5750"
  status-waitlisted-bg: "#EFECE5"
  status-danger: "#A4161A"
  status-danger-bg: "#FBE9E8"
typography:
  display:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Source Sans 3, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Source Sans 3, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: LPU Hostel Portal

## Overview

**Creative North Star: "The University Registrar"**

A warm, paper-like, academic interface grounded in institutional credibility, legible documentation, and restrained authority. Think of a prestigious university registrar's office rather than a generic tech SaaS tool. The canvas is ivory paper (`#F7F5F0`), content rests on crisp white surfaces (`#FFFFFF`), text is charcoal ink (`#252525`), and a single verified university orange accent is deployed with deliberate discipline.

The visual language communicates permanence, truth, and administrative clarity. There are no electric blues, purple gradients, glassmorphism blur effects, or floating cartoon illustrations. Restraint and architectural density replace decorative noise.

**Key Characteristics:**
- **Academic Warmth:** Ivory document ground paired with deep charcoal ink and rich university orange.
- **Structural Integrity:** Precision 1px borders and subtle tonal shifts take precedence over soft drop shadows.
- **Serif Dignity:** Editorial serif headlines (`Source Serif 4`) anchor pages with authoritative scholarship.
- **Tabular Precision:** Monospace and tabular numerals ensure financial fee tables and room allocations align impeccably.

## Colors

The palette is derived directly from the official Lovely Professional University seal (orange and black circular insignia), calibrated for high contrast and calm readability.

### Primary
- **University Brand Orange** (`#F26522`): Derived from the central sunburst of the official LPU seal. Reserved strictly for header branding rules, focus outlines, and decisive visual anchors. Never used for small body copy.
- **Deep Terracotta Primary** (`#C2410C`): The accessible, high-contrast action color for buttons, links, and active indicators. Yields a 5.2:1 contrast ratio against white.
- **Terracotta Hover** (`#9A3412`): Darkened shade for hover and pressed states.

### Neutral
- **Official Ink Black** (`#1A1A1A`): LPU black for top masthead bar, footer canvas, and table header typography.
- **Charcoal Text** (`#252525`): Primary high-legibility body color.
- **Muted Stone Text** (`#5C5750`): Secondary metadata, captions, and helper labels (WCAG AA compliant on ivory).
- **Ivory Paper Background** (`#F7F5F0`): Global page background establishing warmth and document authenticity.
- **White Paper Surface** (`#FFFFFF`): Elevated container ground for cards, tables, panels, and modal dialogues.
- **Subtle Divider Border** (`#E8E4DC`): 1px structural hair-lines and card boundaries.
- **Strong Structural Border** (`#CFC8BB`): Input field boundaries, active hover states, and table perimeters.

### Status Tones
- **Allocated / Confirmed:** Deep Forest Green (`#1E6B3A`) on Tinted Mint (`#E7F2EA`).
- **Pending / Action Needed:** Warm Ochre (`#8A5A00`) on Cream Amber (`#FBF1DC`).
- **Waitlisted / Neutral:** Stone Charcoal (`#5C5750`) on Soft Parchment (`#EFECE5`).
- **Rejected / Prohibited Contraband:** Rich Crimson (`#A4161A`) on Light Blush (`#FBE9E8`).

### Named Rules
**The Ten-Percent Rule.** University brand orange (`#F26522`) and primary terracotta (`#C2410C`) must occupy no more than 10% of any viewport. If a screen looks orange, the visual hierarchy has collapsed.

**The Dual-Encoding Status Rule.** Status states must never be conveyed by color alone. Every badge, alert, and indicator must pair its color with an explicit text label or unambiguous semantic icon.

## Typography

**Display & Heading Font:** Source Serif 4 (600 Semi-Bold). Evokes classical academic gravitas and official publication standards.  
**Body, Form & Interface Font:** Source Sans 3 (400 Regular, 500 Medium, 600 Semi-Bold). Crisp, neutral, and readable across all device densities.  
**Tabular Numeral Rule:** All financial fees, electricity quotas (kWh), room numbers, and academic CGPA metrics must enforce `font-variant-numeric: tabular-nums` to guarantee aligned columns.

### Hierarchy
- **Display / H1** (Source Serif 4, Semi-Bold 600, 32px / 2rem, Line-Height 1.25): Exactly one per page. Page title.
- **Headline / H2** (Source Serif 4, Semi-Bold 600, 24px / 1.5rem, Line-Height 1.25): Major section dividing headers.
- **Title / H3** (Source Serif 4, Semi-Bold 600, 20px / 1.25rem, Line-Height 1.3): Card headers, modal titles, block dividers.
- **Body** (Source Sans 3, Regular 400 / Medium 500, 16px / 1rem, Line-Height 1.5): Standard paragraphs, descriptions, descriptions. Line length capped at 65–75ch for optimal reading.
- **Label / Small** (Source Sans 3, Semi-Bold 600, 12px / 0.75rem, Letter-Spacing 0.05em, Uppercase): Category tags, table column labels, section eyebrows.

### Named Rules
**The Single-H1 Rule.** Each route contains exactly one `<h1>` element communicating the document's primary operational purpose.

## Layout

The spatial model uses an 8px modular baseline grid with a maximum content container of 1200px.

- **Masthead Top Bar:** Fixed or sticky top bar bathed in `--ink` (`#1A1A1A`) with a crisp 3px `--brand` orange rule along the bottom edge. Houses university insignia and profile controls.
- **Spatial Rhythm:**
  - Compact: 4px (`--space-xs`) / 8px (`--space-sm`)
  - Standard: 16px (`--space-md`) / 24px (`--space-lg`)
  - Macro: 32px (`--space-xl`) / 48px
- **Responsive Breakpoints:** 360px (mobile compact), 768px (tablet portrait), 1024px (tablet landscape), 1280px (standard desktop).
- **Density:** High information density. Generous padding is reserved for section breathing room, but data views (tables, rosters) remain tight, functional, and scan-friendly.

## Elevation & Depth

This system is strictly border-defined and flat-at-rest. It rejects floating blur shadows, drop shadows on cards, and neumorphism.

- **Depth by Tonal Layering:** Depth is established by placing white surfaces (`#FFFFFF`) over the ivory paper ground (`#F7F5F0`), framed by crisp 1px borders (`#E8E4DC`).
- **Sole Permitted Shadow:** A subtle structural shadow (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06)`) is permitted exclusively on floating dropdown menus, tooltips, and modal overlays.
- **Resting Cards:** `box-shadow: none; border: 1px solid var(--border);`

### Named Rules
**The Zero-Float Rule.** Surfaces never float or cast heavy shadows at rest. Elevation is demonstrated strictly by border contrast and subtle 1px state shifts.

## Shapes

Form geometry is disciplined and architectural, reflecting campus stone and classical masonry.

- **Corner Radii:**
  - Base Inputs & Buttons: 4px (`--radius-md`)
  - Data Tables: 2px (`--radius-sm`)
  - Cards & Containers: 4px–6px (`--radius-lg`)
  - Maximum Cap: Nothing exceeds 6px except pill status badges (`--radius-full`).
- **Borders:** Continuous 1px solid boundaries (`#E8E4DC` default, `#CFC8BB` interactive focus/hover).

### Named Rules
**The Anti-Pill Rule.** Interactive buttons, text inputs, and content cards must never use circular pill shapes. Rectilinear geometry with subtle 4px corner softening is the unbroken standard.

## Components

### Buttons
- **Primary Button:** Solid `--primary` terracotta (`#C2410C`) background, white text, 4px border radius, 10px 20px padding. Hover shifts to `--primary-hover` (`#9A3412`). Maximum one primary action per view.
- **Secondary Button:** White paper surface (`#FFFFFF`), charcoal text (`#252525`), 1px `--border-strong` (`#CFC8BB`). Hover shifts background to `#FAF8F3`.
- **Destructive Button:** White paper surface, crimson text (`#A4161A`), 1px `#FCA5A5` border.
- **Focus State:** 2px outline in `--brand` (`#F26522`) with 2px offset.

### Data Tables
- **Surface:** White ground with 1px perimeter border.
- **Header Row:** Tonal parchment (`#F1EEE7`), uppercase `--ink` bold text, 12px font size.
- **Row Styling:** 1px horizontal dividers (`#E8E4DC`), zebra striping off, row hover tint (`#FAF8F3`).
- **Numerics:** Right-aligned with tabular numerals.
- **Mobile Behavior:** Horizontal scroll with sticky first column.

### Stat Blocks & Cards
- **Structure:** Crisp white rectangular box with thin border.
- **Metrics:** High-contrast number (2rem bold) paired with muted label above or below.
- **Prohibitions:** No icons-in-circles, no decorative background gradients, no fake sparklines.

### Roommate Matching Cards
- **Compatibility Display:** Clear percentage text accompanied by a simple geometric horizontal bar (`--primary` fill on `--border` track).
- **Factors Summary:** Matched lifestyle dimensions presented as a concise bullet list rather than an unstructured cloud of colorful badges.

### Alerts & Banners
- **Styling:** Left 3px solid indicator border, tinted background corresponding to the status table, charcoal body text.

### Status Badges
- **Styling:** Micro-text (12px, font-weight 600), 2px–4px radius, tinted background with matching dark status ink.

## Do's and Don'ts

### Do:
- **Do** sample and verify the exact orange hue (`#F26522`) from the official circular LPU logo.
- **Do** use Source Serif 4 for headings to establish credible university atmosphere.
- **Do** format all currency (₹), room numbers, and dates with `tabular-nums`.
- **Do** maintain a strict 2px high-visibility focus ring (`#F26522`) for complete keyboard accessibility.
- **Do** keep page background warm ivory (`#F7F5F0`) and content containers clean white (`#FFFFFF`).

### Don't:
- **Don't** introduce blue, cyan, purple, or neon accents anywhere in the UI.
- **Don't** use decorative background gradients, glassmorphism, or backdrop blur effects.
- **Don't** use emojis as primary interface navigation or status icons.
- **Don't** use pill-shaped buttons or oversized 16px+ border radii on standard cards.
- **Don't** recolor or distort the official LPU seal; present it faithfully on black or white.
