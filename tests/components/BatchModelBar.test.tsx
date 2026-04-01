import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockBatchReplace = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/context/ConfigContext", () => ({
  useConfig: () => ({
    ohMyOpenCodeConfig: {
      agents: {
        sisyphus: { model: "anthropic/claude-opus-4-6", variant: "max" },
        hephaestus: { model: "openai/gpt-5.4", variant: "medium" },
      },
      categories: {},
    },
    openCodeConfig: {
      providers: {
        anthropic: { name: "anthropic", models: [{ name: "claude-opus-4-6" }] },
        openai: { name: "openai", models: [{ name: "gpt-5.4" }] },
      },
    },
    batchReplaceModel: mockBatchReplace,
  }),
}));

import { BatchModelBar } from "@/components/agents/BatchModelBar";

describe("BatchModelBar", () => {
  it("渲染批量替换界面", () => {
    render(<BatchModelBar />);
    expect(screen.getByText("批量替换")).toBeInTheDocument();
    expect(screen.getByText("应用")).toBeInTheDocument();
  });
});
