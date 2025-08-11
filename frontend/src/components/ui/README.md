# RegTech Design System

A comprehensive design system built specifically for regulatory technology and compliance platforms. This design system provides a consistent, accessible, and scalable foundation for building modern RegTech applications.

## 🎯 Overview

The RegTech Design System is built with:
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for utility-first styling
- **Class Variance Authority (CVA)** for component variants
- **Accessibility-first** approach with ARIA support
- **Regulatory compliance** specific components and patterns

## 🚀 Quick Start

```tsx
import { Button, Card, Badge, ComplianceBadge } from '@/components/ui'

function MyComponent() {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3>Compliance Status</h3>
        <ComplianceBadge status="compliant" />
      </div>
      <Button variant="success">Approve</Button>
    </Card>
  )
}
```

## 📦 Components

### Core Components

#### Button
Versatile button component with multiple variants and states.

```tsx
<Button variant="default" size="lg" loading>
  Submit Application
</Button>

<ButtonGroup>
  <Button variant="outline">Cancel</Button>
  <Button variant="default">Save</Button>
  <Button variant="success">Approve</Button>
</ButtonGroup>
```

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`
**Sizes:** `sm`, `default`, `lg`, `xl`, `icon`

#### Card
Flexible container component for organizing content.

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Risk Assessment</CardTitle>
    <CardDescription>Current risk evaluation</CardDescription>
  </CardHeader>
  <CardContent>
    <StatCard
      title="Risk Score"
      value="7.2/10"
      change={{ value: 0.5, type: 'decrease' }}
    />
  </CardContent>
</Card>
```

**Variants:** `default`, `elevated`, `outlined`, `filled`, `success`, `warning`, `error`, `info`

#### Input
Comprehensive input components with validation states.

```tsx
<Input
  label="Document Reference"
  placeholder="Enter reference number"
  error="Invalid format"
  required
/>

<SearchInput
  placeholder="Search regulations..."
  onSearch={handleSearch}
/>

<PasswordInput
  label="Password"
  showToggle
/>
```

#### Badge
Status indicators and labels with semantic meaning.

```tsx
<Badge variant="success">Active</Badge>
<ComplianceBadge status="compliant" />
<RiskBadge level="medium" />
<PriorityBadge priority="urgent" />
```

#### Table
Data tables with sorting, filtering, and pagination.

```tsx
<DataTable
  data={complianceData}
  columns={[
    { key: 'name', title: 'Document', sortable: true },
    { 
      key: 'status', 
      title: 'Status',
      render: (value) => <ComplianceBadge status={value} />
    }
  ]}
  pagination={{
    current: 1,
    pageSize: 10,
    total: 100,
    onChange: handlePageChange
  }}
/>
```

#### Modal
Accessible modal dialogs with focus management.

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="lg"
>
  <p>Are you sure you want to approve this compliance item?</p>
  <ModalFooter>
    <Button variant="outline" onClick={handleClose}>Cancel</Button>
    <Button variant="success" onClick={handleApprove}>Approve</Button>
  </ModalFooter>
</Modal>
```

### Specialized Components

#### Compliance Components
Purpose-built components for regulatory compliance workflows.

```tsx
<ComplianceBadge status="non-compliant" />
<RiskBadge level="high" />
<PriorityBadge priority="urgent" />

<AlertCard
  type="warning"
  title="Compliance Review Required"
  description="This document requires immediate attention."
  dismissible
/>
```

#### Loading Components
Various loading states and skeleton screens.

```tsx
<LoadingSpinner size="lg" />
<LoadingDots />
<LoadingSkeleton lines={3} />
<LoadingOverlay visible={loading} text="Processing...">
  <YourContent />
</LoadingOverlay>
```

#### Toast Notifications
Non-intrusive notification system.

```tsx
const { toast } = useToastContext()

toast.success('Compliance check completed')
toast.error('Validation failed', 'Please check the required fields')
toast.warning('Review deadline approaching')
```

## 🎨 Design Tokens

### Colors

#### Brand Colors
- Primary: Blue scale for primary actions and branding
- Success: Green scale for positive states and approvals
- Warning: Amber scale for caution and pending states
- Error: Red scale for errors and rejections

#### Semantic Colors
- **Compliant**: Green tones for approved/compliant states
- **Non-compliant**: Red tones for violations and rejections
- **Partially-compliant**: Amber tones for partial compliance
- **Pending**: Gray tones for pending reviews
- **Overdue**: Dark red for overdue items

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (code)
- **Font Sizes**: xs (12px) to 6xl (60px)
- **Font Weights**: normal (400) to bold (700)

### Spacing
Consistent spacing scale from 0.125rem to 24rem using Tailwind's spacing system.

### Shadows
Subtle shadow system for depth and hierarchy:
- `sm`: Subtle shadow for cards
- `md`: Medium shadow for elevated elements
- `lg`: Large shadow for modals and overlays

## 🔧 Customization

### Extending Components

```tsx
import { Button, buttonVariants } from '@/components/ui'
import { cn } from '@/lib/utils'

const CustomButton = ({ className, ...props }) => {
  return (
    <Button
      className={cn(
        buttonVariants({ variant: 'default' }),
        'custom-styles',
        className
      )}
      {...props}
    />
  )
}
```

### Theme Customization

Update `tailwind.config.js` to customize the design system:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          // Your custom brand colors
        }
      }
    }
  }
}
```

## ♿ Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Semantic HTML**: Proper HTML structure and landmarks

## 📱 Responsive Design

Components are built mobile-first with responsive breakpoints:

- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up
- `2xl`: 1536px and up

## 🧪 Testing

Components include comprehensive test coverage:

```bash
npm run test              # Run unit tests
npm run test:coverage     # Generate coverage report
npm run test:e2e         # Run end-to-end tests
```

## 📚 Storybook

Interactive component documentation:

```bash
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build static Storybook
```

## 🔄 Migration Guide

### From v1.x to v2.x

1. Update import paths:
```tsx
// Old
import { Button } from '@/components/Button'

// New
import { Button } from '@/components/ui'
```

2. Update prop names:
```tsx
// Old
<Button type="primary" />

// New
<Button variant="default" />
```

## 🤝 Contributing

1. Follow the established patterns and conventions
2. Include comprehensive tests for new components
3. Update Storybook documentation
4. Ensure accessibility compliance
5. Test across different screen sizes and devices

## 📄 License

This design system is part of the RegTech platform and follows the project's licensing terms.

---

For more detailed documentation and examples, visit the [Storybook documentation](http://localhost:6006) or check the component source files.
