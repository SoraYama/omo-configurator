import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockUpdateProvider = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/context/ConfigContext", () => ({
  useConfig: () => ({
    openCodeConfig: { providers: {} },
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
          baseURL: "https://api.openai.com",
          apiKey: "sk-xxx",
          models: [{ name: "gpt-5.4", displayName: "GPT 5.4" }],
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
          apiKey: "sk-supersecret",
          models: [],
        }}
      />,
    );
    const input = screen.getByLabelText("API Key");
    expect(input).toHaveAttribute("type", "password");
  });
});
