import { describe, it, expect } from "vitest";
import {
  postProcessAssistantText,
  outputContainsActionVerbs,
} from "./postprocess";

describe("postProcessAssistantText", () => {
  describe("when neither advice nor perspective is requested", () => {
    it("removes banned phrases (case-insensitive)", () => {
      const text =
        "I hear you. You should try to relax. From a rational perspective, it's not a big deal.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(result).not.toMatch(/you should/i);
      expect(result).not.toMatch(/from a rational perspective/i);
      expect(result).not.toMatch(/it's not a big deal/i);
    });

    it("output contains no action verbs / directive phrasing", () => {
      const text =
        "I hear you. You could try taking a short walk. One option is to talk to your manager. Have you considered writing it down?";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(outputContainsActionVerbs(result)).toBe(false);
      expect(result).not.toMatch(/you could try/i);
      expect(result).not.toMatch(/one option is to/i);
      expect(result).not.toMatch(/have you considered/i);
    });

    it("strips 'you need to' and 'calm down'", () => {
      const text = "I understand. You need to calm down. We can talk.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(result).not.toMatch(/you need to/i);
      expect(result).not.toMatch(/calm down/i);
    });

    it("rewrites indirect advice so 'it might help to' and 'have you considered' do not slip through", () => {
      const text =
        "I hear you. It might help to take a short walk. Have you considered talking to your manager?";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(result).not.toMatch(/it might help to/i);
      expect(result).not.toMatch(/have you considered/i);
    });

    it("keeps supportive non-advice content", () => {
      const text = "That sounds really frustrating. I'm here with you.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(result).toContain("frustrating");
      expect(result).toContain("here");
    });

    it("uses reflection starters when rewriting (response stays natural)", () => {
      const text =
        "It might help to set boundaries. You should say no sometimes.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      });
      expect(result).not.toMatch(/it might help to|you should/i);
      const starters = [
        "It sounds like",
        "I might be wrong, but",
        "What I'm hearing is",
        "That feels like a lot to carry",
        "It makes sense that this feels heavy",
      ];
      expect(starters.some((s) => result.includes(s))).toBe(true);
    });
  });

  describe("when perspective is requested but advice is not", () => {
    it("allows reflective statements", () => {
      const text =
        "What I'm hearing is you're overwhelmed. You could try taking a break.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: true,
      });
      expect(result).toMatch(/What I'm hearing is|overwhelmed/i);
    });

    it("rewrites action steps but keeps reflective content", () => {
      const text =
        "I think that's a lot to carry. One option is to talk to your manager.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: false,
        userAskedForPerspective: true,
      });
      expect(result).not.toMatch(/one option is to/i);
      expect(result).toMatch(/a lot to carry|that's/);
    });
  });

  describe("when advice is explicitly requested", () => {
    it("still removes banned phrases", () => {
      const text =
        "Since you asked: you should set boundaries. You need to say no sometimes.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: true,
        userAskedForPerspective: false,
      });
      expect(result).not.toMatch(/you should/i);
      expect(result).not.toMatch(/you need to/i);
    });

    it("preserves suggestions / advice-like content", () => {
      const text =
        "You could try writing down your priorities. One option is to talk to your manager.";
      const result = postProcessAssistantText(text, {
        userAskedForAdvice: true,
        userAskedForPerspective: false,
      });
      expect(result).toMatch(/you could try/i);
      expect(result).toMatch(/one option is to/i);
    });
  });

  it("returns empty or invalid input as-is (trimmed)", () => {
    expect(
      postProcessAssistantText("", {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      })
    ).toBe("");
    expect(
      postProcessAssistantText("   ", {
        userAskedForAdvice: false,
        userAskedForPerspective: false,
      })
    ).toBe("");
  });
});
