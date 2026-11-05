import { useEffect, useRef } from "react";
import { Dialog as AriaDialog, Heading as AriaHeading, Modal as AriaModal, ModalOverlay as AriaModalOverlay } from "react-aria-components";
import { IconPrize } from "@/components/arcade/components/arcade-icons";
import { cx } from "@/utils/cx";
import type { Prize } from "../api/types";
import { ArcadeButton } from "./arcade-button";

const CONFETTI = ["#eeff00", "#f000ec", "#00e7f2", "#ff79e9", "#e9f9ff"];

/** Canvas confetti burst; skipped for reduced motion. */
const Confetti = ({ active }: { active: boolean }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        if (!active || !canvas || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const bits = Array.from({ length: 150 }, (_, i) => ({
            x: canvas.width / 2,
            y: canvas.height * 0.38,
            vx: (Math.random() - 0.5) * 15,
            vy: -Math.random() * 12 - 3,
            r: Math.random() * Math.PI,
            s: Math.random() * 7 + 4,
            c: CONFETTI[i % CONFETTI.length],
            life: 1,
        }));
        let raf = 0;
        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;
            for (const p of bits) {
                if (p.life <= 0 || p.y > canvas.height + 20) continue;
                alive++;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.28;
                p.vx *= 0.985;
                p.r += 0.15;
                p.life -= 0.006;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.r);
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
                ctx.restore();
            }
            if (alive) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active]);
    return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] size-full" />;
};

export interface PrizeModalProps {
    /** Prize to show. `null` closes the modal. */
    prize: Prize | null;
    onClose: () => void;
    /** Heading, e.g. "You won". */
    title?: string;
}

/**
 * Big win celebration, shared by every game. Shown for merchandise and other
 * non-points prizes (points prizes are celebrated on the board itself).
 */
export const PrizeModal = ({ prize, onClose, title = "You won" }: PrizeModalProps) => (
    <AriaModalOverlay
        isOpen={!!prize}
        onOpenChange={(open) => !open && onClose()}
        isDismissable
        className={({ isEntering, isExiting }) =>
            cx(
                "arcade-root fixed inset-0 z-50 flex items-center justify-center bg-arcade-void/75 p-4 backdrop-blur-sm",
                isEntering && "duration-300 ease-out animate-in fade-in",
                isExiting && "duration-200 ease-in animate-out fade-out",
            )
        }
    >
        <Confetti active={!!prize} />
        <AriaModal
            className={({ isEntering, isExiting }) =>
                cx(
                    "w-full max-w-md outline-none",
                    isEntering && "duration-300 ease-[cubic-bezier(.2,1.4,.4,1)] animate-in zoom-in-90",
                    isExiting && "duration-150 animate-out zoom-out-95",
                )
            }
        >
            <AriaDialog className="relative outline-none">
                <div className="flex flex-col items-center gap-3 bg-[radial-gradient(ellipse_at_50%_0%,#3a0b6e_0%,var(--color-arcade-ink)_70%)] px-6 pt-9 pb-7 text-center text-arcade-ice arcade-frame">
                    <span className="grid size-20 place-items-center rounded-full bg-arcade-acid/10 shadow-arcade-acid ring-2 ring-arcade-acid">
                        {prize?.imageUrl ? (
                            <img src={prize.imageUrl} alt="" className="size-16 rounded-full object-cover" />
                        ) : (
                            <IconPrize className="size-9 text-arcade-acid" />
                        )}
                    </span>
                    <AriaHeading
                        slot="title"
                        className="font-arcade-display text-5xl leading-none font-black tracking-tight text-white uppercase italic arcade-text-offset"
                    >
                        {title}
                    </AriaHeading>
                    <p className="font-arcade-display text-3xl leading-tight font-extrabold text-arcade-acid uppercase italic">{prize?.label}</p>
                    {prize?.fulfillmentNote && <p className="max-w-xs text-sm text-arcade-muted">{prize.fulfillmentNote}</p>}
                    <ArcadeButton size="md" color="acid" className="mt-3" onPress={onClose} autoFocus>
                        Keep playing
                    </ArcadeButton>
                </div>
            </AriaDialog>
        </AriaModal>
    </AriaModalOverlay>
);
