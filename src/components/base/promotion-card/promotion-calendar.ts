import type { PromotionCardData } from "./promotion-card-types";
import { formatOffer, parseLocalDate } from "./promotion-card-utils";

/**
 * Where an Add to calendar request goes.
 * - `google`, `outlook`, `office365`: open the calendar's own new-event page, filled in.
 * - `ics`: downloads a file that Apple Calendar, desktop Outlook and most others open.
 */
export type CalendarTarget = "google" | "outlook" | "office365" | "ics";

export const CALENDAR_TARGET_LABELS: Record<CalendarTarget, string> = {
    google: "Google Calendar",
    outlook: "Outlook.com",
    office365: "Microsoft 365",
    ics: "Apple Calendar or Outlook (.ics)",
};

/** Calendar event details shared by every target. */
interface CalendarEvent {
    title: string;
    description: string;
    url: string;
    /** First day, `YYYY-MM-DD`. */
    start: string;
    /** Day after the last day, `YYYY-MM-DD`: all-day events end exclusively. */
    endExclusive: string;
}

const pad = (value: number) => String(value).padStart(2, "0");
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Relative links (`#promo`, `/promotions/x`) become absolute, since a calendar has no page to resolve them against. */
const absoluteUrl = (href: string) => {
    try {
        return new URL(href, typeof window === "undefined" ? undefined : window.location.href).toString();
    } catch {
        return href;
    }
};

/**
 * The promotion as one all-day event across its whole run, titled with the
 * offer so it reads at a glance in a month view: `3x Points: Triple Points'tober`.
 */
export const toCalendarEvent = (promotion: PromotionCardData): CalendarEvent => {
    const last = parseLocalDate(promotion.endDate);
    const dayAfter = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    const url = absoluteUrl(promotion.href);

    return {
        title: `${formatOffer(promotion.offer)}: ${promotion.name}`,
        description: [promotion.description, promotion.earnPotential, `Details: ${url}`].filter(Boolean).join("\n\n"),
        url,
        start: promotion.startDate,
        endExclusive: toIsoDate(dayAfter),
    };
};

const compact = (isoDate: string) => isoDate.replaceAll("-", "");

// ── Web calendars ─────────────────────────────────────────────────────────────

const googleUrl = (event: CalendarEvent) => {
    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: event.title,
        dates: `${compact(event.start)}/${compact(event.endExclusive)}`,
        details: event.description,
    });
    return `https://calendar.google.com/calendar/render?${params}`;
};

const outlookUrl = (host: string, event: CalendarEvent) => {
    const params = new URLSearchParams({
        path: "/calendar/action/compose",
        rru: "addevent",
        subject: event.title,
        startdt: event.start,
        enddt: event.endExclusive,
        allday: "true",
        body: event.description,
    });
    return `https://${host}/calendar/0/deeplink/compose?${params}`;
};

// ── iCalendar file ────────────────────────────────────────────────────────────

/** Escapes text for an iCalendar property value (RFC 5545 §3.3.11). */
const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/**
 * Folds a content line to 75 octets (RFC 5545 §3.1). Counts bytes, not
 * characters, so a name with accents or emoji never splits a character.
 */
const fold = (line: string) => {
    const encoder = new TextEncoder();
    const parts: string[] = [];
    let current = "";
    let bytes = 0;
    for (const char of line) {
        const size = encoder.encode(char).length;
        // Continuation lines start with a space, which counts toward their 75.
        if (bytes + size > (parts.length === 0 ? 75 : 74)) {
            parts.push(current);
            current = "";
            bytes = 0;
        }
        current += char;
        bytes += size;
    }
    parts.push(current);
    return parts.join("\r\n ");
};

const utcStamp = (date: Date) =>
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

/**
 * An `.ics` file for the promotion. Shows as free time, so a month-long
 * promotion never blocks the participant's calendar, and carries a reminder at
 * 9am on the last day, the moment it is most useful.
 */
export const toIcs = (promotion: PromotionCardData, now = new Date()) => {
    const event = toCalendarEvent(promotion);
    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Core Rewards//Promotions//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:promotion-${promotion.id}@corerewards`,
        `DTSTAMP:${utcStamp(now)}`,
        `DTSTART;VALUE=DATE:${compact(event.start)}`,
        `DTEND;VALUE=DATE:${compact(event.endExclusive)}`,
        `SUMMARY:${escapeText(event.title)}`,
        `DESCRIPTION:${escapeText(event.description)}`,
        `URL:${event.url}`,
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(`Last day to earn on ${promotion.name}`)}`,
        // The event ends at midnight after the last day; 15 hours earlier is 9am on it.
        "TRIGGER;RELATED=END:-PT15H",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
    ];
    return lines.map(fold).join("\r\n") + "\r\n";
};

/** A file name safe on every platform: `triple-points-tober.ics`. */
export const icsFileName = (promotion: PromotionCardData) =>
    `${
        promotion.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || "promotion"
    }.ics`;

/** Link for each target. The `.ics` one is a data URL, so it works without a server. */
export const calendarHref = (target: CalendarTarget, promotion: PromotionCardData) => {
    switch (target) {
        case "google":
            return googleUrl(toCalendarEvent(promotion));
        case "outlook":
            return outlookUrl("outlook.live.com", toCalendarEvent(promotion));
        case "office365":
            return outlookUrl("outlook.office.com", toCalendarEvent(promotion));
        case "ics":
            return `data:text/calendar;charset=utf-8,${encodeURIComponent(toIcs(promotion))}`;
    }
};
