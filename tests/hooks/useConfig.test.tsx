import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ConfigProvider, useConfig } from "@/context/ConfigContext";
import { parseJsonc } from "@/lib/config";
import type { ReactNode } from "react";

const mockedInvoke = vi.mocked(invoke);

const LEGACY_PATH = "/home/u/.config/opencode/oh-my-opencode.json";
const UNIFIED_PATH = "/home/u/.omo/omo.jsonc";

const opencodeWith = (plugin: string) =>
  JSON.stringify({
    plugin: [plugin],
    provider: {
      openai: {
        options: { baseURL: "https://api.openai.com/v1", apiKey: "sk-xxx" },
        models: { "gpt-5.4": { name: "GPT 5.4" } },
      },
    },
    mcp: {},
  });

const MOCK_OH_MY = JSON.stringify({
  agents: {
    sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" },
  },
  categories: {
    deep: { model: "openai/gpt-5.3-codex", variant: "medium" },
  },
});

/** 以命令名分发的 invoke 假实现，files 模拟磁盘 */
function mockBackend(files: Record<string, string>) {
  mockedInvoke.mockImplementation(async (cmd, args) => {
    const a = (args ?? {}) as Record<string, unknown>;
    switch (cmd) {
      case "config_file_exists":
        return `opencode/${a.filename}` in files;
      case "read_config":
        return files[`opencode/${a.filename}`];
      case "write_config":
        files[`opencode/${a.filename}`] = a.content as string;
        return undefined;
      case "read_auth":
        return "{}";
      case "resolve_plugin_config": {
        const major = a.pluginMajor as number | null;
        const path = major !== null && major < 5 ? LEGACY_PATH : UNIFIED_PATH;
        return { path, layout: path === LEGACY_PATH ? "legacy" : "unified", exists: path in files };
      }
      case "read_plugin_config":
        return files[a.path as string] ?? "";
      case "write_plugin_config":
        files[a.path as string] = a.content as string;
        return undefined;
      default:
        return undefined;
    }
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}

describe("useConfig", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("插件 <5 时读取 legacy 配置文件", async () => {
    mockBackend({
      "opencode/opencode.json": opencodeWith("oh-my-openagent@3.14.0"),
      [LEGACY_PATH]: MOCK_OH_MY,
    });

    const { result } = renderHook(() => useConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.pluginConfigLocation?.layout).toBe("legacy");
    expect(result.current.ohMyOpenCodeConfig?.agents?.sisyphus.model).toBe(
      "anthropic/claude-opus-4-6",
    );
    expect(mockedInvoke).toHaveBeenCalledWith("resolve_plugin_config", {
      pluginMajor: 3,
    });
  });

  it("优先读取 opencode.jsonc", async () => {
    mockBackend({
      "opencode/opencode.jsonc": `{ // c\n "plugin": ["oh-my-openagent@5.1.4"], }`,
    });

    const { result } = renderHook(() => useConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.openCodeConfig?.plugin).toEqual(["oh-my-openagent@5.1.4"]);
    expect(result.current.pluginConfigLocation?.layout).toBe("unified");
  });

  it("updateAgent 在 unified 布局下写入 [opencode] 块并保留注释", async () => {
    const files: Record<string, string> = {
      "opencode/opencode.json": opencodeWith("oh-my-openagent@5.1.4"),
      [UNIFIED_PATH]: `{\n  // mine\n  "[opencode]": { "agents": { "sisyphus": { "model": "a/b" } } }\n}\n`,
    };
    mockBackend(files);

    const { result } = renderHook(() => useConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.updateAgent("sisyphus", {
        model: "openai/gpt-5.4",
        variant: "high",
      });
    });

    expect(result.current.ohMyOpenCodeConfig?.agents?.sisyphus).toEqual({
      model: "openai/gpt-5.4",
      variant: "high",
    });
    expect(files[UNIFIED_PATH]).toContain("// mine");
    expect(parseJsonc<Record<string, any>>(files[UNIFIED_PATH])["[opencode]"].agents.sisyphus).toEqual({
      model: "openai/gpt-5.4",
      reasoning: "high",
    });
  });

  it("升级到 5.x 时改用新包名，并把 agents/categories 带入 omo.jsonc", async () => {
    const files: Record<string, string> = {
      "opencode/opencode.json": opencodeWith("oh-my-opencode@3.14.0"),
      [LEGACY_PATH]: MOCK_OH_MY,
    };
    mockBackend(files);

    const { result } = renderHook(() => useConfig(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePluginVersion("5.1.4");
    });

    expect(parseJsonc<{ plugin: string[] }>(files["opencode/opencode.json"]).plugin).toEqual([
      "oh-my-openagent@5.1.4",
    ]);
    expect(parseJsonc<Record<string, any>>(files[UNIFIED_PATH])["[opencode]"]).toEqual({
      agents: { sisyphus: { model: "anthropic/claude-opus-4-6", reasoning: "max" } },
      categories: { "deep-low": { model: "openai/gpt-5.3-codex", reasoning: "medium" } },
    });
    expect(result.current.pluginConfigLocation?.layout).toBe("unified");
    expect(result.current.ohMyOpenCodeConfig?.agents?.sisyphus.variant).toBe("max");
  });
});
