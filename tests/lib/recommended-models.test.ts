import { describe, it, expect } from "vitest";
import {
  RECOMMENDED_AGENTS,
  RECOMMENDED_CATEGORIES,
  getRecommendation,
  isRecommendedChoice,
  recommendedModelFor,
} from "@/lib/recommended-models";

describe("recommended-models", () => {
  it("包含所有 11 个 agent 推荐", () => {
    expect(Object.keys(RECOMMENDED_AGENTS)).toHaveLength(11);
  });

  it("包含插件 5.x 的 9 个 category 推荐（deep 拆分为 deep-low / deep-high）", () => {
    expect(Object.keys(RECOMMENDED_CATEGORIES)).toHaveLength(9);
    expect(RECOMMENDED_CATEGORIES).toHaveProperty("deep-low");
    expect(RECOMMENDED_CATEGORIES).toHaveProperty("deep-high");
    expect(RECOMMENDED_CATEGORIES).not.toHaveProperty("deep");
  });

  it("sisyphus 推荐 anthropic/claude-opus-5-5 max", () => {
    expect(RECOMMENDED_AGENTS.sisyphus.model).toBe("anthropic/claude-opus-5-5");
    expect(RECOMMENDED_AGENTS.sisyphus.variant).toBe("max");
  });

  it("getRecommendation 返回 agent 推荐", () => {
    expect(getRecommendation("agent", "oracle")?.model).toBe("openai/gpt-5.6-sol");
  });

  it("getRecommendation 将旧 category 名 deep 映射到 deep-low", () => {
    expect(getRecommendation("category", "deep")).toBe(
      RECOMMENDED_CATEGORIES["deep-low"],
    );
  });

  it("getRecommendation 对未知名称返回 undefined", () => {
    expect(getRecommendation("agent", "nonexistent")).toBeUndefined();
  });

  it("每个 agent 推荐都有 fallbacks 数组", () => {
    for (const rec of Object.values(RECOMMENDED_AGENTS)) {
      expect(Array.isArray(rec.fallbacks)).toBe(true);
      expect(rec.fallbacks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("isRecommendedChoice", () => {
  const rec = RECOMMENDED_AGENTS.sisyphus;

  it("推荐 provider 列表中的任一 provider 都算匹配", () => {
    expect(isRecommendedChoice(rec, "anthropic/claude-opus-5-5", "max")).toBe(true);
    expect(isRecommendedChoice(rec, "opencode/claude-opus-5-5", "max")).toBe(true);
  });

  it("provider 不在列表中或推理强度不同则不匹配", () => {
    expect(isRecommendedChoice(rec, "openrouter/claude-opus-5-5", "max")).toBe(false);
    expect(isRecommendedChoice(rec, "anthropic/claude-opus-5-5", "high")).toBe(false);
    expect(isRecommendedChoice(undefined, "anthropic/claude-opus-5-5", "max")).toBe(false);
  });
});

describe("recommendedModelFor", () => {
  const rec = RECOMMENDED_AGENTS.sisyphus;

  it("当前 provider 可用时沿用当前 provider", () => {
    expect(recommendedModelFor(rec, "opencode/claude-opus-4-6")).toBe(
      "opencode/claude-opus-5-5",
    );
  });

  it("否则使用推荐的首选 provider", () => {
    expect(recommendedModelFor(rec, "zhipuai-coding-plan/glm-5.1")).toBe(
      "anthropic/claude-opus-5-5",
    );
  });
});
