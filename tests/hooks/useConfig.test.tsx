import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ConfigProvider, useConfig } from "@/context/ConfigContext";
import type { ReactNode } from "react";

const mockedInvoke = vi.mocked(invoke);

const MOCK_OPENCODE = JSON.stringify({
  plugin: ["oh-my-openagent@3.14.0"],
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

function wrapper({ children }: { children: ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}

describe("useConfig", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("初始化时加载两个配置文件", async () => {
    mockedInvoke
      .mockResolvedValueOnce(MOCK_OPENCODE)
      .mockResolvedValueOnce(MOCK_OH_MY)
      .mockResolvedValueOnce("{}"); // read_auth

    const { result } = renderHook(() => useConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.openCodeConfig).toBeDefined();
    expect(result.current.ohMyOpenCodeConfig).toBeDefined();
    expect(mockedInvoke).toHaveBeenCalledWith("read_config", {
      filename: "opencode.json",
    });
  });

  it("updateAgent 更新 agent 模型并写入磁盘", async () => {
    mockedInvoke
      .mockResolvedValueOnce(MOCK_OPENCODE)
      .mockResolvedValueOnce(MOCK_OH_MY)
      .mockResolvedValueOnce("{}") // read_auth
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useConfig(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.updateAgent("sisyphus", {
        model: "openai/gpt-5.4",
        variant: "high",
      });
    });

    expect(result.current.ohMyOpenCodeConfig?.agents?.sisyphus.model).toBe(
      "openai/gpt-5.4",
    );
  });
});
