---
name: Industrial Precision Management
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5d3f3d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#926e6c'
  outline-variant: '#e7bcba'
  surface-tint: '#bf0023'
  primary: '#ae001f'
  on-primary: '#ffffff'
  primary-container: '#db052b'
  on-primary-container: '#ffeceb'
  inverse-primary: '#ffb3af'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#545555'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d6d6d'
  on-tertiary-container: '#f1f0f0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3af'
  on-primary-fixed: '#410006'
  on-primary-fixed-variant: '#930019'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for the high-intensity environment of automotive logistics and inventory management. The brand personality is authoritative, reliable, and utilitarian, mirroring the precision of the mechanical components it tracks. It employs a **Corporate / Modern** aesthetic with industrial undertones—clean lines, high-density information displays, and a rigid structural hierarchy. 

The target audience consists of warehouse managers and automotive technicians who require immediate clarity and "at-a-glance" data density. The UI avoids unnecessary decorative elements, focusing instead on functional performance, durability, and high legibility.

## Colors
The palette is grounded in an industrial grayscale to ensure the **Brand Red (#db052b)** remains highly impactful. Red is reserved strictly for primary actions (Add Stock, Confirm Order), critical low-stock alerts, and active status indicators. 

**Dark/Text (#1a1a1a)** is used for high-contrast typography and as a structural background for navigation sidebars to create a clear mental model of "system controls" versus "content area." **Medium and Muted Grays** are utilized for borders, secondary icons, and metadata to maintain a clean visual hierarchy without cluttering the interface.

## Typography
The system uses **Hanken Grotesk** for headlines to provide a modern, sharp, and contemporary feel. **Inter** is the primary workhorse for body text and forms, chosen for its exceptional legibility in data-heavy environments. 

For technical data—such as VIN numbers, Part IDs, and SKU codes—**JetBrains Mono** is employed. This monospaced font ensures that characters (like '0' and 'O') are easily distinguishable, reducing errors in high-stakes inventory environments. Labels for table headers and categories should be set in all-caps using the `label-caps` style for maximum structural clarity.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout prioritizes density, with a base 8px spatial scale that allows for compact data tables and efficient use of vertical space.

- **Sidebar:** Fixed width of 260px on desktop, collapsible to 64px (icon-only).
- **Content Area:** Flexible with a maximum container width of 1600px to prevent excessive line lengths on ultra-wide monitors.
- **Data Grids:** Use 12px horizontal padding within cells to maximize columns visible on one screen.
- **Margins:** 32px on desktop to provide breathing room against the sidebar; 16px on mobile for maximum utility.

## Elevation & Depth
To maintain an industrial, "flat-mechanical" feel, depth is created through **tonal layering** and **low-contrast outlines** rather than heavy shadows.

- **Level 0 (Background):** #f3f3f3.
- **Level 1 (Cards/Tables):** White (#ffffff) with a 1px solid border in #dbdbdb. No shadow.
- **Level 2 (Hover/Active):** White (#ffffff) with a 4px soft ambient shadow (Color: #1a1a1a, Opacity: 5%, Blur: 8px) to indicate interactivity.
- **Level 3 (Modals/Popovers):** White (#ffffff) with a 12px diffused shadow (Opacity: 10%) and a slightly thicker 2px border in #1a1a1a for focused tasks.

## Shapes
The shape language is **Soft (0.25rem)**. This slight rounding provides a professional, modern touch without losing the rigid, disciplined feel required for an industrial tool. 

- **Small elements (Checkboxes, Tags):** 2px radius.
- **Medium elements (Buttons, Inputs):** 4px radius.
- **Large elements (Cards, Modals):** 8px radius.
- **Search bars:** Fully rounded (pill) to distinguish them from structural data containers.

## Components
- **Buttons:** Primary buttons are Solid Brand Red with white text. Secondary buttons use a #1a1a1a border with Dark text. Ghost buttons use Medium Gray text for low-priority actions.
- **Input Fields:** Use 1px borders (#949494). On focus, the border changes to Brand Red with a 1px inner glow.
- **Data Tables:** High-density rows (32px-40px height). Zebra-striping in #f9f9f9 for readability. Column headers are `label-caps`.
- **Status Chips:** Use a "dot" indicator next to the text. (e.g., Red dot for 'Out of Stock', Green dot for 'In Stock').
- **Inventory Cards:** Images should be contained in a 1:1 aspect ratio square with a light gray fill to accommodate various part shapes.
- **Part ID Tags:** Styled using `data-mono` typography in a light gray pill to highlight technical identifiers.