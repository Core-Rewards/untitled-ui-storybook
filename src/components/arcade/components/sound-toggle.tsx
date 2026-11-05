import { ToggleButton as AriaToggleButton } from "react-aria-components";
import { IconSoundOff, IconSoundOn } from "@/components/arcade/components/arcade-icons";
import { cx } from "@/utils/cx";
import { setSoundEnabled, sfx, useSoundEnabled } from "../sound/arcade-sound";

/** HUD sound on/off. The choice is remembered per browser. */
export const SoundToggle = ({ className }: { className?: string }) => {
    const on = useSoundEnabled();
    return (
        <AriaToggleButton
            isSelected={on}
            onChange={(next) => {
                setSoundEnabled(next);
                if (next) sfx.click();
            }}
            aria-label="Sound"
            className={cx("arcade-tab outline-none", className)}
        >
            {on ? <IconSoundOn className="size-4 text-arcade-cyan" /> : <IconSoundOff className="size-4 text-arcade-muted" />}
            <span className="max-sm:hidden">{on ? "Sound on" : "Sound off"}</span>
        </AriaToggleButton>
    );
};
