import type { FC } from "react";
import { Award01 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { cx, sortCx } from "@/utils/cx";
import type { RecognitionValue } from "./recognition-types";

const styles = sortCx({
    // Shown at its natural shape, so value artwork is never cropped.
    image: "h-auto w-full rounded-2xl ring-1 ring-secondary",
    panel: "flex aspect-square flex-col items-center justify-center gap-4 rounded-2xl bg-utility-brand-50 p-6 text-center dark:bg-utility-brand-50/40",
    caption: "max-w-56 text-sm text-tertiary",
});

interface RecognitionValueImageProps {
    value: RecognitionValue | null;
    className?: string;
}

/** The selected value's image, or its icon on a tinted panel when it has none. */
export const RecognitionValueImage: FC<RecognitionValueImageProps> = ({ value, className }) => {
    if (value?.image) {
        return <img src={value.image.src} alt={value.image.alt} className={cx(styles.image, className)} />;
    }

    return (
        <div className={cx(styles.panel, className)}>
            <FeaturedIcon icon={value?.icon ?? Award01} color="brand" theme="light" size="xl" />
            {!value && <p className={styles.caption}>The image for the reason you choose appears here.</p>}
        </div>
    );
};
