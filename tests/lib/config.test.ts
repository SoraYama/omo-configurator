import { describe, it, expect } from "vitest";
import {
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  serializeConfig,
  extractModelsFromProviders,
  getOhMyOpenCodeVersion,
} from "@/lib/config";
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
      plugin: ["oh-my-openagent@3.14.0"],
      mcp: {},
      provider: {},
    };
    expect(config.plugin).toHaveLength(1);
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
      environment: { PORT: "3000" },
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

describe("parseOpenCodeConfig", () => {
  it("解析包含 provider 和 mcp 的完整配置", () => {
    const raw = JSON.stringify({
      plugin: ["oh-my-openagent@3.14.0"],
      mcp: {
        test: { type: "remote", url: "https://x.com" },
      },
      provider: {
        openai: {
          npm: "@ai-sdk/openai-compatible",
          options: { baseURL: "https://api.openai.com/v1", apiKey: "sk-xxx" },
          models: { "gpt-5.4": { name: "GPT 5.4" } },
        },
      },
    });
    const config = parseOpenCodeConfig(raw);
    expect(config.plugin).toHaveLength(1);
    expect(config.mcp?.test.type).toBe("remote");
    expect(config.provider?.openai.models?.["gpt-5.4"].name).toBe("GPT 5.4");
  });

  it("对无效 JSON 抛出明确错误", () => {
    expect(() => parseOpenCodeConfig("{invalid")).toThrow();
  });

  it("对空对象返回默认结构", () => {
    const config = parseOpenCodeConfig("{}");
    expect(config).toEqual({});
  });
});

describe("parseOhMyOpenCodeConfig", () => {
  it("解析包含 agents 和 categories 的配置", () => {
    const raw = JSON.stringify({
      agents: { sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" } },
      categories: { deep: { model: "openai/gpt-5.3-codex", variant: "medium" } },
    });
    const config = parseOhMyOpenCodeConfig(raw);
    expect(config.agents?.sisyphus.model).toBe("anthropic/claude-opus-4-6");
    expect(config.categories?.deep.variant).toBe("medium");
  });
});

describe("serializeConfig", () => {
  it("序列化为格式化的 JSON 字符串", () => {
    const config = { key: "value" };
    const result = serializeConfig(config);
    expect(result).toBe(JSON.stringify(config, null, 2));
  });
});

describe("extractModelsFromProviders", () => {
  it("从多个 provider 中聚合所有模型", () => {
    const providers: Record<string, Provider> = {
      openai: {
        models: {
          "gpt-5.4": { name: "GPT 5.4" },
          "gpt-5.4-mini": { name: "GPT 5.4 Mini" },
        },
      },
      anthropic: {
        models: { "claude-opus-4-6": { name: "Claude Opus 4.6" } },
      },
    };
    const models = extractModelsFromProviders(providers);
    expect(models).toEqual([
      "openai/gpt-5.4",
      "openai/gpt-5.4-mini",
      "anthropic/claude-opus-4-6",
    ]);
  });

  it("对空 providers 返回空数组", () => {
    expect(extractModelsFromProviders({})).toEqual([]);
  });

  it("provider 无 models 字段时跳过", () => {
    const providers: Record<string, Provider> = {
      openrouter: { options: { apiKey: "sk-xxx" } },
    };
    expect(extractModelsFromProviders(providers)).toEqual([]);
  });
});

describe("getOhMyOpenCodeVersion", () => {
  it("从 plugin 字符串数组中提取版本号（oh-my-openagent）", () => {
    const config: OpenCodeConfig = {
      plugin: ["other-plugin@1.0.0", "oh-my-openagent@3.14.0"],
    };
    expect(getOhMyOpenCodeVersion(config)).toBe("3.14.0");
  });

  it("支持 oh-my-opencode 名称格式", () => {
    const config: OpenCodeConfig = {
      plugin: ["oh-my-opencode@2.0.0"],
    };
    expect(getOhMyOpenCodeVersion(config)).toBe("2.0.0");
  });

  it("未找到插件时返回 undefined", () => {
    expect(getOhMyOpenCodeVersion({ plugin: [] })).toBeUndefined();
    expect(getOhMyOpenCodeVersion({})).toBeUndefined();
  });
});
