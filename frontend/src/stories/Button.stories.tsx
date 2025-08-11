/**
 * Button Component Stories
 * Storybook stories for the Button component
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button, ButtonGroup, IconButton, ToggleButton } from '@/components/ui/Button'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A comprehensive button component with multiple variants, sizes, and states for the RegTech compliance platform.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'warning'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'xl', 'icon'],
      description: 'The size of the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether the button should take full width',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the button is in loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Basic Button Stories
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different visual variants of the button component.',
      },
    },
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different sizes of the button component.',
      },
    },
  },
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button 
        leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
      >
        Add Item
      </Button>
      <Button 
        variant="outline"
        rightIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        }
      >
        Next
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with left and right icons.',
      },
    },
  },
}

export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Loading</Button>
      <Button variant="outline" loading>Loading</Button>
      <Button variant="secondary" loading>Loading</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons in loading state with spinner.',
      },
    },
  },
}

export const States: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different states of the button component.',
      },
    },
  },
}

export const FullWidth: Story = {
  render: () => (
    <div className="w-64">
      <Button fullWidth>Full Width Button</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button that takes the full width of its container.',
      },
    },
  },
}

// Button Group Stories
export const ButtonGroupHorizontal: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Center</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Horizontal button group with connected buttons.',
      },
    },
  },
}

export const ButtonGroupVertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Vertical button group with connected buttons.',
      },
    },
  },
}

// Icon Button Stories
export const IconButtons: Story = {
  render: () => (
    <div className="flex gap-4">
      <IconButton
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }
        aria-label="Add"
      />
      <IconButton
        variant="outline"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
        aria-label="Close"
      />
      <IconButton
        variant="ghost"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        }
        aria-label="Settings"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons for actions that don\'t need text labels.',
      },
    },
  },
}

// Toggle Button Stories
export const ToggleButtons: Story = {
  render: () => {
    const [pressed1, setPressed1] = React.useState(false)
    const [pressed2, setPressed2] = React.useState(true)
    
    return (
      <div className="flex gap-4">
        <ToggleButton 
          pressed={pressed1} 
          onPressedChange={setPressed1}
        >
          Toggle Me
        </ToggleButton>
        <ToggleButton 
          pressed={pressed2} 
          onPressedChange={setPressed2}
        >
          Initially On
        </ToggleButton>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle buttons that can be pressed and unpressed.',
      },
    },
  },
}

// Compliance-specific Button Examples
export const ComplianceActions: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button variant="success">Approve Compliance</Button>
        <Button variant="warning">Flag for Review</Button>
        <Button variant="destructive">Reject</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline">Generate Report</Button>
        <Button variant="secondary">Export Data</Button>
        <Button variant="ghost">View Details</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button variants commonly used in compliance workflows.',
      },
    },
  },
}

export const RegulatoryActions: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button 
          variant="default"
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Create Policy
        </Button>
        <Button 
          variant="outline"
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        >
          Review Changes
        </Button>
        <Button 
          variant="secondary"
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          Schedule Audit
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button examples for regulatory and compliance actions.',
      },
    },
  },
}
