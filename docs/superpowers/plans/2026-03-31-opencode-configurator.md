# OpenCode Configurator 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Tauri v2 + React + shadcn/ui 的桌面 GUI 工具，用于可视化编辑 opencode.json 和 oh-my-opencode.json 配置文件。

**Architecture:** Tauri v2 提供 Rust 后端处理文件 I/O 和快照管理，React 前端通过 IPC 调用后端命令。状态管理使用 React Context + useReducer，所有编辑即时写入磁盘。UI 分为三个标签页（Agents & Categories / MCP Servers / Providers）+ 侧边栏快照管理。

**Tech Stack:** Tauri v2, React 19, TypeScript, Vite, shadcn/ui (Radix + Tailwind CSS v4), Vitest

---

## 文件结构

```
opencode-configurator/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json
│   └── src/
│       ├── lib.rs              # Tauri 插件注册、命令注册
│       ├── commands.rs          # 文件读写 IPC 命令
│       └── snapshots.rs         # 快照文件管理命令
├── src/
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 主布局：TopBar + TabBar + 内容区 + Sidebar
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 生成的组件（button, table, dialog 等）
│   │   ├── layout/
│   │   │   ├── TopBar.tsx       # 文件切换 + 版本检查
│   │   │   ├── Sidebar.tsx      # 快照列表
│   │   │   └── TabBar.tsx       # 三个主标签页
│   │   ├── agents/
│   │   │   ├── AgentTable.tsx   # Agent 配置表格
│   │   │   ├── CategoryTable.tsx # Category 配置表格
│   │   │   └── BatchModelBar.tsx # 批量模型替换工具栏
│   │   ├── mcp/
│   │   │   ├── McpList.tsx      # MCP 服务器列表
│   │   │   └── McpEditor.tsx    # 单个 MCP 编辑表单
│   │   ├── provider/
│   │   │   ├── ProviderList.tsx # Provider 列表
│   │   │   └── ProviderEditor.tsx # Provider 编辑器
│   │   └── shared/
│   │       ├── ModelSelect.tsx  # 可复用的模型下拉选择
│   │       ├── JsonPreview.tsx  # JSON 预览/直接编辑
│   │       └── ConfirmDialog.tsx # 确认对话框
│   ├── hooks/
│   │   └── useConfig.ts        # 配置文件读写 hook
│   ├── lib/
│   │   ├── config.ts           # 配置解析与序列化
│   │   ├── snapshots.ts        # 快照管理前端逻辑
│   │   └── recommended-models.ts # 官方推荐模型数据
│   ├── types/
│   │   └── config.ts           # TypeScript 类型定义
│   └── context/
│       └── ConfigContext.tsx    # 全局配置状态 Context
├── tests/
│   ├── lib/
│   │   ├── config.test.ts      # 配置解析测试
│   │   ├── recommended-models.test.ts
│   │   └── snapshots.test.ts
│   ├── hooks/
│   │   └── useConfig.test.tsx
│   └── components/
│       ├── AgentTable.test.tsx
│       ├── BatchModelBar.test.tsx
│       ├── McpList.test.tsx
│       └── ProviderEditor.test.tsx
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── components.json             # shadcn/ui 配置
├── index.html
└── README.md
```

---

### Task 1: 项目脚手架搭建

**Files:**
- Create: 整个项目目录（由 `create-tauri-app` 生成）
- Modify: `package.json` — 添加测试依赖
- Modify: `src-tauri/tauri.conf.json` — 配置 fs scope
- Modify: `src-tauri/capabilities/default.json` — 添加 fs 权限

- [ ] **Step 1: 用 Tauri CLI 创建项目**

```bash
cd /Users/sorayama/Projects/personal/opencode-configurator
npm create tauri-app@latest . -- --template react-ts --manager npm --yes
```

如果提示目录不为空（因为 docs 和 .claude 已存在），选择继续。如果 `create-tauri-app` 不支持 `.` 目录参数，则在临时目录创建后复制过来：

```bash
cd /tmp
npm create tauri-app@latest opencode-configurator-init -- --template react-ts --manager npm --yes
cp -rn /tmp/opencode-configurator-init/* /Users/sorayama/Projects/personal/opencode-configurator/
cp -rn /tmp/opencode-configurator-init/.* /Users/sorayama/Projects/personal/opencode-configurator/ 2>/dev/null || true
rm -rf /tmp/opencode-configurator-init
cd /Users/sorayama/Projects/personal/opencode-configurator
```

- [ ] **Step 2: 安装前端依赖**

```bash
cd /Users/sorayama/Projects/personal/opencode-configurator
npm install
```

- [ ] **Step 3: 安装 shadcn/ui 和 Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
npm install tailwind-merge clsx class-variance-authority lucide-react
npm install @radix-ui/react-slot
```

在 `src/index.css` 顶部添加：

```css
@import "tailwindcss";
```

在 `vite.config.ts` 中添加 Tailwind 插件：

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: "ws", host, port: 1421 }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
}));
```

- [ ] **Step 4: 初始化 shadcn/ui**

```bash
npx shadcn@latest init -d
```

然后安装需要的 shadcn/ui 组件：

```bash
npx shadcn@latest add button table dialog select tabs input label badge tooltip dropdown-menu scroll-area separator card switch textarea
```

- [ ] **Step 5: 安装测试依赖**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

创建 `vitest.config.ts`：

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

创建 `tests/setup.ts`：

```typescript
import "@testing-library/jest-dom/vitest";
```

在 `package.json` 的 `scripts` 中添加：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: 配置 Tauri fs 权限**

修改 `src-tauri/capabilities/default.json`，添加文件系统读写权限：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME/.config/opencode/**" }
      ]
    },
    {
      "identifier": "fs:allow-write",
      "allow": [
        { "path": "$HOME/.config/opencode/**" }
      ]
    },
    {
      "identifier": "fs:allow-exists",
      "allow": [
        { "path": "$HOME/.config/opencode/**" }
      ]
    },
    {
      "identifier": "fs:allow-mkdir",
      "allow": [
        { "path": "$HOME/.config/opencode/.snapshots/**" }
      ]
    },
    "http:default"
  ]
}
```

在 `src-tauri/Cargo.toml` 的 `[dependencies.tauri]` 中启用 features：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-http = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 7: 验证脚手架能运行**

```bash
cd /Users/sorayama/Projects/personal/opencode-configurator
npm run tauri dev
```

预期：Tauri 窗口打开，显示默认 React 页面。关闭窗口。

- [ ] **Step 8: 提交**

```bash
git init
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
src-tauri/target/
.DS_Store
GITIGNORE
git add -A
git commit -m "chore: 初始化 Tauri + React + shadcn/ui 项目脚手架"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types/config.ts`
- Test: `tests/lib/config.test.ts`（仅验证类型可用性的烟雾测试）

- [ ] **Step 1: 编写类型定义**

创建 `src/types/config.ts`：

```typescript
/** oh-my-opencode.json 中的 agent 配置 */
export interface AgentConfig {
  model: string;
  variant?: string;
}

/** oh-my-opencode.json 中的 category 配置 */
export interface CategoryConfig {
  model: string;
  variant?: string;
}

/** oh-my-opencode.json 中的 claude_code 设置 */
export interface ClaudeCodeSettings {
  [key: string]: unknown;
}

/** oh-my-opencode.json 完整结构 */
export interface OhMyOpenCodeConfig {
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  claude_code?: ClaudeCodeSettings;
}

/** opencode.json 中的 MCP 服务器（远程） */
export interface McpServerRemote {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

/** opencode.json 中的 MCP 服务器（本地） */
export interface McpServerLocal {
  type: "local";
  command: string[];
  env?: Record<string, string>;
  enabled?: boolean;
}

export type McpServer = McpServerRemote | McpServerLocal;

/** opencode.json 中的模型定义 */
export interface ProviderModel {
  name: string;
  displayName?: string;
}

/** opencode.json 中的 Provider */
export interface Provider {
  name: string;
  npm?: string;
  baseURL?: string;
  apiKey?: string;
  models: ProviderModel[];
}

/** opencode.json 中的插件定义 */
export interface Plugin {
  name: string;
  version: string;
  [key: string]: unknown;
}

/** opencode.json 完整结构 */
export interface OpenCodeConfig {
  plugins?: Plugin[];
  mcpServers?: Record<string, McpServer>;
  providers?: Record<string, Provider>;
  [key: string]: unknown;
}

/** 快照元信息 */
export interface Snapshot {
  name: string;
  timestamp: number;
  files: {
    opencode?: string;
    ohMyOpencode?: string;
  };
}

/** 应用当前编辑的配置文件类型 */
export type ConfigFileType = "opencode" | "oh-my-opencode";

/** 推荐模型条目 */
export interface RecommendedModel {
  model: string;
  variant?: string;
  fallbacks: Array<{ model: string; variant?: string }>;
}
```

- [ ] **Step 2: 编写类型烟雾测试**

创建 `tests/lib/config.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
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
      plugins: [{ name: "oh-my-opencode", version: "3.14.0" }],
      mcpServers: {},
      providers: {},
    };
    expect(config.plugins).toHaveLength(1);
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
      env: { PORT: "3000" },
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
```

- [ ] **Step 3: 运行测试验证通过**

```bash
npm run test -- tests/lib/config.test.ts
```

预期：5 个测试全部 PASS。

- [ ] **Step 4: 提交**

```bash
git add src/types/config.ts tests/lib/config.test.ts
git commit -m "feat: 定义配置文件 TypeScript 类型"
```

---

### Task 3: 官方推荐模型数据

**Files:**
- Create: `src/lib/recommended-models.ts`
- Test: `tests/lib/recommended-models.test.ts`

- [ ] **Step 1: 编写测试**

创建 `tests/lib/recommended-models.test.ts`：

```typescript
import { describe, it, expect } from "vitest";
import {
  RECOMMENDED_AGENTS,
  RECOMMENDED_CATEGORIES,
  getRecommendation,
} from "@/lib/recommended-models";

describe("recommended-models", () => {
  it("包含所有 11 个 agent 推荐", () => {
    expect(Object.keys(RECOMMENDED_AGENTS)).toHaveLength(11);
  });

  it("包含所有 8 个 category 推荐", () => {
    expect(Object.keys(RECOMMENDED_CATEGORIES)).toHaveLength(8);
  });

  it("sisyphus 推荐 anthropic/claude-opus-4-6 max", () => {
    expect(RECOMMENDED_AGENTS.sisyphus.model).toBe("anthropic/claude-opus-4-6");
    expect(RECOMMENDED_AGENTS.sisyphus.variant).toBe("max");
  });

  it("deep category 推荐 openai/gpt-5.3-codex medium", () => {
    expect(RECOMMENDED_CATEGORIES.deep.model).toBe("openai/gpt-5.3-codex");
    expect(RECOMMENDED_CATEGORIES.deep.variant).toBe("medium");
  });

  it("getRecommendation 返回 agent 推荐", () => {
    const rec = getRecommendation("agent", "sisyphus");
    expect(rec).toBeDefined();
    expect(rec!.model).toBe("anthropic/claude-opus-4-6");
  });

  it("getRecommendation 返回 category 推荐", () => {
    const rec = getRecommendation("category", "ultrabrain");
    expect(rec).toBeDefined();
    expect(rec!.model).toBe("openai/gpt-5.4");
  });

  it("getRecommendation 对未知名称返回 undefined", () => {
    expect(getRecommendation("agent", "nonexistent")).toBeUndefined();
  });

  it("每个推荐都有 fallbacks 数组", () => {
    for (const rec of Object.values(RECOMMENDED_AGENTS)) {
      expect(Array.isArray(rec.fallbacks)).toBe(true);
      expect(rec.fallbacks.length).toBeGreaterThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/lib/recommended-models.test.ts
```

预期：FAIL — 模块不存在。

- [ ] **Step 3: 实现推荐模型数据**

创建 `src/lib/recommended-models.ts`：

```typescript
import type { RecommendedModel } from "@/types/config";

export const RECOMMENDED_AGENTS: Record<string, RecommendedModel> = {
  sisyphus: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
      { model: "google/gemini-3.1-pro", variant: "high" },
    ],
  },
  hephaestus: {
    model: "openai/gpt-5.4",
    variant: "medium",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
      { model: "google/gemini-3.1-pro", variant: "medium" },
    ],
  },
  oracle: {
    model: "openai/gpt-5.4",
    variant: "high",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "high" },
    ],
  },
  librarian: {
    model: "opencode-go/minimax-m2.7",
    fallbacks: [
      { model: "openai/gpt-5.4-mini" },
    ],
  },
  explore: {
    model: "github-copilot/grok-code-fast-1",
    fallbacks: [
      { model: "openai/gpt-5.4-mini" },
    ],
  },
  "multimodal-looker": {
    model: "openai/gpt-5.4",
    variant: "medium",
    fallbacks: [
      { model: "google/gemini-3.1-pro", variant: "medium" },
    ],
  },
  prometheus: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  metis: {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  momus: {
    model: "openai/gpt-5.4",
    variant: "xhigh",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ],
  },
  atlas: {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
  "sisyphus-junior": {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
};

export const RECOMMENDED_CATEGORIES: Record<string, RecommendedModel> = {
  "visual-engineering": {
    model: "google/gemini-3.1-pro",
    variant: "high",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  ultrabrain: {
    model: "openai/gpt-5.4",
    variant: "xhigh",
    fallbacks: [
      { model: "anthropic/claude-opus-4-6", variant: "max" },
    ],
  },
  deep: {
    model: "openai/gpt-5.3-codex",
    variant: "medium",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  artistry: {
    model: "google/gemini-3.1-pro",
    variant: "high",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "high" },
    ],
  },
  quick: {
    model: "openai/gpt-5.4-mini",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
    ],
  },
  "unspecified-low": {
    model: "anthropic/claude-sonnet-4-6",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "medium" },
    ],
  },
  "unspecified-high": {
    model: "anthropic/claude-opus-4-6",
    variant: "max",
    fallbacks: [
      { model: "openai/gpt-5.4", variant: "xhigh" },
    ],
  },
  writing: {
    model: "kimi-for-coding/k2p5",
    fallbacks: [
      { model: "anthropic/claude-sonnet-4-6" },
    ],
  },
};

export function getRecommendation(
  type: "agent" | "category",
  name: string,
): RecommendedModel | undefined {
  if (type === "agent") return RECOMMENDED_AGENTS[name];
  return RECOMMENDED_CATEGORIES[name];
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/lib/recommended-models.test.ts
```

预期：8 个测试全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/recommended-models.ts tests/lib/recommended-models.test.ts
git commit -m "feat: 添加官方推荐模型数据"
```

---

### Task 4: 配置解析与序列化

**Files:**
- Create: `src/lib/config.ts`
- Test: `tests/lib/config.test.ts`（在已有文件中追加用例）

- [ ] **Step 1: 编写配置解析测试**

在 `tests/lib/config.test.ts` 中追加以下测试（保留原有类型测试）：

```typescript
import {
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  serializeConfig,
  extractModelsFromProviders,
  getOhMyOpenCodeVersion,
} from "@/lib/config";

describe("parseOpenCodeConfig", () => {
  it("解析包含 providers 和 mcpServers 的完整配置", () => {
    const raw = JSON.stringify({
      plugins: [{ name: "oh-my-opencode", version: "3.14.0" }],
      mcpServers: {
        test: { type: "remote", url: "https://x.com" },
      },
      providers: {
        openai: {
          name: "openai",
          baseURL: "https://api.openai.com",
          apiKey: "sk-xxx",
          models: [{ name: "gpt-5.4", displayName: "GPT 5.4" }],
        },
      },
    });
    const config = parseOpenCodeConfig(raw);
    expect(config.plugins).toHaveLength(1);
    expect(config.mcpServers?.test.type).toBe("remote");
    expect(config.providers?.openai.models).toHaveLength(1);
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
        name: "openai",
        models: [
          { name: "gpt-5.4", displayName: "GPT 5.4" },
          { name: "gpt-5.4-mini" },
        ],
      },
      anthropic: {
        name: "anthropic",
        models: [{ name: "claude-opus-4-6" }],
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
});

describe("getOhMyOpenCodeVersion", () => {
  it("从 plugins 中提取 oh-my-opencode 版本", () => {
    const config: OpenCodeConfig = {
      plugins: [
        { name: "other-plugin", version: "1.0.0" },
        { name: "oh-my-opencode", version: "3.14.0" },
      ],
    };
    expect(getOhMyOpenCodeVersion(config)).toBe("3.14.0");
  });

  it("未找到插件时返回 undefined", () => {
    expect(getOhMyOpenCodeVersion({ plugins: [] })).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/lib/config.test.ts
```

预期：新增的 describe 块全部 FAIL（模块不存在）。

- [ ] **Step 3: 实现配置解析模块**

创建 `src/lib/config.ts`：

```typescript
import type {
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  Provider,
} from "@/types/config";

export function parseOpenCodeConfig(raw: string): OpenCodeConfig {
  return JSON.parse(raw) as OpenCodeConfig;
}

export function parseOhMyOpenCodeConfig(raw: string): OhMyOpenCodeConfig {
  return JSON.parse(raw) as OhMyOpenCodeConfig;
}

export function serializeConfig(config: unknown): string {
  return JSON.stringify(config, null, 2);
}

export function extractModelsFromProviders(
  providers: Record<string, Provider>,
): string[] {
  const models: string[] = [];
  for (const [providerName, provider] of Object.entries(providers)) {
    for (const model of provider.models) {
      models.push(`${providerName}/${model.name}`);
    }
  }
  return models;
}

export function getOhMyOpenCodeVersion(
  config: OpenCodeConfig,
): string | undefined {
  return config.plugins?.find((p) => p.name === "oh-my-opencode")?.version;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/lib/config.test.ts
```

预期：所有测试 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/config.ts tests/lib/config.test.ts
git commit -m "feat: 实现配置文件解析与序列化工具函数"
```

---

### Task 5: Tauri Rust 后端 — 文件读写与快照命令

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/src/commands.rs`
- Create: `src-tauri/src/snapshots.rs`

- [ ] **Step 1: 实现文件读写命令**

创建 `src-tauri/src/commands.rs`：

```rust
use std::fs;
use std::path::PathBuf;

fn config_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode")
}

#[tauri::command]
pub fn read_config(filename: &str) -> Result<String, String> {
    let path = config_dir().join(filename);
    fs::read_to_string(&path).map_err(|e| format!("读取 {} 失败: {}", filename, e))
}

#[tauri::command]
pub fn write_config(filename: &str, content: &str) -> Result<(), String> {
    let path = config_dir().join(filename);
    fs::write(&path, content).map_err(|e| format!("写入 {} 失败: {}", filename, e))
}

#[tauri::command]
pub fn config_file_exists(filename: &str) -> bool {
    config_dir().join(filename).exists()
}
```

- [ ] **Step 2: 实现快照管理命令**

创建 `src-tauri/src/snapshots.rs`：

```rust
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

fn snapshots_dir() -> PathBuf {
    let home = dirs::home_dir().expect("无法获取 home 目录");
    home.join(".config").join("opencode").join(".snapshots")
}

#[derive(Serialize, Deserialize)]
pub struct SnapshotInfo {
    pub name: String,
    pub timestamp: u64,
}

#[tauri::command]
pub fn list_snapshots() -> Result<Vec<SnapshotInfo>, String> {
    let dir = snapshots_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut snapshots = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("读取快照目录失败: {}", e))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                let metadata = fs::metadata(&path).ok();
                let timestamp = metadata
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                snapshots.push(SnapshotInfo {
                    name: name.to_string(),
                    timestamp,
                });
            }
        }
    }
    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(snapshots)
}

#[tauri::command]
pub fn save_snapshot(name: &str) -> Result<(), String> {
    let config_dir = dirs::home_dir()
        .expect("无法获取 home 目录")
        .join(".config")
        .join("opencode");
    let snap_dir = snapshots_dir().join(name);
    fs::create_dir_all(&snap_dir).map_err(|e| format!("创建快照目录失败: {}", e))?;

    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let src = config_dir.join(filename);
        if src.exists() {
            let dst = snap_dir.join(filename);
            fs::copy(&src, &dst).map_err(|e| format!("复制 {} 失败: {}", filename, e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn restore_snapshot(name: &str) -> Result<(), String> {
    let config_dir = dirs::home_dir()
        .expect("无法获取 home 目录")
        .join(".config")
        .join("opencode");
    let snap_dir = snapshots_dir().join(name);
    if !snap_dir.exists() {
        return Err(format!("快照 {} 不存在", name));
    }
    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let src = snap_dir.join(filename);
        if src.exists() {
            let dst = config_dir.join(filename);
            fs::copy(&src, &dst).map_err(|e| format!("恢复 {} 失败: {}", filename, e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn delete_snapshot(name: &str) -> Result<(), String> {
    let snap_dir = snapshots_dir().join(name);
    if snap_dir.exists() {
        fs::remove_dir_all(&snap_dir).map_err(|e| format!("删除快照失败: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn export_snapshot(name: &str) -> Result<String, String> {
    let snap_dir = snapshots_dir().join(name);
    if !snap_dir.exists() {
        return Err(format!("快照 {} 不存在", name));
    }
    let mut export_data = serde_json::Map::new();
    for filename in &["opencode.json", "oh-my-opencode.json"] {
        let path = snap_dir.join(filename);
        if path.exists() {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("读取 {} 失败: {}", filename, e))?;
            export_data.insert(
                filename.to_string(),
                serde_json::Value::String(content),
            );
        }
    }
    serde_json::to_string_pretty(&export_data).map_err(|e| format!("序列化失败: {}", e))
}
```

- [ ] **Step 3: 在 lib.rs 中注册命令**

修改 `src-tauri/src/lib.rs`：

```rust
mod commands;
mod snapshots;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::read_config,
            commands::write_config,
            commands::config_file_exists,
            snapshots::list_snapshots,
            snapshots::save_snapshot,
            snapshots::restore_snapshot,
            snapshots::delete_snapshot,
            snapshots::export_snapshot,
        ])
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用失败");
}
```

在 `src-tauri/Cargo.toml` 添加 `dirs` 依赖：

```toml
[dependencies]
dirs = "6"
```

- [ ] **Step 4: 编译验证**

```bash
cd /Users/sorayama/Projects/personal/opencode-configurator/src-tauri
cargo build
```

预期：编译成功，无错误。

- [ ] **Step 5: 提交**

```bash
git add src-tauri/
git commit -m "feat: 实现 Tauri 后端文件读写和快照管理命令"
```

---

### Task 6: 全局配置 Context 与 useConfig Hook

**Files:**
- Create: `src/context/ConfigContext.tsx`
- Create: `src/hooks/useConfig.ts`
- Create: `src/lib/snapshots.ts`
- Test: `tests/hooks/useConfig.test.tsx`

- [ ] **Step 1: 编写 useConfig 测试**

创建 `tests/hooks/useConfig.test.tsx`：

```typescript
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
  plugins: [{ name: "oh-my-opencode", version: "3.14.0" }],
  providers: {
    openai: {
      name: "openai",
      models: [{ name: "gpt-5.4" }],
    },
  },
  mcpServers: {},
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
    mockedInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === "read_config") return MOCK_OPENCODE;
      if (cmd === "read_config" ) return MOCK_OH_MY;
      return "";
    });
    mockedInvoke
      .mockResolvedValueOnce(MOCK_OPENCODE)
      .mockResolvedValueOnce(MOCK_OH_MY);

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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/hooks/useConfig.test.tsx
```

预期：FAIL — 模块不存在。

- [ ] **Step 3: 实现 ConfigContext**

创建 `src/context/ConfigContext.tsx`：

```typescript
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  AgentConfig,
  CategoryConfig,
  McpServer,
  Provider,
  ConfigFileType,
} from "@/types/config";
import {
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  serializeConfig,
} from "@/lib/config";

interface ConfigState {
  openCodeConfig: OpenCodeConfig | null;
  ohMyOpenCodeConfig: OhMyOpenCodeConfig | null;
  activeFile: ConfigFileType;
  loading: boolean;
  error: string | null;
}

type ConfigAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_OPENCODE"; config: OpenCodeConfig }
  | { type: "SET_OH_MY"; config: OhMyOpenCodeConfig }
  | { type: "SET_ACTIVE_FILE"; file: ConfigFileType }
  | { type: "SET_BOTH"; openCode: OpenCodeConfig; ohMy: OhMyOpenCodeConfig };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_OPENCODE":
      return { ...state, openCodeConfig: action.config };
    case "SET_OH_MY":
      return { ...state, ohMyOpenCodeConfig: action.config };
    case "SET_ACTIVE_FILE":
      return { ...state, activeFile: action.file };
    case "SET_BOTH":
      return {
        ...state,
        openCodeConfig: action.openCode,
        ohMyOpenCodeConfig: action.ohMy,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

interface ConfigContextValue extends ConfigState {
  reload: () => Promise<void>;
  setActiveFile: (file: ConfigFileType) => void;
  updateAgent: (name: string, config: AgentConfig) => void;
  updateCategory: (name: string, config: CategoryConfig) => void;
  updateMcpServer: (name: string, server: McpServer) => void;
  deleteMcpServer: (name: string) => void;
  updateProvider: (name: string, provider: Provider) => void;
  deleteProvider: (name: string) => void;
  batchReplaceModel: (fromModel: string, toModel: string, toVariant?: string) => void;
  updatePluginVersion: (pluginName: string, newVersion: string) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

async function persistOhMy(config: OhMyOpenCodeConfig) {
  await invoke("write_config", {
    filename: "oh-my-opencode.json",
    content: serializeConfig(config),
  });
}

async function persistOpenCode(config: OpenCodeConfig) {
  await invoke("write_config", {
    filename: "opencode.json",
    content: serializeConfig(config),
  });
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, {
    openCodeConfig: null,
    ohMyOpenCodeConfig: null,
    activeFile: "oh-my-opencode",
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const [ocRaw, omRaw] = await Promise.all([
        invoke<string>("read_config", { filename: "opencode.json" }),
        invoke<string>("read_config", { filename: "oh-my-opencode.json" }),
      ]);
      dispatch({
        type: "SET_BOTH",
        openCode: parseOpenCodeConfig(ocRaw),
        ohMy: parseOhMyOpenCodeConfig(omRaw),
      });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: String(e) });
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setActiveFile = useCallback((file: ConfigFileType) => {
    dispatch({ type: "SET_ACTIVE_FILE", file });
  }, []);

  const updateAgent = useCallback(
    (name: string, config: AgentConfig) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        agents: { ...state.ohMyOpenCodeConfig.agents, [name]: config },
      };
      dispatch({ type: "SET_OH_MY", config: updated });
      persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updateCategory = useCallback(
    (name: string, config: CategoryConfig) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        categories: { ...state.ohMyOpenCodeConfig.categories, [name]: config },
      };
      dispatch({ type: "SET_OH_MY", config: updated });
      persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updateMcpServer = useCallback(
    (name: string, server: McpServer) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        mcpServers: { ...state.openCodeConfig.mcpServers, [name]: server },
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const deleteMcpServer = useCallback(
    (name: string) => {
      if (!state.openCodeConfig?.mcpServers) return;
      const { [name]: _, ...rest } = state.openCodeConfig.mcpServers;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        mcpServers: rest,
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const updateProvider = useCallback(
    (name: string, provider: Provider) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        providers: { ...state.openCodeConfig.providers, [name]: provider },
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const deleteProvider = useCallback(
    (name: string) => {
      if (!state.openCodeConfig?.providers) return;
      const { [name]: _, ...rest } = state.openCodeConfig.providers;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        providers: rest,
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const batchReplaceModel = useCallback(
    (fromModel: string, toModel: string, toVariant?: string) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        agents: { ...state.ohMyOpenCodeConfig.agents },
        categories: { ...state.ohMyOpenCodeConfig.categories },
      };
      if (updated.agents) {
        for (const [name, agent] of Object.entries(updated.agents)) {
          if (agent.model === fromModel) {
            updated.agents[name] = { model: toModel, variant: toVariant };
          }
        }
      }
      if (updated.categories) {
        for (const [name, cat] of Object.entries(updated.categories)) {
          if (cat.model === fromModel) {
            updated.categories[name] = { model: toModel, variant: toVariant };
          }
        }
      }
      dispatch({ type: "SET_OH_MY", config: updated });
      persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updatePluginVersion = useCallback(
    (pluginName: string, newVersion: string) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        plugins: state.openCodeConfig.plugins?.map((p) =>
          p.name === pluginName ? { ...p, version: newVersion } : p,
        ),
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  return (
    <ConfigContext.Provider
      value={{
        ...state,
        reload,
        setActiveFile,
        updateAgent,
        updateCategory,
        updateMcpServer,
        deleteMcpServer,
        updateProvider,
        deleteProvider,
        batchReplaceModel,
        updatePluginVersion,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig 必须在 ConfigProvider 内使用");
  }
  return context;
}
```

- [ ] **Step 4: 实现快照前端逻辑**

创建 `src/lib/snapshots.ts`：

```typescript
import { invoke } from "@tauri-apps/api/core";

export interface SnapshotInfo {
  name: string;
  timestamp: number;
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  return invoke<SnapshotInfo[]>("list_snapshots");
}

export async function saveSnapshot(name: string): Promise<void> {
  return invoke("save_snapshot", { name });
}

export async function restoreSnapshot(name: string): Promise<void> {
  return invoke("restore_snapshot", { name });
}

export async function deleteSnapshot(name: string): Promise<void> {
  return invoke("delete_snapshot", { name });
}

export async function exportSnapshot(name: string): Promise<string> {
  return invoke<string>("export_snapshot", { name });
}

export function generateSnapshotName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm run test -- tests/hooks/useConfig.test.tsx
```

预期：测试 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/context/ src/hooks/ src/lib/snapshots.ts tests/hooks/
git commit -m "feat: 实现全局配置 Context、useConfig hook 和快照前端逻辑"
```

---

### Task 7: 共享组件 — ConfirmDialog、ModelSelect

**Files:**
- Create: `src/components/shared/ConfirmDialog.tsx`
- Create: `src/components/shared/ModelSelect.tsx`
- Create: `src/components/shared/JsonPreview.tsx`

- [ ] **Step 1: 实现 ConfirmDialog**

创建 `src/components/shared/ConfirmDialog.tsx`：

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: 实现 ModelSelect**

创建 `src/components/shared/ModelSelect.tsx`：

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";
import { useMemo } from "react";

interface ModelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ModelSelect({
  value,
  onValueChange,
  placeholder = "选择模型",
}: ModelSelectProps) {
  const { openCodeConfig } = useConfig();

  const models = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[260px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 3: 实现 JsonPreview**

创建 `src/components/shared/JsonPreview.tsx`：

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface JsonPreviewProps {
  value: unknown;
  onSave?: (newValue: string) => void;
  readOnly?: boolean;
}

export function JsonPreview({ value, onSave, readOnly = false }: JsonPreviewProps) {
  const formatted = JSON.stringify(value, null, 2);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatted);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditValue(formatted);
    setError(null);
    setEditing(true);
  };

  const handleSave = () => {
    try {
      JSON.parse(editValue);
      setError(null);
      onSave?.(editValue);
      setEditing(false);
    } catch (e) {
      setError(`JSON 格式错误: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  if (!editing) {
    return (
      <div className="relative">
        <pre className="rounded-md border bg-muted p-4 text-sm overflow-auto max-h-[400px]">
          <code>{formatted}</code>
        </pre>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleEdit}
          >
            编辑
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="font-mono text-sm min-h-[300px]"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          保存
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          取消
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/shared/
git commit -m "feat: 实现共享组件 ConfirmDialog、ModelSelect、JsonPreview"
```

---

### Task 8: 应用布局 — TopBar、TabBar、Sidebar、App

**Files:**
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/TabBar.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 实现 TopBar**

创建 `src/components/layout/TopBar.tsx`：

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useConfig } from "@/context/ConfigContext";
import { getOhMyOpenCodeVersion } from "@/lib/config";
import type { ConfigFileType } from "@/types/config";

export function TopBar() {
  const { openCodeConfig, activeFile, setActiveFile, updatePluginVersion } = useConfig();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const currentVersion = openCodeConfig
    ? getOhMyOpenCodeVersion(openCodeConfig)
    : undefined;

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const res = await fetch(
        "https://registry.npmjs.org/oh-my-opencode/latest",
      );
      const data = await res.json();
      setLatestVersion(data.version);
    } catch {
      setLatestVersion(null);
    } finally {
      setChecking(false);
    }
  };

  const hasUpdate =
    latestVersion && currentVersion && latestVersion !== currentVersion;

  const fileOptions: { label: string; value: ConfigFileType }[] = [
    { label: "oh-my-opencode.json", value: "oh-my-opencode" },
    { label: "opencode.json", value: "opencode" },
  ];

  return (
    <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">OpenCode Configurator</h1>
        {currentVersion && (
          <Badge variant="secondary">v{currentVersion}</Badge>
        )}
        {hasUpdate && (
          <Badge
            variant="outline"
            className="cursor-pointer text-orange-600 border-orange-300"
            onClick={() => updatePluginVersion("oh-my-opencode", latestVersion!)}
          >
            → v{latestVersion} 可更新，点击升级
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={checkUpdate}
          disabled={checking}
        >
          {checking ? "检查中..." : "检查更新"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {fileOptions.find((f) => f.value === activeFile)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {fileOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setActiveFile(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 实现 TabBar**

创建 `src/components/layout/TabBar.tsx`：

```tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabValue = "agents" | "mcp" | "providers";

interface TabBarProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
}

export function TabBar({ value, onValueChange }: TabBarProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as TabValue)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="agents">Agents & Categories</TabsTrigger>
        <TabsTrigger value="mcp">MCP 服务器</TabsTrigger>
        <TabsTrigger value="providers">Providers</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

- [ ] **Step 3: 实现 Sidebar**

创建 `src/components/layout/Sidebar.tsx`：

```tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  listSnapshots,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  exportSnapshot,
  generateSnapshotName,
  type SnapshotInfo,
} from "@/lib/snapshots";
import { useConfig } from "@/context/ConfigContext";

export function Sidebar() {
  const { reload } = useConfig();
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const refreshSnapshots = async () => {
    const list = await listSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    refreshSnapshots();
  }, []);

  const handleSave = async () => {
    const name = generateSnapshotName();
    await saveSnapshot(name);
    await refreshSnapshots();
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await restoreSnapshot(restoreTarget);
    setRestoreTarget(null);
    await reload();
  };

  const handleDelete = async (name: string) => {
    await deleteSnapshot(name);
    await refreshSnapshots();
  };

  const handleExport = async (name: string) => {
    const data = await exportSnapshot(name);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-56 border-r flex flex-col bg-muted/30">
      <div className="p-3 font-medium text-sm text-muted-foreground">
        快照管理
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {snapshots.map((snap) => (
            <div
              key={snap.name}
              className="group rounded-md p-2 text-sm hover:bg-accent cursor-pointer"
            >
              <div
                className="font-mono text-xs"
                onClick={() => setRestoreTarget(snap.name)}
              >
                {snap.name}
              </div>
              <div className="hidden group-hover:flex gap-1 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleExport(snap.name)}
                >
                  导出
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={() => handleDelete(snap.name)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
          {snapshots.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">暂无快照</p>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Button className="w-full" size="sm" onClick={handleSave}>
          + 保存快照
        </Button>
      </div>

      <ConfirmDialog
        open={restoreTarget !== null}
        title="恢复快照"
        description={`确定要恢复快照 "${restoreTarget}" 吗？当前配置将被覆盖。`}
        confirmText="恢复"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
```

- [ ] **Step 4: 组装 App.tsx 主布局**

修改 `src/App.tsx`：

```tsx
import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { TabBar, type TabValue } from "@/components/layout/TabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentTable } from "@/components/agents/AgentTable";
import { CategoryTable } from "@/components/agents/CategoryTable";
import { BatchModelBar } from "@/components/agents/BatchModelBar";
import { McpList } from "@/components/mcp/McpList";
import { ProviderList } from "@/components/provider/ProviderList";
import { useConfig } from "@/context/ConfigContext";

export default function App() {
  const [tab, setTab] = useState<TabValue>("agents");
  const { loading, error } = useConfig();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">加载配置中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">加载失败</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="px-4 pt-3">
            <TabBar value={tab} onValueChange={setTab} />
          </div>
          <div className="flex-1 overflow-auto p-4">
            {tab === "agents" && (
              <div className="space-y-6">
                <BatchModelBar />
                <AgentTable />
                <CategoryTable />
              </div>
            )}
            {tab === "mcp" && <McpList />}
            {tab === "providers" && <ProviderList />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 修改 main.tsx 包裹 ConfigProvider**

修改 `src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "./context/ConfigContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: 创建组件占位（后续 Task 实现）**

为避免编译错误，先创建空壳组件。

创建 `src/components/agents/AgentTable.tsx`：

```tsx
export function AgentTable() {
  return <div>Agent 表格（即将实现）</div>;
}
```

创建 `src/components/agents/CategoryTable.tsx`：

```tsx
export function CategoryTable() {
  return <div>Category 表格（即将实现）</div>;
}
```

创建 `src/components/agents/BatchModelBar.tsx`：

```tsx
export function BatchModelBar() {
  return <div>批量替换工具栏（即将实现）</div>;
}
```

创建 `src/components/mcp/McpList.tsx`：

```tsx
export function McpList() {
  return <div>MCP 服务器列表（即将实现）</div>;
}
```

创建 `src/components/provider/ProviderList.tsx`：

```tsx
export function ProviderList() {
  return <div>Provider 列表（即将实现）</div>;
}
```

- [ ] **Step 7: 验证应用能编译运行**

```bash
npm run tauri dev
```

预期：窗口打开，显示 TopBar + TabBar + Sidebar + 占位内容。

- [ ] **Step 8: 提交**

```bash
git add src/
git commit -m "feat: 实现应用主布局（TopBar、TabBar、Sidebar）和占位组件"
```

---

### Task 9: Agent 和 Category 配置表格

**Files:**
- Modify: `src/components/agents/AgentTable.tsx`
- Modify: `src/components/agents/CategoryTable.tsx`
- Test: `tests/components/AgentTable.test.tsx`

- [ ] **Step 1: 编写 AgentTable 测试**

创建 `tests/components/AgentTable.test.tsx`：

```tsx
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
      providers: {
        anthropic: { name: "anthropic", models: [{ name: "claude-opus-4-6" }] },
        openai: { name: "openai", models: [{ name: "gpt-5.4" }] },
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/components/AgentTable.test.tsx
```

预期：FAIL（AgentTable 是占位组件）。

- [ ] **Step 3: 实现 AgentTable**

修改 `src/components/agents/AgentTable.tsx`：

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";
import { getRecommendation } from "@/lib/recommended-models";
import { useMemo } from "react";

const VARIANTS = ["", "medium", "high", "xhigh", "max"];

export function AgentTable() {
  const { ohMyOpenCodeConfig, openCodeConfig, updateAgent } = useConfig();

  const agents = ohMyOpenCodeConfig?.agents ?? {};
  const models = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Agents</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">名称</TableHead>
            <TableHead>模型</TableHead>
            <TableHead className="w-[120px]">Variant</TableHead>
            <TableHead className="w-[60px]">推荐</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(agents).map(([name, agent]) => {
            const rec = getRecommendation("agent", name);
            const isRecommended =
              rec?.model === agent.model &&
              (rec?.variant ?? "") === (agent.variant ?? "");

            return (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell>
                  <Select
                    value={agent.model}
                    onValueChange={(model) =>
                      updateAgent(name, { ...agent, model })
                    }
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={agent.variant ?? ""}
                    onValueChange={(variant) =>
                      updateAgent(name, {
                        ...agent,
                        variant: variant || undefined,
                      })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANTS.map((v) => (
                        <SelectItem key={v || "__none"} value={v || "__none"}>
                          {v || "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`cursor-pointer ${isRecommended ? "text-green-600" : "text-orange-500"}`}
                          onClick={() => {
                            if (rec && !isRecommended) {
                              updateAgent(name, {
                                model: rec.model,
                                variant: rec.variant,
                              });
                            }
                          }}
                        >
                          {isRecommended ? "✅" : "⚠️"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        {rec ? (
                          <div className="space-y-1 text-xs">
                            <p>
                              推荐: {rec.model}
                              {rec.variant ? ` (${rec.variant})` : ""}
                            </p>
                            {rec.fallbacks.length > 0 && (
                              <>
                                <p className="font-medium">备选链:</p>
                                <ol className="list-decimal list-inside">
                                  {rec.fallbacks.map((fb, i) => (
                                    <li key={i}>
                                      {fb.model}
                                      {fb.variant ? ` (${fb.variant})` : ""}
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}
                            {!isRecommended && (
                              <p className="text-orange-400">点击应用推荐配置</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs">无推荐配置</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 4: 实现 CategoryTable（结构同 AgentTable）**

修改 `src/components/agents/CategoryTable.tsx`：

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";
import { getRecommendation } from "@/lib/recommended-models";
import { useMemo } from "react";

const VARIANTS = ["", "medium", "high", "xhigh", "max"];

export function CategoryTable() {
  const { ohMyOpenCodeConfig, openCodeConfig, updateCategory } = useConfig();

  const categories = ohMyOpenCodeConfig?.categories ?? {};
  const models = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Categories</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">名称</TableHead>
            <TableHead>模型</TableHead>
            <TableHead className="w-[120px]">Variant</TableHead>
            <TableHead className="w-[60px]">推荐</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(categories).map(([name, cat]) => {
            const rec = getRecommendation("category", name);
            const isRecommended =
              rec?.model === cat.model &&
              (rec?.variant ?? "") === (cat.variant ?? "");

            return (
              <TableRow key={name}>
                <TableCell className="font-mono text-sm">{name}</TableCell>
                <TableCell>
                  <Select
                    value={cat.model}
                    onValueChange={(model) =>
                      updateCategory(name, { ...cat, model })
                    }
                  >
                    <SelectTrigger className="w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={cat.variant ?? ""}
                    onValueChange={(variant) =>
                      updateCategory(name, {
                        ...cat,
                        variant: variant || undefined,
                      })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {VARIANTS.map((v) => (
                        <SelectItem key={v || "__none"} value={v || "__none"}>
                          {v || "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`cursor-pointer ${isRecommended ? "text-green-600" : "text-orange-500"}`}
                          onClick={() => {
                            if (rec && !isRecommended) {
                              updateCategory(name, {
                                model: rec.model,
                                variant: rec.variant,
                              });
                            }
                          }}
                        >
                          {isRecommended ? "✅" : "⚠️"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        {rec ? (
                          <div className="space-y-1 text-xs">
                            <p>
                              推荐: {rec.model}
                              {rec.variant ? ` (${rec.variant})` : ""}
                            </p>
                            {rec.fallbacks.length > 0 && (
                              <>
                                <p className="font-medium">备选链:</p>
                                <ol className="list-decimal list-inside">
                                  {rec.fallbacks.map((fb, i) => (
                                    <li key={i}>
                                      {fb.model}
                                      {fb.variant ? ` (${fb.variant})` : ""}
                                    </li>
                                  ))}
                                </ol>
                              </>
                            )}
                            {!isRecommended && (
                              <p className="text-orange-400">点击应用推荐配置</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs">无推荐配置</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm run test -- tests/components/AgentTable.test.tsx
```

预期：2 个测试 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/agents/ tests/components/AgentTable.test.tsx
git commit -m "feat: 实现 Agent 和 Category 配置表格，支持模型选择和推荐指示器"
```

---

### Task 10: 批量模型替换工具栏

**Files:**
- Modify: `src/components/agents/BatchModelBar.tsx`
- Test: `tests/components/BatchModelBar.test.tsx`

- [ ] **Step 1: 编写 BatchModelBar 测试**

创建 `tests/components/BatchModelBar.test.tsx`：

```tsx
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/components/BatchModelBar.test.tsx
```

预期：FAIL。

- [ ] **Step 3: 实现 BatchModelBar**

修改 `src/components/agents/BatchModelBar.tsx`：

```tsx
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useConfig } from "@/context/ConfigContext";
import { extractModelsFromProviders } from "@/lib/config";

export function BatchModelBar() {
  const { openCodeConfig, ohMyOpenCodeConfig, batchReplaceModel } = useConfig();
  const [fromModel, setFromModel] = useState("");
  const [toModel, setToModel] = useState("");
  const [toVariant, setToVariant] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const allModels = useMemo(() => {
    if (!openCodeConfig?.providers) return [];
    return extractModelsFromProviders(openCodeConfig.providers);
  }, [openCodeConfig?.providers]);

  const currentModels = useMemo(() => {
    const models = new Set<string>();
    if (ohMyOpenCodeConfig?.agents) {
      for (const a of Object.values(ohMyOpenCodeConfig.agents)) {
        models.add(a.model);
      }
    }
    if (ohMyOpenCodeConfig?.categories) {
      for (const c of Object.values(ohMyOpenCodeConfig.categories)) {
        models.add(c.model);
      }
    }
    return Array.from(models).sort();
  }, [ohMyOpenCodeConfig]);

  const matchCount = useMemo(() => {
    if (!fromModel) return 0;
    let count = 0;
    if (ohMyOpenCodeConfig?.agents) {
      count += Object.values(ohMyOpenCodeConfig.agents).filter(
        (a) => a.model === fromModel,
      ).length;
    }
    if (ohMyOpenCodeConfig?.categories) {
      count += Object.values(ohMyOpenCodeConfig.categories).filter(
        (c) => c.model === fromModel,
      ).length;
    }
    return count;
  }, [fromModel, ohMyOpenCodeConfig]);

  const handleApply = () => {
    batchReplaceModel(fromModel, toModel, toVariant || undefined);
    setShowConfirm(false);
    setFromModel("");
    setToModel("");
    setToVariant("");
  };

  const VARIANTS = ["", "medium", "high", "xhigh", "max"];

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
      <span className="text-sm font-medium whitespace-nowrap">批量替换</span>

      <Select value={fromModel} onValueChange={setFromModel}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="来源模型" />
        </SelectTrigger>
        <SelectContent>
          {currentModels.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">→</span>

      <Select value={toModel} onValueChange={setToModel}>
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="目标模型" />
        </SelectTrigger>
        <SelectContent>
          {allModels.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={toVariant} onValueChange={setToVariant}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Variant" />
        </SelectTrigger>
        <SelectContent>
          {VARIANTS.map((v) => (
            <SelectItem key={v || "__none"} value={v || "__none"}>
              {v || "-"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        disabled={!fromModel || !toModel}
        onClick={() => setShowConfirm(true)}
      >
        应用
        {matchCount > 0 && ` (${matchCount})`}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        title="确认批量替换"
        description={`将把所有使用 "${fromModel}" 的 agent/category（共 ${matchCount} 个）替换为 "${toModel}"${toVariant ? ` (${toVariant})` : ""}。此操作不可撤销。`}
        confirmText="确认替换"
        onConfirm={handleApply}
        onCancel={() => setShowConfirm(false)}
        variant="destructive"
      />
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm run test -- tests/components/BatchModelBar.test.tsx
```

预期：PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/agents/BatchModelBar.tsx tests/components/BatchModelBar.test.tsx
git commit -m "feat: 实现批量模型替换工具栏，支持来源/目标模型选择和确认对话框"
```

---

### Task 11: MCP 服务器管理标签页

**Files:**
- Modify: `src/components/mcp/McpList.tsx`
- Create: `src/components/mcp/McpEditor.tsx`
- Test: `tests/components/McpList.test.tsx`

- [ ] **Step 1: 编写 McpList 测试**

创建 `tests/components/McpList.test.tsx`：

```tsx
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/components/McpList.test.tsx
```

预期：FAIL。

- [ ] **Step 3: 实现 McpEditor**

创建 `src/components/mcp/McpEditor.tsx`：

```tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { McpServer, McpServerRemote, McpServerLocal } from "@/types/config";

interface McpEditorProps {
  name: string;
  server: McpServer;
  onSave: (name: string, server: McpServer) => void;
}

function KeyValueEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);

  const updateKey = (oldKey: string, newKey: string) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  };

  const updateValue = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  const addEntry = () => {
    onChange({ ...value, "": "" });
  };

  const removeEntry = (key: string) => {
    const { [key]: _, ...rest } = value;
    onChange(rest);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="键"
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="值"
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeEntry(k)}
            className="text-destructive"
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry}>
        + 添加
      </Button>
    </div>
  );
}

export function McpEditor({ name, server, onSave }: McpEditorProps) {
  const [draft, setDraft] = useState<McpServer>({ ...server });

  if (draft.type === "remote") {
    const remote = draft as McpServerRemote;
    return (
      <div className="space-y-4 p-4 border rounded-md bg-background">
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={remote.url}
            onChange={(e) =>
              setDraft({ ...remote, url: e.target.value })
            }
          />
        </div>
        <KeyValueEditor
          label="Headers"
          value={remote.headers ?? {}}
          onChange={(headers) => setDraft({ ...remote, headers })}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={remote.enabled !== false}
            onCheckedChange={(enabled) =>
              setDraft({ ...remote, enabled })
            }
          />
          <Label>启用</Label>
        </div>
        <Button size="sm" onClick={() => onSave(name, draft)}>
          保存
        </Button>
      </div>
    );
  }

  const local = draft as McpServerLocal;
  return (
    <div className="space-y-4 p-4 border rounded-md bg-background">
      <div className="space-y-2">
        <Label>Command</Label>
        <Input
          value={local.command.join(" ")}
          onChange={(e) =>
            setDraft({
              ...local,
              command: e.target.value.split(" ").filter(Boolean),
            })
          }
          placeholder="例如: node server.js"
        />
        <p className="text-xs text-muted-foreground">用空格分隔命令和参数</p>
      </div>
      <KeyValueEditor
        label="环境变量"
        value={local.env ?? {}}
        onChange={(env) => setDraft({ ...local, env })}
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={local.enabled !== false}
          onCheckedChange={(enabled) =>
            setDraft({ ...local, enabled })
          }
        />
        <Label>启用</Label>
      </div>
      <Button size="sm" onClick={() => onSave(name, draft)}>
        保存
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: 实现 McpList**

修改 `src/components/mcp/McpList.tsx`：

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McpEditor } from "@/components/mcp/McpEditor";
import { useConfig } from "@/context/ConfigContext";
import type { McpServer } from "@/types/config";

export function McpList() {
  const { openCodeConfig, updateMcpServer, deleteMcpServer } = useConfig();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const mcpServers = openCodeConfig?.mcpServers ?? {};

  const handleSave = (name: string, server: McpServer) => {
    updateMcpServer(name, server);
    setExpanded(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMcpServer(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleAdd = (type: "remote" | "local") => {
    const name = newName.trim() || `mcp-${Date.now()}`;
    const server: McpServer =
      type === "remote"
        ? { type: "remote", url: "", enabled: true }
        : { type: "local", command: [], enabled: true };
    updateMcpServer(name, server);
    setAdding(false);
    setNewName("");
    setExpanded(name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">MCP 服务器</h3>
        <Button size="sm" onClick={() => setAdding(true)}>
          + 添加 MCP
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <input
              className="border rounded px-2 py-1 text-sm w-full"
              placeholder="服务器名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAdd("remote")}>
                远程服务器
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd("local")}
              >
                本地服务器
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(mcpServers).map(([name, server]) => (
        <Card key={name}>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => setExpanded(expanded === name ? null : name)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono">{name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{server.type}</Badge>
                <Badge
                  variant={
                    server.enabled !== false ? "default" : "secondary"
                  }
                >
                  {server.enabled !== false ? "启用" : "禁用"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(name);
                  }}
                >
                  删除
                </Button>
              </div>
            </div>
          </CardHeader>
          {expanded === name && (
            <CardContent>
              <McpEditor name={name} server={server} onSave={handleSave} />
            </CardContent>
          )}
        </Card>
      ))}

      {Object.keys(mcpServers).length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          暂无 MCP 服务器配置
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除 MCP 服务器"
        description={`确定要删除 "${deleteTarget}" 吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm run test -- tests/components/McpList.test.tsx
```

预期：2 个测试 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/mcp/ tests/components/McpList.test.tsx
git commit -m "feat: 实现 MCP 服务器管理，支持卡片列表、内联编辑、新增和删除"
```

---

### Task 12: Provider 管理标签页

**Files:**
- Modify: `src/components/provider/ProviderList.tsx`
- Create: `src/components/provider/ProviderEditor.tsx`
- Test: `tests/components/ProviderEditor.test.tsx`

- [ ] **Step 1: 编写 ProviderEditor 测试**

创建 `tests/components/ProviderEditor.test.tsx`：

```tsx
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
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm run test -- tests/components/ProviderEditor.test.tsx
```

预期：FAIL。

- [ ] **Step 3: 实现 ProviderEditor**

创建 `src/components/provider/ProviderEditor.tsx`：

```tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfig } from "@/context/ConfigContext";
import type { Provider, ProviderModel } from "@/types/config";

interface ProviderEditorProps {
  name: string;
  provider: Provider;
}

export function ProviderEditor({ name, provider }: ProviderEditorProps) {
  const { updateProvider } = useConfig();
  const [draft, setDraft] = useState<Provider>({ ...provider });
  const [showKey, setShowKey] = useState(false);

  const save = (updated: Provider) => {
    setDraft(updated);
    updateProvider(name, updated);
  };

  const updateModel = (index: number, field: keyof ProviderModel, value: string) => {
    const models = [...draft.models];
    models[index] = { ...models[index], [field]: value };
    save({ ...draft, models });
  };

  const addModel = () => {
    save({ ...draft, models: [...draft.models, { name: "" }] });
  };

  const removeModel = (index: number) => {
    const models = draft.models.filter((_, i) => i !== index);
    save({ ...draft, models });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>名称</Label>
          <Input
            value={draft.name}
            onChange={(e) => save({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>NPM 包</Label>
          <Input
            value={draft.npm ?? ""}
            onChange={(e) => save({ ...draft, npm: e.target.value })}
            placeholder="例如: @openai/provider"
          />
        </div>
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={draft.baseURL ?? ""}
            onChange={(e) => save({ ...draft, baseURL: e.target.value })}
            placeholder="https://api.example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type={showKey ? "text" : "password"}
              aria-label="API Key"
              value={draft.apiKey ?? ""}
              onChange={(e) => save({ ...draft, apiKey: e.target.value })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "隐藏" : "显示"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>模型列表</Label>
          <Button variant="outline" size="sm" onClick={addModel}>
            + 添加模型
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模型名称</TableHead>
              <TableHead>显示名称</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.models.map((model, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Input
                    value={model.name}
                    onChange={(e) => updateModel(i, "name", e.target.value)}
                    placeholder="gpt-5.4"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={model.displayName ?? ""}
                    onChange={(e) =>
                      updateModel(i, "displayName", e.target.value)
                    }
                    placeholder="GPT 5.4"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeModel(i)}
                  >
                    ×
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 实现 ProviderList**

修改 `src/components/provider/ProviderList.tsx`：

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProviderEditor } from "@/components/provider/ProviderEditor";
import { useConfig } from "@/context/ConfigContext";
import type { Provider } from "@/types/config";

export function ProviderList() {
  const { openCodeConfig, updateProvider, deleteProvider } = useConfig();
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const providers = openCodeConfig?.providers ?? {};
  const providerNames = Object.keys(providers);

  const handleAdd = () => {
    const name = `provider-${Date.now()}`;
    const newProvider: Provider = { name, models: [] };
    updateProvider(name, newProvider);
    setSelected(name);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProvider(deleteTarget);
      if (selected === deleteTarget) setSelected(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-48 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Providers</h3>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            +
          </Button>
        </div>
        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-1">
            {providerNames.map((name) => (
              <div key={name} className="flex items-center group">
                <button
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selected === name
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelected(name)}
                >
                  {name}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 text-destructive h-6"
                  onClick={() => setDeleteTarget(name)}
                >
                  ×
                </Button>
              </div>
            ))}
            {providerNames.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">暂无 Provider</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator orientation="vertical" />

      <div className="flex-1">
        {selected && providers[selected] ? (
          <ProviderEditor name={selected} provider={providers[selected]} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            选择一个 Provider 开始编辑
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除 Provider"
        description={`确定要删除 "${deleteTarget}" 吗？关联的 API Key 和模型列表将一并删除。`}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npm run test -- tests/components/ProviderEditor.test.tsx
```

预期：2 个测试 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/components/provider/ tests/components/ProviderEditor.test.tsx
git commit -m "feat: 实现 Provider 管理，支持列表选择、表单编辑、API Key 遮罩和模型管理"
```

---

### Task 13: 全局样式与窗口配置

**Files:**
- Modify: `src/index.css`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `index.html`

- [ ] **Step 1: 设置全局 CSS 变量和基础样式**

将 `src/index.css` 替换为（保留 shadcn/ui 生成的 CSS 变量，追加以下内容）：

```css
@import "tailwindcss";

:root {
  font-family: "Inter", "SF Pro Display", system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

body {
  margin: 0;
  overflow: hidden;
}
```

注意：保留 shadcn/ui init 生成的 CSS 变量定义部分不要删除，仅在其后追加上述内容。

- [ ] **Step 2: 配置 Tauri 窗口**

在 `src-tauri/tauri.conf.json` 的 `app.windows` 中设置：

```json
{
  "app": {
    "windows": [
      {
        "title": "OpenCode Configurator",
        "width": 1100,
        "height": 700,
        "minWidth": 900,
        "minHeight": 600,
        "resizable": true,
        "decorations": true
      }
    ]
  }
}
```

- [ ] **Step 3: 更新 index.html title**

将 `index.html` 中 `<title>` 改为：

```html
<title>OpenCode Configurator</title>
```

- [ ] **Step 4: 提交**

```bash
git add src/index.css src-tauri/tauri.conf.json index.html
git commit -m "style: 配置全局样式、窗口尺寸和应用标题"
```

---

### Task 14: 端到端集成验证与 README

**Files:**
- Create: `README.md`
- Run: 完整功能验证

- [ ] **Step 1: 编写 README**

创建 `README.md`：

```markdown
# OpenCode Configurator

桌面 GUI 工具，用于可视化编辑 `opencode.json` 和 `oh-my-opencode.json` 配置文件。

## 技术栈

- **Runtime**: Tauri v2 (Rust + WebView)
- **Frontend**: React + TypeScript + shadcn/ui
- **构建工具**: Vite
- **测试**: Vitest + Testing Library

## 开发

### 前置条件

- Node.js 20+
- Rust 1.77+
- 系统 WebView 运行时

### 启动开发环境

```bash
npm install
npm run tauri dev
```

### 运行测试

```bash
npm run test
```

### 构建

```bash
npm run tauri build
```

## 功能

- **Agents & Categories**: 可视化编辑 agent/category 模型配置，推荐模型指示器
- **批量替换**: 一键将所有使用某模型的 agent/category 替换为另一个模型
- **MCP 服务器**: 管理远程和本地 MCP 服务器配置
- **Provider**: 管理 API provider，包括 API Key、Base URL 和模型列表
- **快照管理**: 保存/恢复/导出配置快照
- **版本检查**: 检查 oh-my-opencode 插件更新
```

- [ ] **Step 2: 运行全量测试**

```bash
npm run test
```

预期：所有测试 PASS。

- [ ] **Step 3: 验证应用可以编译运行**

```bash
npm run tauri dev
```

预期：Tauri 窗口打开，可以看到完整的 UI 布局和所有功能。

手动验证清单：
1. TopBar 显示版本号和文件切换下拉
2. TabBar 三个标签页可切换
3. Agents 标签页显示 agent 和 category 表格
4. 模型下拉可选择，推荐指示器显示正确
5. 批量替换工具栏可操作
6. MCP 标签页可展开/编辑/添加/删除
7. Provider 标签页左右分栏，可编辑 provider 信息
8. 侧边栏可保存/恢复/导出快照
9. 所有编辑即时写入磁盘（检查 JSON 文件变化）

- [ ] **Step 4: 提交**

```bash
git add README.md
git commit -m "docs: 添加项目 README"
```

- [ ] **Step 5: 最终提交和标记**

```bash
git log --oneline
```

预期看到以下提交历史：

```
docs: 添加项目 README
style: 配置全局样式、窗口尺寸和应用标题
feat: 实现 Provider 管理，支持列表选择、表单编辑、API Key 遮罩和模型管理
feat: 实现 MCP 服务器管理，支持卡片列表、内联编辑、新增和删除
feat: 实现批量模型替换工具栏，支持来源/目标模型选择和确认对话框
feat: 实现 Agent 和 Category 配置表格，支持模型选择和推荐指示器
feat: 实现应用主布局（TopBar、TabBar、Sidebar）和占位组件
feat: 实现共享组件 ConfirmDialog、ModelSelect、JsonPreview
feat: 实现全局配置 Context、useConfig hook 和快照前端逻辑
feat: 实现 Tauri 后端文件读写和快照管理命令
feat: 实现配置文件解析与序列化工具函数
feat: 添加官方推荐模型数据
feat: 定义配置文件 TypeScript 类型
chore: 初始化 Tauri + React + shadcn/ui 项目脚手架
```
