import { describe, it, expect } from "vitest";
import {
  RECOMMENDED_AGENTS,
  RECOMMENDED_CATEGORIES,
  getRecommendation,
} from "@/lib/recommended-models";

describe("recommended-models", () => {
  it("包含所有 11 个 agent 推荐", () => {
    expect(Object.keys(RECOMMENDED_AGENTS)).toHaveLength(11);
  });

  it("包含所有 8 个 category 推荐", () => {
    expect(Object.keys(RECOMMENDED_CATEGORIES)).toHaveLength(8);
  });

  it("sisyphus 推荐 anthropic/claude-opus-4-6 max", () => {
    expect(RECOMMENDED_AGENTS.sisyphus.model).toBe("anthropic/claude-opus-4-6");
    expect(RECOMMENDED_AGENTS.sisyphus.variant).toBe("max");
  });

  it("deep category 推荐 openai/gpt-5.3-codex medium", () => {
    expect(RECOMMENDED_CATEGORIES.deep.model).toBe("openai/gpt-5.3-codex");
    expect(RECOMMENDED_CATEGORIES.deep.variant).toBe("medium");
  });

  it("getRecommendation 返回 agent 推荐", () => {
    const rec = getRecommendation("agent", "sisyphus");
    expect(rec).toBeDefined();
    expect(rec!.model).toBe("anthropic/claude-opus-4-6");
  });

  it("getRecommendation 返回 category 推荐", () => {
    const rec = getRecommendation("category", "ultrabrain");
    expect(rec).toBeDefined();
    expect(rec!.model).toBe("openai/gpt-5.4");
  });

  it("getRecommendation 对未知名称返回 undefined", () => {
    expect(getRecommendation("agent", "nonexistent")).toBeUndefined();
  });

  it("每个推荐都有 fallbacks 数组", () => {
    for (const rec of Object.values(RECOMMENDED_AGENTS)) {
      expect(Array.isArray(rec.fallbacks)).toBe(true);
      expect(rec.fallbacks.length).toBeGreaterThanOrEqual(1);
    }
  });
});
