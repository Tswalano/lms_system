import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
    it("joins simple class names", () => {
        expect(cn("a", "b")).toBe("a b");
    });

    it("drops falsy values", () => {
        expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
    });

    it("resolves Tailwind conflicts, keeping the last one", () => {
        expect(cn("px-2", "px-4")).toBe("px-4");
    });

    it("applies conditional class objects", () => {
        expect(cn("base", { active: true, hidden: false })).toBe("base active");
    });
});
