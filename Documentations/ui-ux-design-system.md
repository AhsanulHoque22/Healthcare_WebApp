# Healthcare UI/UX Design System

## Design Philosophy
The healthcare application follows a **clean, professional, and accessible design** approach prioritizing:
- **User Safety**: Clear visual hierarchy and error prevention
- **Accessibility**: WCAG 2.1 AA compliance
- **Trust**: Professional medical aesthetics
- **Efficiency**: Streamlined workflows for healthcare professionals

## Color Palette

### Primary Colors
```css
/* Blue Gradient - Primary Brand */
--primary-blue-50: #eff6ff
--primary-blue-100: #dbeafe
--primary-blue-500: #3b82f6
--primary-blue-600: #2563eb
--primary-blue-700: #1d4ed8

/* Indigo - Secondary */
--indigo-500: #6366f1
--indigo-600: #4f46e5
--indigo-700: #4338ca
```

### Semantic Colors
```css
/* Success - Medical Positive */
--success-50: #f0fdf4
--success-500: #22c55e
--success-600: #16a34a

/* Warning - Caution */
--warning-50: #fffbeb
--warning-500: #f59e0b
--warning-600: #d97706

/* Error - Critical */
--error-50: #fef2f2
--error-500: #ef4444
--error-600: #dc2626

/* Info - Informational */
--info-50: #f0f9ff
--info-500: #06b6d4
--info-600: #0891b2
```

### Neutral Colors
```css
/* Gray Scale */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db
--gray-500: #6b7280
--gray-700: #374151
--gray-900: #111827
```

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Scale
```css
/* Headings */
--text-4xl: 2.25rem; /* 36px - Page Titles */
--text-3xl: 1.875rem; /* 30px - Section Headers */
--text-2xl: 1.5rem; /* 24px - Card Titles */
--text-xl: 1.25rem; /* 20px - Subsections */
--text-lg: 1.125rem; /* 18px - Large Body */

/* Body Text */
--text-base: 1rem; /* 16px - Default Body */
--text-sm: 0.875rem; /* 14px - Small Text */
--text-xs: 0.75rem; /* 12px - Captions */
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

## Spacing System

### Spacing Scale (Tailwind-based)
```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
```

## Component Library

### 1. Navigation Components

#### Sidebar Navigation
```css
.sidebar {
  width: 288px; /* 72 when collapsed */
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
  border-right: 1px solid #e5e7eb;
  transition: all 0.5s ease-in-out;
}

.sidebar-header {
  height: 80px;
  background: linear-gradient(to right, #2563eb, #4f46e5);
  padding: 1.5rem;
}

.nav-item {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  margin: 0.125rem 0;
}

.nav-item:hover {
  background-color: var(--primary-blue-50);
  transform: scale(1.01);
}

.nav-item.active {
  background-color: var(--primary-blue-50);
  color: var(--primary-blue-700);
  border: 1px solid var(--primary-blue-200);
  transform: scale(1.02);
}
```

#### Top Navigation Bar
```css
.top-nav {
  height: 64px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: fixed;
  top: 0;
  z-index: 50;
  transition: all 0.3s ease;
}

.top-nav.scrolled {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

### 2. Card Components

#### Dashboard Cards
```css
.dashboard-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.dashboard-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem;
  padding: 1.5rem;
}
```

#### Appointment Cards
```css
.appointment-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border-left: 4px solid var(--primary-blue-500);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.appointment-card.status-completed {
  border-left-color: var(--success-500);
}

.appointment-card.status-cancelled {
  border-left-color: var(--error-500);
}
```

### 3. Form Components

#### Input Fields
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error {
  border-color: var(--error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

#### Buttons
```css
.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid #d1d5db;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}
```

## User Interface Layouts

### 1. Patient Dashboard Layout
```

```

### 2. Doctor Dashboard Layout
```

```

### 3. Admin Dashboard Layout
```

```

## Responsive Design Breakpoints

### Breakpoint System
```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### Mobile Adaptations
- **Sidebar**: Converts to overlay drawer
- **Cards**: Stack vertically with full width
- **Tables**: Horizontal scroll or card layout
- **Forms**: Single column layout
- **Navigation**: Hamburger menu with bottom tab bar

## Detailed Screen Mockups

### 1. Login Screen
```
```

### 2. Appointment Booking Screen
```

```

### 3. Prescription Interface (Doctor View)
```

```

## Accessibility Features

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for normal text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Text Scaling**: Support up to 200% zoom without horizontal scrolling

### Accessibility Implementation
```css
/* Focus Indicators */
.focus-visible {
  outline: 2px solid var(--primary-blue-500);
  outline-offset: 2px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .card {
    border: 2px solid var(--gray-900);
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Interactive States

### Button States
```css
.button {
  /* Default state */
  opacity: 1;
  transform: translateY(0);
}

.button:hover {
  /* Hover state */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button:active {
  /* Active state */
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.button:disabled {
  /* Disabled state */
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

### Loading States
```css
.loading-spinner {
  border: 2px solid #f3f4f6;
  border-top: 2px solid var(--primary-blue-500);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```
