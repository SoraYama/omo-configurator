import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUpdateProvider = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/context/ConfigContext", () => ({
  useConfig: () => ({
    openCodeConfig: { provider: {} },
    updateProvider: mockUpdateProvider,
    deleteProvider: vi.fn(),
  }),
}));

import { ProviderEditor } from "@/components/provider/ProviderEditor";

describe("ProviderEditor", () => {
  it("渲染 provider 编辑表单", () => {
    render(
      <ProviderEditor
        name="openai"
        provider={{
          name: "openai",
          options: {
            baseURL: "https://api.openai.com",
            apiKey: "sk-xxx",
          },
          models: { "gpt-5.4": { name: "GPT 5.4" } },
        }}
      />,
    );
    expect(screen.getByDisplayValue("openai")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://api.openai.com")).toBeInTheDocument();
  });

  it("API Key 默认遮罩显示", () => {
    render(
      <ProviderEditor
        name="openai"
        provider={{
          name: "openai",
          options: { apiKey: "sk-supersecret" },
          models: {},
        }}
      />,
    );
    const input = screen.getByLabelText("API Key");
    expect(input).toHaveAttribute("type", "password");
  });

  it("修改显示名时保留模型的其它字段", () => {
    mockUpdateProvider.mockClear();
    render(
      <ProviderEditor
        name="minimax"
        provider={{
          models: {
            "MiniMax-M3": {
              name: "M3",
              limit: { context: 200000, output: 32000 },
              variants: { high: { reasoningEffort: "high" } },
            },
          },
        }}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("M3"), { target: { value: "MiniMax M3" } });
    expect(mockUpdateProvider).toHaveBeenLastCalledWith("minimax", {
      models: {
        "MiniMax-M3": {
          name: "MiniMax M3",
          limit: { context: 200000, output: 32000 },
          variants: { high: { reasoningEffort: "high" } },
        },
      },
    });
  });
});
