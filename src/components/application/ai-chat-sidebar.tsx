import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, BarChartSquare02, LayersThree01, Stars02, Users01, X as CloseIcon } from "@untitledui/icons";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

/** A starter prompt shown before the first message. `response` is the canned reply until a real AI backend is connected. */
export interface AiChatSuggestion {
    label: string;
    description: string;
    icon: React.FC<{ className?: string }>;
    response?: string;
}

type Suggestion = AiChatSuggestion;

const defaultSuggestions: Suggestion[] = [
    {
        label: "Show sprint overview",
        description: "for the current team sprint",
        icon: LayersThree01,
    },
    {
        label: "Summarize active users",
        description: "across all projects this week",
        icon: Users01,
    },
    {
        label: "Show task completion rate",
        description: "compared to last month",
        icon: BarChartSquare02,
    },
];

const placeholderResponses: Record<string, string> = {
    "Show sprint overview for the current team sprint":
        "The current sprint has 12 tasks in progress, 8 completed, and 4 in review. The team is on track to complete 85% of planned story points by end of sprint on Friday.",
    "Summarize active users across all projects this week":
        'There are 24 active users this week across 6 projects. The most active project is "Dashboard Redesign" with 9 contributors. User engagement is up 12% from last week.',
    "Show task completion rate compared to last month":
        "Task completion rate this month is 78%, up from 71% last month. The biggest improvement is in the Engineering team, which went from 65% to 82%. QA tasks still have the lowest completion rate at 61%.",
};

// ─── Dot Grid Waveform Animation ────────────────────────────

const GRID_COLS = 13;
const GRID_ROWS = 5;
const DOT_GAP = 16;
const BASE_RADIUS = 2;
const WAVE_DURATION = 1400;
const WAVE_PAUSE = 3000;

// Seeded pseudo-random for deterministic organic offsets
function seededRandom(seed: number) {
    const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
}

const WaveformDotGrid = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Pre-compute organic dot data
        const dots: { x: number; y: number; baseRadius: number; nx: number; ny: number; ellipseDist: number }[] = [];

        const totalW = (GRID_COLS - 1) * DOT_GAP;
        const totalH = (GRID_ROWS - 1) * DOT_GAP;
        const padX = 12;
        const padY = 8;
        const width = totalW + padX * 2;
        const height = totalH + padY * 2;

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const seed = row * GRID_COLS + col;
                // Organic offset: jitter position slightly
                const jitterX = (seededRandom(seed) - 0.5) * 5;
                const jitterY = (seededRandom(seed + 100) - 0.5) * 4;
                const x = padX + col * DOT_GAP + jitterX;
                const y = padY + row * DOT_GAP + jitterY;

                // Normalized position (0→1)
                const nx = col / (GRID_COLS - 1);
                const ny = row / (GRID_ROWS - 1);

                // Elliptical distance from center (0 at center, 1 at edge)
                const dx = (nx - 0.5) * 2;
                const dy = (ny - 0.5) * 2;
                const ellipseDist = Math.sqrt(dx * dx * 0.7 + dy * dy * 1.3);

                // Vary base radius organically
                const radiusVariation = 0.6 + seededRandom(seed + 200) * 0.8;
                // Fade out dots near the ellipse edge
                const edgeFade = Math.max(0, 1 - Math.pow(ellipseDist, 2.5));
                const baseRadius = BASE_RADIUS * radiusVariation * edgeFade;

                if (baseRadius > 0.3) {
                    dots.push({ x, y, baseRadius, nx, ny, ellipseDist });
                }
            }
        }

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const brandColor = getComputedStyle(document.documentElement).getPropertyValue("--color-brand-600").trim();
        const rgbMatch = brandColor.match(/(\d+)\s+(\d+)\s+(\d+)/);
        const [r, g, b] = rgbMatch ? [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])] : [127, 86, 217];

        let lastCycleStart = performance.now();

        const draw = (now: number) => {
            const elapsed = now - lastCycleStart;
            const inWave = elapsed < WAVE_DURATION;

            if (elapsed >= WAVE_DURATION + WAVE_PAUSE) {
                lastCycleStart = now;
            }

            const waveProgress = inWave ? elapsed / WAVE_DURATION : -1;

            ctx.clearRect(0, 0, width, height);

            // Radial gradient glow behind dots — follows the wave
            const glowX = inWave ? padX + (waveProgress * 1.4 - 0.2) * totalW : width / 2;
            const glowY = height / 2;
            const glowRadius = Math.max(width, height) * 0.55;
            const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
            const glowOpacity = inWave ? 0.12 : 0.05;
            glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${glowOpacity})`);
            glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${glowOpacity * 0.4})`);
            glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            for (const dot of dots) {
                const centerDist = dot.ellipseDist;

                let opacity = 0.1 + (1 - centerDist) * 0.1;
                let scale = 1;

                if (inWave) {
                    const waveFront = waveProgress * 1.4 - 0.2; // overshoot for smooth entry/exit
                    const dist = Math.abs(dot.nx - waveFront);
                    const waveRadius = 0.3;

                    if (dist < waveRadius) {
                        const influence = Math.cos((dist / waveRadius) * Math.PI * 0.5); // smooth cosine falloff
                        const proximity = 1 - centerDist * 0.5;
                        const intensity = influence * proximity;

                        opacity += intensity * 0.7;
                        scale += intensity * proximity * 0.9;
                    }
                }

                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.baseRadius * scale, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(opacity, 1)})`;
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        animationRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="flex items-center justify-center">
            <canvas ref={canvasRef} />
        </div>
    );
};

// ─── Chat Content ───────────────────────────────────────────

const AiChatContent = ({ className, suggestions = defaultSuggestions }: { className?: string; suggestions?: Suggestion[] }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const hasMessages = messages.length > 0;

    const addMessage = (content: string) => {
        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content,
        };

        const responseText =
            suggestions.find((s) => `${s.label} ${s.description}` === content)?.response ??
            placeholderResponses[content] ??
            `Here's what I found for "${content}". This is a placeholder response — connect to your AI backend to get real answers.`;

        const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: responseText,
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInputValue("");

        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        addMessage(`${suggestion.label} ${suggestion.description}`);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        addMessage(trimmed);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const trimmed = inputValue.trim();
            if (!trimmed) return;
            addMessage(trimmed);
        }
    };

    const handleTextareaInput = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };

    return (
        <div className={cx("flex min-h-0 flex-1 flex-col", className)}>
            {/* Content area */}
            <div className="flex min-h-0 flex-1 flex-col">
                {!hasMessages ? (
                    <div className="flex flex-1 flex-col justify-center gap-3 px-4 py-6">
                        <div className="mb-2 text-center">
                            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-brand-secondary">
                                <Stars02 className="size-5 text-fg-brand-primary" />
                            </div>
                            <p className="text-sm font-semibold text-primary">Ask me anything</p>
                            <p className="mt-1 text-xs text-tertiary">Query your workspace data using natural language.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.label}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="group flex cursor-pointer items-start gap-3 rounded-lg border border-secondary p-3 text-left transition duration-100 ease-linear hover:bg-primary_hover"
                                >
                                    <suggestion.icon className="mt-0.5 size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-hover:text-fg-quaternary_hover" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-secondary transition duration-100 ease-linear group-hover:text-secondary_hover">
                                            {suggestion.label}
                                        </p>
                                        <p className="text-xs text-tertiary">{suggestion.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="flex flex-col gap-4">
                            {messages.map((message) => (
                                <div key={message.id} className="flex gap-2.5">
                                    {message.role === "assistant" ? (
                                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-secondary">
                                            <Stars02 className="size-3.5 text-fg-brand-primary" />
                                        </div>
                                    ) : (
                                        <Avatar size="xs" initials="Y" />
                                    )}
                                    <div className="min-w-0 pt-0.5">
                                        <p className="mb-0.5 text-xs font-medium text-tertiary">{message.role === "assistant" ? "Assistant" : "You"}</p>
                                        <p className="text-sm text-secondary">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Dot grid animation — shown when idle */}
            {!hasMessages && <WaveformDotGrid />}

            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-secondary px-4 py-4 lg:py-5">
                <div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary p-2 shadow-xs transition duration-100 ease-linear focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onInput={handleTextareaInput}
                        placeholder="Ask a question..."
                        rows={1}
                        className="max-h-30 min-h-5 flex-1 resize-none bg-transparent text-sm text-primary placeholder:text-placeholder focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className={cx(
                            "flex size-7 shrink-0 items-center justify-center rounded-md transition duration-100 ease-linear",
                            inputValue.trim()
                                ? "cursor-pointer bg-brand-solid text-fg-white hover:bg-brand-solid_hover"
                                : "cursor-not-allowed bg-quaternary text-fg-quaternary opacity-50",
                        )}
                    >
                        <ArrowUp className="size-4 stroke-[2.5px]" />
                    </button>
                </div>
            </form>
        </div>
    );
};

/** Mobile trigger button + slide-out drawer for AI chat. */
export const AiChatMobileTrigger = ({ suggestions }: { suggestions?: AiChatSuggestion[] }) => {
    return (
        <AriaDialogTrigger>
            <AriaButton
                aria-label="Open AI assistant"
                className="flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-brand-primary outline-focus-ring hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
            >
                <Stars02 className="size-5" />
            </AriaButton>

            <AriaModalOverlay
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pl-16 backdrop-blur-md lg:hidden",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                {({ state }) => (
                    <>
                        <AriaButton
                            aria-label="Close AI assistant"
                            onPress={() => state.close()}
                            className="fixed top-2.5 left-3 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <CloseIcon className="size-6" />
                        </AriaButton>

                        <AriaModal className="ml-auto h-dvh w-full max-w-80 cursor-auto will-change-transform">
                            <AriaDialog className="flex h-full flex-col bg-primary outline-hidden focus:outline-hidden">
                                {/* Header */}
                                <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                                    <h2 className="text-sm font-semibold text-primary">AI Assistant</h2>
                                </div>

                                <AiChatContent suggestions={suggestions} />
                            </AriaDialog>
                        </AriaModal>
                    </>
                )}
            </AriaModalOverlay>
        </AriaDialogTrigger>
    );
};

interface AiChatSidebarProps {
    /** Whether the drawer is expanded. */
    isOpen: boolean;
    /** Called when the user closes the drawer. */
    onClose: () => void;
    /** Starter prompts. Defaults to AdminUI's workspace examples. */
    suggestions?: AiChatSuggestion[];
    className?: string;
}

/**
 * Desktop sidebar for AI chat.
 *
 * Collapses by animating its own width to zero while the inner panel keeps a
 * fixed width and slides out, so the chat content never squashes mid-transition.
 * `overflow-hidden` lives on the sticky element itself, which keeps `position: sticky`
 * working (an overflow-hidden *ancestor* would break it).
 */
export const AiChatSidebar = ({ isOpen, onClose, suggestions, className }: AiChatSidebarProps) => {
    return (
        <aside
            aria-hidden={!isOpen}
            inert={!isOpen || undefined}
            className={cx(
                "sticky top-0 flex h-dvh shrink-0 flex-col overflow-hidden border-l bg-primary transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
                isOpen ? "w-full border-secondary lg:w-80 xl:w-96" : "w-0 border-transparent",
                className,
            )}
        >
            <div
                className={cx(
                    "flex h-full w-full shrink-0 flex-col transition-[opacity,transform] duration-300 ease-in-out motion-reduce:transition-none lg:w-80 xl:w-96",
                    isOpen ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
                )}
            >
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                    <h2 className="flex-1 text-sm font-semibold text-primary">AI Assistant</h2>
                    <AriaButton
                        aria-label="Close AI assistant"
                        onPress={onClose}
                        className="flex cursor-pointer items-center justify-center rounded-md p-1 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <CloseIcon className="size-5" />
                    </AriaButton>
                </div>

                <AiChatContent suggestions={suggestions} />
            </div>
        </aside>
    );
};

/** Sparkles button that expands the AI chat drawer. */
export const AiChatTrigger = ({ isOpen, onPress, className }: { isOpen: boolean; onPress: () => void; className?: string }) => {
    return (
        <AriaButton
            aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
            aria-expanded={isOpen}
            onPress={onPress}
            className={cx(
                "flex cursor-pointer items-center justify-center rounded-md p-1 outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2",
                isOpen ? "bg-brand-secondary text-fg-brand-primary" : "text-fg-quaternary hover:bg-primary_hover hover:text-fg-brand-primary",
                className,
            )}
        >
            <Stars02 className="size-5" />
        </AriaButton>
    );
};
