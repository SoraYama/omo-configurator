import { describe, it, expect } from "vitest";
import {
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  serializeConfig,
  extractModelsFromProviders,
  getOhMyOpenCodeVersion,
  getPluginMajor,
  parseJsonc,
  applyJsoncChanges,
  pluginEntryChanges,
  buildUnifiedSeed,
  reasoningOptions,
  OMO_SCHEMA_URL,
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

describe("getOhMyOpenCodeVersion 兼容写法", () => {
  it("支持 npm: 前缀与作者 scope", () => {
    expect(getOhMyOpenCodeVersion({ plugin: ["npm:oh-my-openagent@5.1.4"] })).toBe("5.1.4");
    expect(
      getOhMyOpenCodeVersion({ plugin: ["@code-yeongyu/oh-my-openagent@5.0.0"] }),
    ).toBe("5.0.0");
  });

  it("未固定版本时返回 undefined", () => {
    expect(getOhMyOpenCodeVersion({ plugin: ["oh-my-openagent"] })).toBeUndefined();
  });

  it("支持 [包名, 选项] 元组写法", () => {
    expect(
      getOhMyOpenCodeVersion({ plugin: [["oh-my-openagent@5.1.4", { debug: true }]] }),
    ).toBe("5.1.4");
  });
});

describe("getPluginMajor", () => {
  it("解析主版本号", () => {
    expect(getPluginMajor("3.14.0")).toBe(3);
    expect(getPluginMajor("5.1.4")).toBe(5);
  });

  it("latest 或缺失时返回 undefined", () => {
    expect(getPluginMajor("latest")).toBeUndefined();
    expect(getPluginMajor(undefined)).toBeUndefined();
  });
});

describe("JSONC 读写", () => {
  it("parseJsonc 支持注释与尾逗号", () => {
    expect(parseJsonc('{ // c\n "a": 1, }')).toEqual({ a: 1 });
  });

  it("parseOpenCodeConfig 接受 opencode.jsonc 内容", () => {
    expect(parseOpenCodeConfig('{ /* c */ "plugin": ["x@1"], }').plugin).toEqual(["x@1"]);
  });

  it("applyJsoncChanges 保留注释并支持删除", () => {
    const raw = '{\n  // keep me\n  "a": 1,\n  "b": 2\n}\n';
    const out = applyJsoncChanges(raw, [
      { path: ["a"], value: 3 },
      { path: ["b"], value: undefined },
      { path: ["missing", "deep"], value: undefined },
    ]);
    expect(out).toContain("// keep me");
    expect(parseJsonc(out)).toEqual({ a: 3 });
  });
});

describe("unified 布局（~/.omo/omo.jsonc）", () => {
  const raw = `{
  // 共享层
  "agents": { "oracle": { "model": "openai/gpt-5.6-sol", "reasoning": "high" } },
  "[opencode]": {
    "agents": {
      "oracle": { "reasoning": "xhigh" },
      "atlas": { "models": [{ "model": "anthropic/claude-sonnet-5", "reasoning": "low" }, "opencode-go/kimi-k3"] },
    },
    "categories": { "quick": { "model": "openai/gpt-6-luna-fast", "variant": "low" } },
  },
}`;

  it("合并共享层与 [opencode] 块，reasoning 映射为 variant", () => {
    const view = parseOhMyOpenCodeConfig(raw, "unified");
    expect(view.agents?.oracle).toEqual({ model: "openai/gpt-5.6-sol", variant: "xhigh" });
    expect(view.agents?.atlas).toEqual({ model: "anthropic/claude-sonnet-5", variant: "low" });
    expect(view.categories?.quick).toEqual({ model: "openai/gpt-6-luna-fast", variant: "low" });
  });

  it("写入 [opencode] 块的 reasoning 并移除已弃用的 variant", () => {
    const out = applyJsoncChanges(
      raw,
      pluginEntryChanges(raw, "unified", "categories", "quick", {
        model: "openai/gpt-6-luna-fast",
        variant: "medium",
      }),
    );
    const doc = parseJsonc<Record<string, any>>(out);
    expect(doc["[opencode]"].categories.quick).toEqual({
      model: "openai/gpt-6-luna-fast",
      reasoning: "medium",
    });
    expect(out).toContain("// 共享层");
  });

  it("使用 models 链的条目替换链首", () => {
    const out = applyJsoncChanges(
      raw,
      pluginEntryChanges(raw, "unified", "agents", "atlas", { model: "opencode/claude-sonnet-5" }),
    );
    const atlas = parseJsonc<Record<string, any>>(out)["[opencode]"].agents.atlas;
    expect(atlas.models).toEqual(["opencode/claude-sonnet-5", "opencode-go/kimi-k3"]);
    expect(atlas.model).toBeUndefined();
  });

  it("在空文件中创建 [opencode] 块", () => {
    const out = applyJsoncChanges(
      "",
      pluginEntryChanges("", "unified", "agents", "explore", { model: "a/b", variant: "low" }),
    );
    expect(parseJsonc(out)).toEqual({
      "[opencode]": { agents: { explore: { model: "a/b", reasoning: "low" } } },
    });
  });

  it("legacy 布局仍写入顶层 variant", () => {
    const legacy = JSON.stringify({ agents: { oracle: { model: "x/y", variant: "high" } } });
    const out = applyJsoncChanges(
      legacy,
      pluginEntryChanges(legacy, "legacy", "agents", "oracle", { model: "x/z" }),
    );
    expect(parseJsonc(out)).toEqual({ agents: { oracle: { model: "x/z" } } });
  });
});

describe("buildUnifiedSeed", () => {
  it("把 legacy agents/categories 转换进 [opencode] 块，deep 改名为 deep-low", () => {
    const seed = parseJsonc<Record<string, any>>(
      buildUnifiedSeed({
        agents: { oracle: { model: "openai/gpt-5.4", variant: "high" } },
        categories: { deep: { model: "openai/gpt-5.3-codex" } },
      }),
    );
    expect(seed.$schema).toBe(OMO_SCHEMA_URL);
    expect(seed["[opencode]"]).toEqual({
      agents: { oracle: { model: "openai/gpt-5.4", reasoning: "high" } },
      categories: { "deep-low": { model: "openai/gpt-5.3-codex" } },
    });
  });
});

describe("reasoningOptions", () => {
  it("unified 布局提供完整 reasoning 取值", () => {
    expect(reasoningOptions("unified")).toEqual([
      "__none", "off", "minimal", "low", "medium", "high", "xhigh", "max", "auto",
    ]);
  });

  it("当前值不在列表中时追加", () => {
    expect(reasoningOptions("legacy", "low")).toContain("low");
  });
});
