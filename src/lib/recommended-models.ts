import type { RecommendedModel } from "@/types/config";

export const RECOMMENDED_AGENTS: Record<string, RecommendedModel> = {
  sisyphus: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
      { model: "google/gemini-3.1-pro", variant: "high" },
    ],
  },
  hephaestus: {
    model: "openai/gpt-5.4",
    variant: "medium",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
      { model: "google/gemini-3.1-pro", variant: "medium" },
    ],
  },
  oracle: {
    model: "openai/gpt-5.4",
    variant: "high",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "high" },
    ],
  },
  librarian: {
    model: "opencode-go/minimax-m2.7",
    fallbacks: [
      { model: "openai/gpt-5.4-mini" },
    ],
  },
  explore: {
    model: "github-copilot/grok-code-fast-1",
    fallbacks: [
      { model: "openai/gpt-5.4-mini" },
    ],
  },
  "multimodal-looker": {
    model: "openai/gpt-5.4",
    variant: "medium",
    fallbacks: [
      { model: "google/gemini-3.1-pro", variant: "medium" },
    ],
  },
  prometheus: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  metis: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  momus: {
    model: "openai/gpt-5.4",
    variant: "xhigh",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ],
  },
  atlas: {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
  "sisyphus-junior": {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
};

export const RECOMMENDED_CATEGORIES: Record<string, RecommendedModel> = {
  "visual-engineering": {
    model: "google/gemini-3.1-pro",
    variant: "high",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  ultrabrain: {
    model: "openai/gpt-5.4",
    variant: "xhigh",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ],
  },
  deep: {
    model: "openai/gpt-5.3-codex",
    variant: "medium",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  artistry: {
    model: "google/gemini-3.1-pro",
    variant: "high",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  quick: {
    model: "openai/gpt-5.4-mini",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
    ],
  },
  "unspecified-low": {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
  "unspecified-high": {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  writing: {
    model: "kimi-for-coding/k2p5",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
    ],
  },
};

export function getRecommendation(
  type: "agent" | "category",
  name: string,
): RecommendedModel | undefined {
  if (type === "agent") return RECOMMENDED_AGENTS[name];
  return RECOMMENDED_CATEGORIES[name];
}
