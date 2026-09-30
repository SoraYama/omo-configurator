import type { RecommendedModel } from "@/types/config";

/**
 * 官方推荐模型，同步自 oh-my-openagent 5.1.4 的
 * AGENT_MODEL_REQUIREMENTS / CATEGORY_MODEL_REQUIREMENTS（链首为推荐，其余为 fallback）
 */
export const RECOMMENDED_AGENTS: Record<string, RecommendedModel> = {
  sisyphus: {
    model: "anthropic/claude-opus-5-5",
    variant: "max",
    providers: ["anthropic", "github-copilot", "opencode"],
    fallbacks: [
      { model: "opencode-go/kimi-k3" },
      { model: "openai/gpt-5.6-sol", variant: "medium" },
      { model: "zai-coding-plan/glm-5.2" },
      { model: "opencode/big-pickle" },
    ],
  },
  hephaestus: {
    model: "openai/gpt-6-sol",
    variant: "medium",
    providers: ["openai", "chatgpt-subscription", "github-copilot", "opencode"],
    fallbacks: [
      { model: "openai/gpt-5.6-sol", variant: "medium" },
    ],
  },
  oracle: {
    model: "openai/gpt-5.6-sol",
    variant: "xhigh",
    providers: ["openai", "chatgpt-subscription", "opencode"],
    fallbacks: [
      { model: "github-copilot/gpt-5.6-sol", variant: "high" },
      { model: "google/gemini-3.1-pro", variant: "high" },
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "opencode-go/glm-5.2" },
    ],
  },
  librarian: {
    model: "kimi-for-coding/kimi-for-coding-highspeed",
    variant: "off",
    providers: ["kimi-for-coding"],
    fallbacks: [
      { model: "openai/gpt-6-luna-fast", variant: "low" },
      { model: "deepseek/deepseek-flash", variant: "max" },
      { model: "opencode-go/qwen3.7-plus" },
      { model: "opencode-go/minimax-m2.7" },
      { model: "anthropic/claude-haiku-4-5" },
    ],
  },
  explore: {
    model: "kimi-for-coding/kimi-for-coding-highspeed",
    variant: "off",
    providers: ["kimi-for-coding"],
    fallbacks: [
      { model: "openai/gpt-6-luna-fast", variant: "low" },
      { model: "deepseek/deepseek-flash", variant: "max" },
      { model: "opencode-go/qwen3.7-plus" },
      { model: "opencode-go/minimax-m2.7" },
      { model: "anthropic/claude-haiku-4-5" },
    ],
  },
  "multimodal-looker": {
    model: "openai/gpt-5.6-sol",
    variant: "low",
    providers: ["openai", "chatgpt-subscription", "opencode"],
    fallbacks: [
      { model: "opencode-go/kimi-k3" },
      { model: "zai-coding-plan/glm-4.6v" },
      { model: "openai/gpt-5-nano" },
    ],
  },
  prometheus: {
    model: "anthropic/claude-fable-5-1",
    variant: "xhigh",
    providers: ["anthropic", "github-copilot", "opencode"],
    fallbacks: [
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "opencode-go/kimi-k3", variant: "max" },
    ],
  },
  metis: {
    model: "anthropic/claude-fable-5-1",
    variant: "max",
    providers: ["anthropic", "github-copilot", "opencode"],
    fallbacks: [
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "opencode-go/kimi-k3", variant: "max" },
    ],
  },
  momus: {
    model: "openai/gpt-6-astra",
    variant: "xhigh",
    providers: ["openai", "chatgpt-subscription"],
    fallbacks: [
      { model: "github-copilot/gpt-6-astra", variant: "high" },
      { model: "openai/gpt-6-astra", variant: "high" },
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "google/gemini-3.1-pro", variant: "high" },
      { model: "opencode-go/glm-5.2" },
    ],
  },
  atlas: {
    model: "anthropic/claude-sonnet-5",
    providers: ["anthropic", "github-copilot", "opencode"],
    fallbacks: [
      { model: "opencode-go/kimi-k3" },
      { model: "openai/gpt-5.6-sol", variant: "medium" },
      { model: "opencode-go/minimax-m3" },
      { model: "minimax-coding-plan/MiniMax-M3" },
      { model: "opencode-go/minimax-m2.7" },
    ],
  },
  "sisyphus-junior": {
    model: "anthropic/claude-sonnet-5",
    providers: ["anthropic", "github-copilot", "opencode"],
    fallbacks: [
      { model: "opencode-go/kimi-k3" },
      { model: "openai/gpt-5.6-sol", variant: "medium" },
      { model: "opencode-go/minimax-m3" },
      { model: "minimax-coding-plan/MiniMax-M3" },
      { model: "opencode-go/minimax-m2.7" },
      { model: "opencode/big-pickle" },
    ],
  },
};

export const RECOMMENDED_CATEGORIES: Record<string, RecommendedModel> = {
  "visual-engineering": {
    model: "anthropic/claude-fable-5-1",
    variant: "max",
    providers: ["anthropic", "anthropic-api", "github-copilot", "opencode"],
    fallbacks: [
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "kimi-for-coding/kimi-k3", variant: "max" },
    ],
  },
  ultrabrain: {
    model: "openai/gpt-6-astra",
    variant: "max",
    providers: ["openai", "chatgpt-subscription"],
    fallbacks: [
      { model: "github-copilot/gpt-6-astra", variant: "max" },
      { model: "openai/gpt-6-astra", variant: "max" },
      { model: "openai/gpt-5.6-sol", variant: "max" },
      { model: "github-copilot/gpt-5.6-sol", variant: "max" },
      { model: "openai/gpt-5.6-sol", variant: "max" },
    ],
  },
  "deep-low": {
    model: "openai/gpt-6.1-sol",
    variant: "medium",
    providers: ["openai", "chatgpt-subscription"],
    fallbacks: [
      { model: "openai/gpt-6.1-sol-fast", variant: "medium" },
      { model: "openai/gpt-5.6-sol", variant: "medium" },
      { model: "openai/gpt-5.6-sol-fast", variant: "medium" },
    ],
  },
  "deep-high": {
    model: "openai/gpt-6-astra",
    variant: "xhigh",
    providers: ["openai", "chatgpt-subscription", "github-copilot", "opencode"],
    fallbacks: [
    ],
  },
  artistry: {
    model: "anthropic/claude-fable-5-1",
    variant: "max",
    providers: ["anthropic", "anthropic-api", "github-copilot", "opencode"],
    fallbacks: [
      { model: "anthropic/claude-opus-5-5", variant: "max" },
      { model: "kimi-for-coding/kimi-k3", variant: "max" },
    ],
  },
  quick: {
    model: "openai/gpt-6-luna-fast",
    variant: "low",
    providers: ["openai", "chatgpt-subscription"],
    fallbacks: [
      { model: "deepseek/deepseek-flash", variant: "off" },
      { model: "qwen-token-plan/qwen3.6-flash", variant: "low" },
      { model: "opencode-go/minimax-m3", variant: "max" },
      { model: "opencode-go/minimax-m2.7", variant: "max" },
      { model: "xai/grok-4.20-0309-non-reasoning" },
      { model: "anthropic/claude-haiku-4-5", variant: "off" },
      { model: "zai-coding-plan/glm-5.3-flash", variant: "low" },
      { model: "xiaomi/mimo-v2.6-flash", variant: "low" },
    ],
  },
  "unspecified-low": {
    model: "anthropic/claude-sonnet-5-5",
    variant: "medium",
    providers: ["anthropic", "anthropic-api", "github-copilot", "opencode"],
    fallbacks: [
      { model: "xiaomi/mimo-v2.6-pro", variant: "max" },
      { model: "xai/grok-4.7", variant: "xhigh" },
      { model: "openai/gpt-5.6-terra", variant: "high" },
      { model: "anthropic/claude-sonnet-5", variant: "low" },
      { model: "qwen-token-plan/qwen3.8-max-preview", variant: "max" },
      { model: "deepseek/deepseek-v4-pro", variant: "max" },
      { model: "xiaomi/mimo-v2.5-pro", variant: "max" },
    ],
  },
  "unspecified-high": {
    model: "anthropic/claude-opus-5-5",
    variant: "medium",
    providers: ["anthropic", "anthropic-api", "github-copilot", "opencode"],
    fallbacks: [
      { model: "zai-coding-plan/glm-5.3", variant: "max" },
      { model: "kimi-for-coding/kimi-k3", variant: "max" },
    ],
  },
  writing: {
    model: "anthropic/claude-opus-5-5",
    variant: "low",
    providers: ["anthropic", "anthropic-api", "github-copilot", "opencode"],
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ],
  },
};

/** 插件 5.x 的 category 改名：deep → deep-low */
const CATEGORY_ALIASES: Record<string, string> = { deep: "deep-low" };

export function getRecommendation(
  type: "agent" | "category",
  name: string,
): RecommendedModel | undefined {
  if (type === "agent") return RECOMMENDED_AGENTS[name];
  return RECOMMENDED_CATEGORIES[CATEGORY_ALIASES[name] ?? name];
}

function splitModel(model: string): [provider: string, id: string] {
  const slash = model.indexOf("/");
  return slash < 0 ? ["", model] : [model.slice(0, slash), model.slice(slash + 1)];
}

/** 当前选择是否与推荐一致：模型 id 相同、provider 属于推荐列表且推理强度相同 */
export function isRecommendedChoice(
  rec: RecommendedModel | undefined,
  model: string,
  variant: string | undefined,
): boolean {
  if (!rec || (rec.variant ?? "") !== (variant ?? "")) return false;
  if (rec.model === model) return true;
  const [provider, id] = splitModel(model);
  const [, recId] = splitModel(rec.model);
  return id === recId && (rec.providers ?? []).includes(provider);
}

/** 应用推荐时尽量沿用当前 provider（如 opencode/ 或 github-copilot/） */
export function recommendedModelFor(rec: RecommendedModel, currentModel: string): string {
  const [provider] = splitModel(currentModel);
  const [, recId] = splitModel(rec.model);
  return (rec.providers ?? []).includes(provider) ? `${provider}/${recId}` : rec.model;
}
