import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ProductColor, ProductSize } from "./product-details";
import { ProductDetails } from "./product-details";

// ─── Sample Data ──────────────────────────────────────────────────────────────

const jacketColors: ProductColor[] = [
    { id: "charcoal", name: "Charcoal", value: "#4a4a4a" },
    { id: "black", name: "Black", value: "#1a1a1a" },
    { id: "olive", name: "Dark Olive", value: "#4a4a28" },
    { id: "brown", name: "Carhartt Brown", value: "#7a5230" },
];

const jacketSizes: ProductSize[] = [
    { id: "s", label: "S", inStock: true },
    { id: "m", label: "M", inStock: true },
    { id: "l", label: "L", inStock: true },
    { id: "xl", label: "XL", inStock: true },
    { id: "xxl", label: "2XL", inStock: false },
    { id: "xxxl", label: "3XL", inStock: false },
];

const driverFlexes: ProductSize[] = [
    { id: "stiff", label: "Stiff", inStock: true },
    { id: "regular", label: "Regular", inStock: true },
    { id: "senior", label: "Senior", inStock: false },
];

const driverVariants: ProductSize[] = [
    { id: "left-regular", label: "Left Hand — Regular — 10.5", description: "Standard flex ideal for moderate swing speeds of 75–90 mph.", inStock: true },
    { id: "left-stiff", label: "Left Hand — Stiff — 10.5", description: "Reduced torsion designed for faster swing speeds above 90 mph.", inStock: true },
    { id: "right-regular", label: "Right Hand — Regular — 10.5", description: "Standard flex ideal for moderate swing speeds of 75–90 mph.", inStock: true },
    { id: "right-stiff", label: "Right Hand — Stiff — 10.5", description: "Reduced torsion designed for faster swing speeds above 90 mph.", inStock: true },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/ProductDetails",
    component: ProductDetails,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        onAddToCart: { action: "onAddToCart" },
        onAddToWishlist: { action: "onAddToWishlist" },
    },
} satisfies Meta<typeof ProductDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Full product detail view with color swatches and size options. */
export const Default: Story = {
    args: {
        id: "carhartt-crowley-jacket",
        name: "Carhartt Men's Crowley Softshell Jacket",
        points: "12,300 points",
        description:
            "Built to handle the elements, the Crowley Softshell Jacket features a wind- and water-resistant outer shell with a fleece interior for exceptional warmth and comfort. Ideal for active outdoor work or everyday wear, this jacket offers a relaxed fit with ample room to layer underneath. Reinforced stitching and articulated patterning allow for a full range of motion in any condition.",
        imageSrc:
            "http://www.resourceurl.com/evault/A300B468-3A8B-4F8A-920B-36E9D2F00E0D/C17E5E63-B3FA-4A76-9EAA-58801D9AE579/ProductOptions/E1049E05-5620-4BD7-BD21-0AF501201746/E1049E05-5620-4BD7-BD21-0AF501201746-hi.jpg",
        imageAlt: "Carhartt Men's Crowley Softshell Jacket in Charcoal",
        availability: { type: "in-stock" },
        colors: jacketColors,
        sizes: jacketSizes,
    },
};

/** Product with no color or size variants — e.g. a laptop or tech item. */
export const NoVariants: Story = {
    args: {
        id: "macbook-air-512",
        name: "Apple 13-inch MacBook Air — 512GB",
        points: "131,000 points",
        description:
            "The 13-inch MacBook Air with Apple M3 chip delivers incredible performance in a strikingly thin and light design. With up to 18 hours of battery life, a brilliant Liquid Retina display with True Tone technology, and a completely silent fanless design, it's the ideal laptop for any environment.",
        imageSrc:
            "https://www.resourceurl.com/evault/037BE74E-0A81-456A-A31F-E9B514E9B286/7B95D226-E05D-440F-8281-ABED8A7AA86B/7B95D226-E05D-440F-8281-ABED8A7AA86B-hi.jpg",
        imageAlt: "Apple 13-inch MacBook Air — 512GB in Silver",
        availability: { type: "in-stock" },
    },
};

/** Product with size/flex options but no color swatches. */
export const SizesOnly: Story = {
    args: {
        id: "taylormade-qi4d-driver",
        name: "TaylorMade Qi4D Driver",
        points: "55,100 points",
        description:
            "The Qi4D Driver represents TaylorMade's most advanced driver technology, featuring a refined carbon crown and a twisted face design that maximises ball speed across the entire face. Engineered for players seeking maximum distance and forgiveness off the tee.",
        imageSrc:
            "http://www.resourceurl.com/evault/214667F7-85B9-41DB-B560-206F5D90B849/9593D6E9-9921-4220-9AFD-4BBA91701E6F/ProductOptions/8ABB6CF8-1ED6-49FA-952E-875712916ADA/8ABB6CF8-1ED6-49FA-952E-875712916ADA-hi.jpg",
        imageAlt: "TaylorMade Qi4D Driver",
        availability: { type: "in-stock" },
        sizes: driverFlexes,
    },
};

/** TaylorMade Qi4D Driver with hand/flex/loft variants displayed as descriptive cards. */
export const LongDescriptionSizes: Story = {
    args: {
        id: "taylormade-qi4d-driver",
        name: "TaylorMade Qi4D Driver",
        points: "55,100 points",
        description:
            "The Qi4D Driver represents TaylorMade's most advanced driver technology, featuring a refined carbon crown and a twisted face design that maximises ball speed across the entire face. Engineered for players seeking maximum distance and forgiveness off the tee, the Qi4D delivers Tour-level performance in a forgiving package suited to a wide range of handicaps.",
        imageSrc:
            "http://www.resourceurl.com/evault/214667F7-85B9-41DB-B560-206F5D90B849/9593D6E9-9921-4220-9AFD-4BBA91701E6F/ProductOptions/8ABB6CF8-1ED6-49FA-952E-875712916ADA/8ABB6CF8-1ED6-49FA-952E-875712916ADA-hi.jpg",
        imageAlt: "TaylorMade Qi4D Driver",
        availability: { type: "in-stock" },
        sizes: driverVariants,
    },
};

/** Product currently out of stock — "Add to Cart" button is disabled. */
export const OutOfStock: Story = {
    args: {
        ...Default.args,
        availability: { type: "out-of-stock" },
    },
};

/** Product with a ships-in shipping estimate. */
export const ShipsIn: Story = {
    args: {
        ...Default.args,
        availability: { type: "ships-in", message: "Will ship in 5–7 business days" },
    },
};

/** Product already saved to the wishlist — heart button appears filled in red. */
export const Wishlisted: Story = {
    args: {
        ...Default.args,
        isWishlisted: true,
    },
};

/** "Add to Cart" in loading state while the request is in-flight. */
export const AddingToCart: Story = {
    args: {
        ...Default.args,
        isAddingToCart: true,
    },
};
