import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/context/ConfigContext", () => ({
  useConfig: () => ({
    openCodeConfig: {
      mcpServers: {
        "my-remote": {
          type: "remote",
          url: "https://mcp.example.com",
          enabled: true,
        },
        "my-local": {
          type: "local",
          command: ["node", "server.js"],
          env: { PORT: "3000" },
        },
      },
    },
    updateMcpServer: vi.fn(),
    deleteMcpServer: vi.fn(),
  }),
}));

import { McpList } from "@/components/mcp/McpList";

describe("McpList", () => {
  it("渲染所有 MCP 服务器卡片", () => {
    render(<McpList />);
    expect(screen.getByText("my-remote")).toBeInTheDocument();
    expect(screen.getByText("my-local")).toBeInTheDocument();
  });

  it("显示服务器类型标签", () => {
    render(<McpList />);
    expect(screen.getByText("remote")).toBeInTheDocument();
    expect(screen.getByText("local")).toBeInTheDocument();
  });
});
