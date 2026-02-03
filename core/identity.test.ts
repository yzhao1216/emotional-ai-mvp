import { describe, it, expect } from "vitest";
import {
  userAskedForAdvice,
  userAskedForPerspective,
  adviceRequestRegexes,
  bannedPhrases,
  bannedPatterns,
  reflectionStarters,
  assistantName,
  assistantPurpose,
  ResponsePriority,
} from "./identity";

describe("identity", () => {
  it("exports assistantName and assistantPurpose", () => {
    expect(assistantName).toBe("Anchor");
    expect(assistantPurpose).toContain("empathize");
    expect(assistantPurpose).toContain("advice unless you explicitly ask");
  });

  it("ResponsePriority enum has expected values", () => {
    expect(ResponsePriority.Empathy).toBe("Empathy");
    expect(ResponsePriority.Clarify).toBe("Clarify");
    expect(ResponsePriority.Stay).toBe("Stay");
    expect(ResponsePriority.SuggestOnlyIfAsked).toBe("SuggestOnlyIfAsked");
  });

  it("bannedPhrases includes required phrases", () => {
    const required = [
      "you should",
      "you need to",
      "from a rational perspective",
      "just think positive",
      "calm down",
      "it's not a big deal",
    ];
    for (const p of required) {
      expect(bannedPhrases).toContain(p);
    }
  });
});

describe("userAskedForAdvice", () => {
  it("detects English advice requests", () => {
    expect(userAskedForAdvice("What should I do?")).toBe(true);
    expect(userAskedForAdvice("Give me advice on this.")).toBe(true);
    expect(userAskedForAdvice("Tell me what to do.")).toBe(true);
    expect(userAskedForAdvice("What would you suggest?")).toBe(true);
  });

  it("detects Chinese advice requests: 我该怎么办 / 给我建议", () => {
    expect(userAskedForAdvice("我该怎么办？")).toBe(true);
    expect(userAskedForAdvice("给我建议")).toBe(true);
    expect(userAskedForAdvice("给我一点建议吧")).toBe(true);
    expect(userAskedForAdvice("你有什么建议吗？")).toBe(true);
    expect(userAskedForAdvice("我该怎么做")).toBe(true);
    expect(userAskedForAdvice("怎么办才好")).toBe(true);
  });

  it("returns false when user does not ask for advice", () => {
    expect(userAskedForAdvice("I'm so stressed today.")).toBe(false);
    expect(userAskedForAdvice("Just venting.")).toBe(false);
    expect(userAskedForAdvice("")).toBe(false);
    expect(userAskedForAdvice("   ")).toBe(false);
  });
});

describe("identity exports for postprocess", () => {
  it("exports bannedPatterns (RegExp[]) and reflectionStarters (string[])", () => {
    expect(Array.isArray(bannedPatterns)).toBe(true);
    expect(bannedPatterns.length).toBeGreaterThan(0);
    expect(bannedPatterns.every((p) => p instanceof RegExp)).toBe(true);
    expect(Array.isArray(reflectionStarters)).toBe(true);
    expect(reflectionStarters.length).toBeGreaterThan(0);
  });
});

describe("userAskedForPerspective", () => {
  it("detects perspective requests", () => {
    expect(userAskedForPerspective("What do you think?")).toBe(true);
    expect(userAskedForPerspective("What's your take on this?")).toBe(true);
    expect(userAskedForPerspective("你怎么看？")).toBe(true);
  });

  it("returns false when not asking for perspective", () => {
    expect(userAskedForPerspective("I'm stressed.")).toBe(false);
    expect(userAskedForPerspective("")).toBe(false);
  });
});
