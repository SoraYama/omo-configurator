import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/context/ConfigContext", () => ({
  useConfig: () => ({
    openCodeConfig: {
      mcp: {
        "my-remote": {
          type: "remote",
          url: "https://mcp.example.com",
          enabled: true,
        },
        "my-local": {
          type: "local",
          command: ["node", "server.js"],
          environment: { PORT: "3000" },
        },
        "inherited": { enabled: false },
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

  it("只覆盖启用状态的条目可以渲染和展开", () => {
    render(<McpList />);
    expect(screen.getByText("仅覆盖")).toBeInTheDocument();
    fireEvent.click(screen.getByText("inherited"));
    expect(screen.getByText(/只覆盖启用状态/)).toBeInTheDocument();
  });
});
