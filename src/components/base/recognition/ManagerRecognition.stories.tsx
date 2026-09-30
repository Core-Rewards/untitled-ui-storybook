import type { Meta, StoryObj } from "@storybook/react-vite";
import { HeartHand, Lightbulb02, Rocket02, ShieldTick, Target04, Users01 } from "@untitledui/icons";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { ManagerRecognition } from "./manager-recognition";
import type { RecognitionParticipant, RecognitionValue } from "./recognition-types";

// ─── Sample Data ─────────────────────────────────────────────────────────────

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop`;

const values: RecognitionValue[] = [
    {
        id: "customer-first",
        name: "Customer First",
        description: "Goes above and beyond for customers.",
        icon: HeartHand,
        points: 250,
    },
    {
        id: "teamwork",
        name: "Teamwork",
        description: "Makes the people around them better.",
        icon: Users01,
        image: { src: unsplash("1519389950473-47ba0277781c"), alt: "Colleagues working together around a table covered in laptops" },
    },
    {
        id: "innovation",
        name: "Innovation",
        description: "Finds a better way and shares it.",
        icon: Lightbulb02,
        image: { src: unsplash("1531297484001-80022131f5a1"), alt: "A laptop glowing in a dark room" },
        points: 500,
    },
    {
        id: "safety",
        name: "Safety Excellence",
        description: "Keeps everyone safe on every job.",
        icon: ShieldTick,
        points: 1000,
    },
    {
        id: "leadership",
        name: "Leadership",
        description: "Steps up and brings others along.",
        icon: Target04,
        image: { src: unsplash("1556761175-5973dc0f32e7"), alt: "A presenter speaking to a team in a brick-walled office" },
    },
    {
        id: "above-and-beyond",
        name: "Above and Beyond",
        description: "Delivers more than anyone expected.",
        icon: Rocket02,
    },
];

const participants: RecognitionParticipant[] = [
    { id: "p1", name: "Jordan Lee", title: "Store Manager", department: "Dallas" },
    { id: "p2", name: "Priya Patel", title: "Sales Associate", department: "Austin" },
    { id: "p3", name: "Marcus Johnson", title: "Warehouse Lead", department: "Houston" },
    { id: "p4", name: "Sofia Garcia", title: "Customer Service Rep", department: "Dallas" },
    { id: "p5", name: "Ethan Brooks", title: "Sales Associate", department: "Plano" },
    { id: "p6", name: "Aisha Rahman", title: "Inventory Specialist", department: "Austin" },
    { id: "p7", name: "Daniel Kim", title: "Assistant Manager", department: "Houston" },
    { id: "p8", name: "Grace Thompson", title: "Sales Associate", department: "Dallas" },
    { id: "p9", name: "Luis Hernández", title: "Delivery Driver", department: "San Antonio" },
    { id: "p10", name: "Hannah Müller", title: "Merchandiser", department: "Plano" },
];

const budget = { available: 12_500, periodLabel: "Q4 budget · resets Dec 31" };

const MESSAGE =
    "Thank you for jumping in to cover the weekend rush and training two new hires at the same time. The team hit its best Saturday of the year because of you.";

// ─── Interaction helpers ─────────────────────────────────────────────────────

type Canvas = ReturnType<typeof within>;

/** The combobox list renders in a portal, so options are found on the whole page. */
const selectRecipient = async (canvas: Canvas, body: Canvas, name: string) => {
    await userEvent.type(canvas.getByRole("combobox", { name: /Recipient/ }), name.split(" ")[0]);
    await userEvent.click(await body.findByRole("option", { name: new RegExp(name) }));
};

const fillIn = async (canvasElement: HTMLElement, { value = "Teamwork", points = "500" }: { value?: string; points?: string | null } = {}) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await selectRecipient(canvas, body, "Jordan Lee");
    await userEvent.click(canvas.getByRole("radio", { name: new RegExp(`^${value}`) }));
    if (points) await userEvent.click(canvas.getByRole("radio", { name: points }));
    await userEvent.type(canvas.getByRole("textbox", { name: /Message/ }), MESSAGE);

    return canvas;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
    title: "Base/Recognition/ManagerRecognition",
    component: ManagerRecognition,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    args: {
        senderName: "Alex Morgan",
        budget,
        values,
        participants,
        onSend: fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 600));
        }),
    },
    decorators: [
        (Story) => (
            <div className="mx-auto max-w-[1120px]">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof ManagerRecognition>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── States ───────────────────────────────────────────────────────────────────

/** The empty form. The preview on the right fills in as the manager works through it. */
export const Empty: Story = {};

/** Every field filled in, ready to send. */
export const FilledIn: Story = {
    play: async ({ canvasElement }) => {
        const canvas = await fillIn(canvasElement);
        await expect(canvas.getByRole("button", { name: "Send 500 points" })).toBeEnabled();
    },
};

/** Values can carry an image. It appears under the values and in the preview. */
export const ValueWithImage: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("radio", { name: /^Leadership/ }));
        await expect(canvas.getAllByRole("img", { name: /presenter speaking/ })).toHaveLength(2);
    },
};

/**
 * Values can suggest an amount. Selecting Innovation fills in 500 points, and the manager can
 * still pick a different amount.
 */
export const SuggestedPoints: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole("radio", { name: /^Innovation/ }));
        await expect(canvas.getByRole("radio", { name: "500" })).toBeChecked();
        await expect(canvas.getByText("Suggested for Innovation: 500 points.")).toBeInTheDocument();
    },
};

/** Opened from someone's profile, with that person already chosen. */
export const PreselectedRecipient: Story = {
    args: { defaultRecipient: participants[1] },
};

// ─── Budget ───────────────────────────────────────────────────────────────────

/** Presets above the remaining budget are disabled. */
export const LowBudget: Story = {
    args: { budget: { available: 400, periodLabel: "Q4 budget · resets Dec 31" } },
};

/**
 * Safety Excellence suggests 1,000 points, more than the manager has left. The amount moves to
 * the custom field so the manager can lower it.
 */
export const OverBudget: Story = {
    args: { budget: { available: 400, periodLabel: "Q4 budget · resets Dec 31" } },
    play: async ({ canvasElement }) => {
        const canvas = await fillIn(canvasElement, { value: "Safety Excellence", points: null });
        await expect(canvas.getByText("Exceeds your 400 points available.")).toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "Send points" })).toBeDisabled();
    },
};

export const NoBudget: Story = {
    args: { budget: { available: 0, periodLabel: "Q4 budget · resets Dec 31" } },
};

/** Custom amounts can be turned off, and a single award can be capped. */
export const PresetsOnly: Story = {
    args: { allowCustomPoints: false, pointOptions: [50, 100, 200], maxPoints: 200 },
};

// ─── Sending ──────────────────────────────────────────────────────────────────

/** The manager can choose not to email the recipient. */
export const EmailOff: Story = {
    play: async ({ canvasElement }) => {
        const canvas = await fillIn(canvasElement);
        await userEvent.click(canvas.getByRole("switch", { name: /Email Jordan/ }));
        await expect(canvas.getByText("Email off")).toBeInTheDocument();
    },
};

export const Sending: Story = {
    args: { onSend: fn(() => new Promise<void>(() => {})) },
    play: async ({ canvasElement }) => {
        const canvas = await fillIn(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Send 500 points" }));
    },
};

/** If the send fails, the entries stay so the manager can try again. */
export const SendFailed: Story = {
    args: { onSend: fn(async () => Promise.reject(new Error("Network error"))) },
    play: async ({ canvasElement }) => {
        const canvas = await fillIn(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Send 500 points" }));
        await expect(await canvas.findByRole("alert")).toHaveTextContent("We couldn’t send your recognition.");
    },
};

export const Sent: Story = {
    play: async ({ canvasElement, args }) => {
        const canvas = await fillIn(canvasElement);
        await userEvent.click(canvas.getByRole("button", { name: "Send 500 points" }));
        await expect(await canvas.findByRole("status")).toHaveTextContent("500 points sent to Jordan Lee");
        await expect(args.onSend).toHaveBeenCalledWith(
            expect.objectContaining({ points: 500, sendEmail: true, recipient: participants[0], message: MESSAGE }),
        );
    },
};

// ─── Search ───────────────────────────────────────────────────────────────────

/** For large directories, search runs on the server as the manager types. */
export const ServerSearch: Story = {
    args: {
        participants: undefined,
        onSearchParticipants: async (query, signal) => {
            await new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, 400);
                signal.addEventListener("abort", () => {
                    clearTimeout(timer);
                    reject(new DOMException("Aborted", "AbortError"));
                });
            });
            const q = query.toLowerCase();
            return participants.filter((p) => `${p.name} ${p.title} ${p.department}`.toLowerCase().includes(q)).slice(0, 5);
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const body = within(canvasElement.ownerDocument.body);
        await selectRecipient(canvas, body, "Marcus Johnson");
        await waitFor(() => expect(canvas.getByText("Congratulations, Marcus!")).toBeInTheDocument());

        // Starting a new search and leaving without picking anyone keeps the current recipient.
        const combobox = canvas.getByRole("combobox", { name: /Recipient/ });
        await userEvent.tripleClick(combobox);
        await userEvent.keyboard("Pri");
        await body.findByRole("option", { name: /Priya Patel/ });
        await userEvent.tab();
        await waitFor(() => expect(combobox).toHaveValue("Marcus Johnson Warehouse Lead · Houston"));
        await expect(canvas.getByText("Congratulations, Marcus!")).toBeInTheDocument();
    },
};

// ─── Layout ───────────────────────────────────────────────────────────────────

/** In narrow containers the preview stacks below the form. */
export const Narrow: Story = {
    decorators: [
        (Story) => (
            <div className="mx-auto max-w-[390px]">
                <Story />
            </div>
        ),
    ],
};
