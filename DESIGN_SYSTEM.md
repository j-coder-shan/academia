# Academia LMS Design System Documentation

## Overview
This document outlines the comprehensive design system extracted from the Student Dashboard screenshot and implemented across the Academia LMS SPA. The design system ensures visual consistency, maintainability, and scalability across all components and pages.

## Color Palette

### Primary Colors
- **Primary Blue**: `#667eea` - Main brand color, used for primary actions and highlights
- **Primary Blue Dark**: `#5a6fd8` - Hover states and emphasized elements
- **Primary Blue Light**: `#8fa4f3` - Light accents and subtle highlights
- **Secondary Purple**: `#764ba2` - Complementary color for gradients and secondary elements

### Sidebar & Navigation
- **Sidebar Background**: `#2c3e50` to `#34495e` (gradient)
- **Sidebar Text**: `rgba(255, 255, 255, 0.8)` - Default navigation text
- **Sidebar Text Active**: `#ffffff` - Active/hover navigation text
- **Sidebar Hover Background**: `rgba(255, 255, 255, 0.1)`
- **Sidebar Active Background**: `rgba(102, 126, 234, 0.2)`
- **Sidebar Border Active**: `#667eea` - Left border for active items

### Content Areas
- **Content Background**: `#f5f6fa` - Main content area background
- **Content Background Alt**: `#ffffff` - Cards and elevated surfaces
- **Header Background**: `#ffffff` - Header bar background
- **Header Shadow**: `0 2px 10px rgba(0, 0, 0, 0.08)`

### Card System
- **Card Background**: `#ffffff`
- **Card Border**: `rgba(0, 0, 0, 0.06)` - Subtle borders
- **Card Shadow**: `0 4px 20px rgba(0, 0, 0, 0.08)` - Default elevation
- **Card Shadow Hover**: `0 8px 30px rgba(0, 0, 0, 0.12)` - Elevated state

### Stat Card Icons
- **Enrolled Courses**: `#667eea` (Primary Blue)
- **Pending Assignments**: `#feca57` (Warning Yellow)
- **Completed Assignments**: `#10ac84` (Success Green)
- **Average Grade**: `#17a2b8` (Info Teal)

### Status & Feedback Colors
- **Success**: `#10ac84` with background `rgba(16, 172, 132, 0.1)`
- **Warning**: `#feca57` with background `rgba(254, 202, 87, 0.1)`
- **Error**: `#ff6b6b` with background `rgba(255, 107, 107, 0.1)`
- **Info**: `#17a2b8` with background `rgba(23, 162, 184, 0.1)`

### Text Colors
- **Primary Text**: `#2f3542` - Main content text
- **Secondary Text**: `#7f8c8d` - Supporting text
- **Muted Text**: `#bdc3c7` - Subtle text and labels
- **White Text**: `#ffffff`
- **Light Text**: `rgba(255, 255, 255, 0.8)` - Sidebar text

## Typography

### Font Family
- **Primary**: `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### Font Sizes
- **Extra Small**: `0.75rem` (12px) - Labels, badges
- **Small**: `0.875rem` (14px) - Supporting text
- **Base**: `1rem` (16px) - Body text
- **Large**: `1.125rem` (18px) - Subheadings
- **Extra Large**: `1.25rem` (20px) - Card titles
- **2X Large**: `1.5rem` (24px) - Section titles
- **3X Large**: `1.875rem` (30px) - Page headers
- **4X Large**: `2.25rem` (36px) - Main headings

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

### Line Heights
- **Tight**: 1.25 - Headings
- **Normal**: 1.5 - Body text
- **Relaxed**: 1.75 - Long content

## Layout & Spacing

### Layout Dimensions
- **Sidebar Width**: 280px
- **Header Height**: 70px
- **Content Padding**: 30px
- **Card Padding**: 24px
- **Stat Card Padding**: 20px

### Spacing Scale
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 20px
- **2XL**: 24px
- **3XL**: 32px
- **4XL**: 40px
- **5XL**: 48px

### Border Radius
- **Small**: 6px - Small elements, badges
- **Medium**: 8px - Buttons, inputs
- **Large**: 12px - Cards, panels
- **XL**: 16px - Large components
- **Round**: 50% - Circular elements

## Component Styles

### Cards
```css
.card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-large);
    box-shadow: var(--shadow-sm);
    transition: var(--transition-normal);
}

.card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}
```

### Stat Cards
```css
.stat-card {
    background: var(--card-bg);
    border-radius: var(--radius-large);
    padding: var(--stat-card-padding);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--card-border);
}

.stat-card-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-large);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    color: var(--text-white);
}
```

### Buttons
```css
.btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--button-padding);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-medium);
    transition: var(--transition-fast);
}

.btn-primary {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

.btn-primary:hover {
    background: var(--btn-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}
```

### Navigation
```css
.nav-link {
    display: flex;
    align-items: center;
    padding: var(--space-lg) var(--space-2xl);
    color: var(--sidebar-text);
    border-left: 3px solid transparent;
    transition: var(--transition-fast);
}

.nav-link:hover {
    background: var(--sidebar-hover-bg);
    color: var(--sidebar-text-active);
    border-left-color: var(--sidebar-border-active);
}

.nav-link.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-text-active);
    border-left-color: var(--sidebar-border-active);
}
```

## Shadow System
- **XS**: `0 1px 2px rgba(0, 0, 0, 0.05)` - Minimal elevation
- **SM**: `0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)` - Cards
- **MD**: `0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)` - Hover states
- **LG**: `0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)` - Elevated cards
- **XL**: `0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)` - Modals
- **2XL**: `0 25px 50px rgba(0, 0, 0, 0.25)` - Overlays

## Animations & Transitions
- **Fast**: `all 0.15s ease` - Quick interactions
- **Normal**: `all 0.3s ease` - Standard transitions
- **Slow**: `all 0.5s ease` - Dramatic changes
- **Bounce**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` - Interactive feedback

## Responsive Breakpoints
- **Mobile**: max-width: 768px
- **Tablet**: max-width: 1024px
- **Desktop**: 1024px and above

## Usage Guidelines

### Implementation
1. Import `style.css` before `dashboard.css` in all HTML files
2. Use CSS custom properties (variables) for consistent theming
3. Apply utility classes for common patterns
4. Follow the established naming conventions

### Class Naming Convention
- **Components**: `.component-name` (e.g., `.stat-card`, `.nav-link`)
- **Modifiers**: `.component-name.modifier` (e.g., `.btn.btn-primary`)
- **Utilities**: `.utility-name` (e.g., `.flex`, `.gap-lg`, `.text-primary`)

### Component Structure
```html
<div class="stat-card">
    <div class="stat-card-header">
        <div class="stat-card-title">Title</div>
        <div class="stat-card-icon enrolled">
            <i class="fas fa-icon"></i>
        </div>
    </div>
    <div class="stat-card-value">Value</div>
    <div class="stat-card-label">Label</div>
</div>
```

## Utility Classes

### Layout
- `.flex`, `.flex-col`, `.grid`
- `.items-center`, `.justify-between`, `.justify-center`
- `.w-full`, `.h-full`, `.min-h-screen`

### Spacing
- `.p-{size}`, `.m-{size}`, `.gap-{size}`
- `.mb-{size}`, `.mt-{size}`, `.ml-{size}`, `.mr-{size}`

### Colors
- `.text-primary`, `.text-secondary`, `.text-muted`
- `.bg-white`, `.bg-gray`, `.bg-primary`

### Interactive States
- `.hover:shadow-md`, `.hover:scale-105`
- `.focus:outline-none`, `.focus:ring`

This design system ensures consistent visual language across all components while maintaining flexibility for future enhancements and variations.
