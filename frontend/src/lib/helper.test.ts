import { describe, it, expect } from "vitest";
import {
    createAvatar,
    toCamelCase,
    checkOverdue,
    formatDate,
    dateToNextYear,
    timeAgo,
    getBirthdayDisplayDate,
} from "./helper";

describe("createAvatar", () => {
    it("returns initials from first and last name", () => {
        expect(createAvatar("Glen", "Mogane")).toBe("GM");
    });

    it("falls back to SU when a name is missing", () => {
        expect(createAvatar("Glen")).toBe("SU");
        expect(createAvatar("", "Mogane")).toBe("SU");
    });
});

describe("toCamelCase", () => {
    it("title-cases each word and strips spaces", () => {
        expect(toCamelCase("hello world")).toBe("HelloWorld");
        expect(toCamelCase("annual leave")).toBe("AnnualLeave");
    });
});

describe("checkOverdue", () => {
    it("returns 'overdue' for a date in the past", () => {
        const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
        expect(checkOverdue(past, "pending")).toBe("overdue");
    });

    it("returns the original status for a date in the future", () => {
        const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
        expect(checkOverdue(future, "pending")).toBe("pending");
    });

    it("throws for an invalid date", () => {
        expect(() => checkOverdue("not-a-date", "pending")).toThrow("Invalid date provided");
    });
});

describe("formatDate", () => {
    it("formats a date as 'D Mon YYYY'", () => {
        expect(formatDate("2025-03-15T12:00:00.000Z")).toBe("15 Mar 2025");
    });

    it("returns an empty string for an undefined date", () => {
        expect(formatDate(undefined)).toBe("");
    });
});

describe("dateToNextYear", () => {
    it("advances the year by one and formats the result", () => {
        expect(dateToNextYear("2025-03-15T12:00:00.000Z")).toBe("15 Mar 2026");
    });

    it("returns a dash for an undefined date", () => {
        expect(dateToNextYear(undefined)).toBe("-");
    });
});

describe("timeAgo", () => {
    it("returns 'Today' for the current date", () => {
        expect(timeAgo(new Date())).toBe("Today");
    });

    it("returns 'Yesterday' for one day ago", () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        expect(timeAgo(yesterday)).toBe("Yesterday");
    });

    it("returns days-ago text for less than a week", () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        expect(timeAgo(threeDaysAgo)).toBe("3 days ago");
    });

    it("returns weeks-ago text for less than a month", () => {
        const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        expect(timeAgo(twoWeeksAgo)).toBe("2 weeks ago");
    });

    it("returns months-ago text beyond a month", () => {
        const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        expect(timeAgo(twoMonthsAgo)).toBe("2 months ago");
    });
});

describe("getBirthdayDisplayDate", () => {
    it("shows the actual date with no note on a weekday", () => {
        // 2025-03-19 is a Wednesday
        const result = getBirthdayDisplayDate("2025-03-19T12:00:00.000Z");
        expect(result.date).toBe("19 Mar 2025");
        expect(result.note).toBeUndefined();
    });

    it("moves a Saturday birthday to the observed Friday", () => {
        // 2025-03-15 is a Saturday
        const result = getBirthdayDisplayDate("2025-03-15T12:00:00.000Z");
        expect(result.date).toBe("14 Mar 2025");
        expect(result.note).toBe("Observed on Friday (weekend)");
    });

    it("returns an empty result when no date of birth is provided", () => {
        expect(getBirthdayDisplayDate(undefined)).toEqual({ date: "", note: undefined });
    });
});
