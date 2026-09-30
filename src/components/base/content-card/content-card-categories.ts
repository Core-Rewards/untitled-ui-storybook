import { Announcement02, BookOpen01, Calendar, Package, PlayCircle, Tag01 } from "@untitledui/icons";
import type { ContentCategory, ContentCategoryKey } from "./content-card-types";

export const contentCategories: Record<ContentCategoryKey, ContentCategory> = {
    news: { label: "News", color: "blue", icon: Announcement02, ctaLabel: "Read more" },
    "new-product": { label: "New Product", color: "brand", icon: Package, ctaLabel: "Learn more" },
    resource: { label: "Resource", color: "indigo", icon: BookOpen01, ctaLabel: "View resource" },
    video: { label: "Video", color: "purple", icon: PlayCircle, ctaLabel: "Watch now", isVideo: true },
    event: { label: "Event", color: "orange", icon: Calendar, ctaLabel: "View details" },
    promotion: { label: "Promotion", color: "success", icon: Tag01, ctaLabel: "Learn more" },
};

export const resolveCategory = (category: ContentCategoryKey | ContentCategory): ContentCategory =>
    typeof category === "string" ? contentCategories[category] : category;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a `Date` or ISO string. Date-only strings ("2026-09-30") are read as local dates, since
 * `new Date("2026-09-30")` means UTC midnight and would show the previous day west of UTC.
 */
export const parseContentDate = (date: Date | string): Date | null => {
    if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date;

    const dateOnly = DATE_ONLY.exec(date);
    const parsed = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(date);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Sep 30, 2026" for display, plus a `YYYY-MM-DD` value for the `<time>` element. */
export const formatContentDate = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");

    return {
        label: dateFormatter.format(date),
        dateTime: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    };
};
