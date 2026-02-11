import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Plus, ArrowRight, Download01, Trash01, Link01 } from '@untitledui/icons'

const meta = {
  title: 'Base/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'tertiary',
        'link-gray',
        'link-color',
        'primary-destructive',
        'secondary-destructive',
        'tertiary-destructive',
        'link-destructive',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    isDisabled: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    showTextWhileLoading: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    children: 'Button',
    color: 'primary',
    size: 'sm',
  },
}

// ─── Color Variants ─────────────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    children: 'Primary',
    color: 'primary',
    size: 'md',
  },
}

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    color: 'secondary',
    size: 'md',
  },
}

export const Tertiary: Story = {
  args: {
    children: 'Tertiary',
    color: 'tertiary',
    size: 'md',
  },
}

export const LinkGray: Story = {
  args: {
    children: 'Link gray',
    color: 'link-gray',
    size: 'md',
  },
}

export const LinkColor: Story = {
  args: {
    children: 'Link color',
    color: 'link-color',
    size: 'md',
  },
}

export const PrimaryDestructive: Story = {
  args: {
    children: 'Delete',
    color: 'primary-destructive',
    size: 'md',
  },
}

export const SecondaryDestructive: Story = {
  args: {
    children: 'Delete',
    color: 'secondary-destructive',
    size: 'md',
  },
}

export const TertiaryDestructive: Story = {
  args: {
    children: 'Delete',
    color: 'tertiary-destructive',
    size: 'md',
  },
}

export const LinkDestructive: Story = {
  args: {
    children: 'Delete',
    color: 'link-destructive',
    size: 'md',
  },
}

// ─── All Colors Overview ────────────────────────────────────────────────────

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button color="primary" size="md">Primary</Button>
      <Button color="secondary" size="md">Secondary</Button>
      <Button color="tertiary" size="md">Tertiary</Button>
      <Button color="link-gray" size="md">Link gray</Button>
      <Button color="link-color" size="md">Link color</Button>
      <Button color="primary-destructive" size="md">Destructive</Button>
      <Button color="secondary-destructive" size="md">Destructive 2nd</Button>
      <Button color="tertiary-destructive" size="md">Destructive 3rd</Button>
      <Button color="link-destructive" size="md">Link destructive</Button>
    </div>
  ),
}

// ─── Sizes ──────────────────────────────────────────────────────────────────

export const SizeSmall: Story = {
  args: {
    children: 'Small',
    color: 'primary',
    size: 'sm',
  },
}

export const SizeMedium: Story = {
  args: {
    children: 'Medium',
    color: 'primary',
    size: 'md',
  },
}

export const SizeLarge: Story = {
  args: {
    children: 'Large',
    color: 'primary',
    size: 'lg',
  },
}

export const SizeXL: Story = {
  args: {
    children: 'Extra Large',
    color: 'primary',
    size: 'xl',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button color="primary" size="sm">Small</Button>
      <Button color="primary" size="md">Medium</Button>
      <Button color="primary" size="lg">Large</Button>
      <Button color="primary" size="xl">Extra Large</Button>
    </div>
  ),
}

// ─── States ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    color: 'primary',
    size: 'md',
    isDisabled: true,
  },
}

export const Loading: Story = {
  args: {
    children: 'Loading',
    color: 'primary',
    size: 'md',
    isLoading: true,
  },
}

export const LoadingWithText: Story = {
  args: {
    children: 'Saving...',
    color: 'primary',
    size: 'md',
    isLoading: true,
    showTextWhileLoading: true,
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm text-tertiary">Default</span>
        <Button color="primary" size="md">Button</Button>
        <Button color="secondary" size="md">Button</Button>
        <Button color="tertiary" size="md">Button</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm text-tertiary">Disabled</span>
        <Button color="primary" size="md" isDisabled>Button</Button>
        <Button color="secondary" size="md" isDisabled>Button</Button>
        <Button color="tertiary" size="md" isDisabled>Button</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm text-tertiary">Loading</span>
        <Button color="primary" size="md" isLoading>Button</Button>
        <Button color="secondary" size="md" isLoading>Button</Button>
        <Button color="tertiary" size="md" isLoading>Button</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 text-sm text-tertiary">Loading + text</span>
        <Button color="primary" size="md" isLoading showTextWhileLoading>Saving</Button>
        <Button color="secondary" size="md" isLoading showTextWhileLoading>Saving</Button>
        <Button color="tertiary" size="md" isLoading showTextWhileLoading>Saving</Button>
      </div>
    </div>
  ),
}

// ─── Icon Variations ────────────────────────────────────────────────────────

export const WithLeadingIcon: Story = {
  args: {
    children: 'Add item',
    color: 'primary',
    size: 'md',
    iconLeading: Plus,
  },
}

export const WithTrailingIcon: Story = {
  args: {
    children: 'Continue',
    color: 'primary',
    size: 'md',
    iconTrailing: ArrowRight,
  },
}

export const WithBothIcons: Story = {
  args: {
    children: 'Download',
    color: 'secondary',
    size: 'md',
    iconLeading: Download01,
    iconTrailing: ArrowRight,
  },
}

export const IconOnly: Story = {
  args: {
    color: 'primary',
    size: 'md',
    iconLeading: Plus,
    'aria-label': 'Add item',
  },
}

export const DestructiveWithIcon: Story = {
  args: {
    children: 'Delete project',
    color: 'primary-destructive',
    size: 'md',
    iconLeading: Trash01,
  },
}

export const IconVariations: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-28 text-sm text-tertiary">Leading icon</span>
        <Button color="primary" size="md" iconLeading={Plus}>Add item</Button>
        <Button color="secondary" size="md" iconLeading={Download01}>Download</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-sm text-tertiary">Trailing icon</span>
        <Button color="primary" size="md" iconTrailing={ArrowRight}>Continue</Button>
        <Button color="link-color" size="md" iconTrailing={ArrowRight}>Learn more</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-sm text-tertiary">Both icons</span>
        <Button color="secondary" size="md" iconLeading={Download01} iconTrailing={ArrowRight}>Download</Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-sm text-tertiary">Icon only</span>
        <Button color="primary" size="sm" iconLeading={Plus} aria-label="Add" />
        <Button color="primary" size="md" iconLeading={Plus} aria-label="Add" />
        <Button color="primary" size="lg" iconLeading={Plus} aria-label="Add" />
        <Button color="primary" size="xl" iconLeading={Plus} aria-label="Add" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 text-sm text-tertiary">Destructive</span>
        <Button color="primary-destructive" size="md" iconLeading={Trash01}>Delete</Button>
        <Button color="secondary-destructive" size="md" iconLeading={Trash01}>Delete</Button>
        <Button color="tertiary-destructive" size="md" iconLeading={Trash01}>Delete</Button>
      </div>
    </div>
  ),
}

// ─── Link Button ────────────────────────────────────────────────────────────

export const AsLink: Story = {
  args: {
    children: 'Visit website',
    color: 'link-color',
    size: 'md',
    href: 'https://example.com',
    iconTrailing: Link01,
  },
}
