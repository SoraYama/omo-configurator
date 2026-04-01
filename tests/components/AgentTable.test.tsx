import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
    },
    openCodeConfig: {
      provider: {
        anthropic: { models: { "claude-opus-4-6": { name: "Claude Opus 4.6" } } },
        openai: { models: { "gpt-5.4": { name: "GPT 5.4" } } },
      },
    },
    updateAgent: vi.fn(),
  }),
}));

import { AgentTable } from "@/components/agents/AgentTable";

describe("AgentTable", () => {
  it("渲染所有 agent 名称", () => {
    render(<AgentTable />);
    expect(screen.getByText("sisyphus")).toBeInTheDocument();
    expect(screen.getByText("hephaestus")).toBeInTheDocument();
  });

  it("显示每个 agent 的当前模型", () => {
    render(<AgentTable />);
    expect(screen.getByText("anthropic/claude-opus-4-6")).toBeInTheDocument();
    expect(screen.getByText("openai/gpt-5.4")).toBeInTheDocument();
  });
});
