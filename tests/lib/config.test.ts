import { describe, it, expect } from "vitest";
import type {
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  McpServer,
  Provider,
  AgentConfig,
  Snapshot,
  RecommendedModel,
} from "@/types/config";

describe("config types", () => {
  it("OpenCodeConfig 可以表示一个最小配置", () => {
    const config: OpenCodeConfig = {
      plugins: [{ name: "oh-my-opencode", version: "3.14.0" }],
      mcpServers: {},
      providers: {},
    };
    expect(config.plugins).toHaveLength(1);
  });

  it("OhMyOpenCodeConfig 可以表示 agent 和 category", () => {
    const config: OhMyOpenCodeConfig = {
      agents: {
        sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
      categories: {
        deep: { model: "openai/gpt-5.3-codex", variant: "medium" },
      },
    };
    expect(config.agents?.sisyphus.model).toBe("anthropic/claude-opus-4-6");
  });

  it("McpServer 可以区分 remote 和 local", () => {
    const remote: McpServer = {
      type: "remote",
      url: "https://example.com",
      headers: { Authorization: "Bearer xxx" },
      enabled: true,
    };
    const local: McpServer = {
      type: "local",
      command: ["node", "server.js"],
      env: { PORT: "3000" },
    };
    expect(remote.type).toBe("remote");
    expect(local.type).toBe("local");
  });

  it("Snapshot 有时间戳和文件引用", () => {
    const snap: Snapshot = {
      name: "2026-03-31_14-30-00",
      timestamp: Date.now(),
      files: { opencode: "content", ohMyOpencode: "content" },
    };
    expect(snap.name).toContain("2026");
  });

  it("RecommendedModel 包含 fallback 链", () => {
    const rec: RecommendedModel = {
      model: "anthropic/claude-opus-4-6",
      variant: "max",
      fallbacks: [
        { model: "openai/gpt-5.4", variant: "xhigh" },
        { model: "google/gemini-3.1-pro", variant: "high" },
      ],
    };
    expect(rec.fallbacks).toHaveLength(2);
  });
});
