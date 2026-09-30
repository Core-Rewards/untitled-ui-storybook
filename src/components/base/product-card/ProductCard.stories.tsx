import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProductCard } from './product-card'
import type { ProductType } from './product-card'

// ── Sample Data ───────────────────────────────────────────────────────────────

const sampleProduct: ProductType = {
  id: '1',
  name: 'Wireless Noise-Cancelling Headphones',
  href: '#',
  points: '131,000 points',
  imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
  imageAlt: 'Black wireless headphones on a white background',
}

const sampleProducts: ProductType[] = [
  {
    id: '1',
    name: 'Wireless Headphones',
    href: '#',
    points: '131,000 points',
    imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop',
    imageAlt: 'Black wireless headphones',
  },
  {
    id: '2',
    name: 'Leather Wallet',
    href: '#',
    points: '45,000 points',
    imageSrc: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop',
    imageAlt: 'Brown leather bifold wallet',
    badge: 'New',
    badgeColor: 'success',
  },
  {
    id: '3',
    name: 'Stainless Steel Watch',
    href: '#',
    points: '280,000 points',
    imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
    imageAlt: 'Silver stainless steel wristwatch',
    badge: 'Popular',
    badgeColor: 'brand',
  },
  {
    id: '4',
    name: 'Portable Bluetooth Speaker',
    href: '#',
    points: '62,000 points',
    imageSrc: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop',
    imageAlt: 'Portable Bluetooth speaker in black',
    badge: 'Sale',
    badgeColor: 'error',
  },
]

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Base/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    product: { control: 'object' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    product: sampleProduct,
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

// ─── With Badge ──────────────────────────────────────────────────────────────

export const WithBadge: Story = {
  args: {
    product: {
      ...sampleProduct,
      badge: 'New',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

// ─── Discounted ───────────────────────────────────────────────────────────────

export const Discounted: Story = {
  args: {
    product: {
      ...sampleProduct,
      points: '10,000 points',
      discountedPoints: '7,500 points',
      badge: 'Sale',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

// ─── Badge Variants Overview ──────────────────────────────────────────────────

export const BadgeVariants: Story = {
  render: () => (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-3 sm:grid-rows-1">
      <ProductCard product={{ ...sampleProduct, id: 'new', badge: 'New', badgeColor: 'success' }} />
      <ProductCard product={{ ...sampleProduct, id: 'popular', badge: 'Popular', badgeColor: 'brand' }} />
      <ProductCard product={{ ...sampleProduct, id: 'sale', badge: 'Sale', badgeColor: 'error' }} />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}

// ─── Grid Layout ─────────────────────────────────────────────────────────────

export const ProductGrid: Story = {
  render: () => (
    <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sampleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}

// ─── Narrow Width ─────────────────────────────────────────────────────────────

export const NarrowCard: Story = {
  args: {
    product: sampleProduct,
  },
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
}

// ─── Wide Card ────────────────────────────────────────────────────────────────

export const WideCard: Story = {
  args: {
    product: sampleProduct,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}
