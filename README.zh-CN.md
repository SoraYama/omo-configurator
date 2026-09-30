# OmO Configurator

桌面 GUI 工具，用于可视化编辑 OpenCode 的 `opencode.json` 与 oh-my-openagent 插件配置（`~/.omo/omo.jsonc`；插件 <5 时为旧版 `oh-my-opencode.json`）。

**English:** [README.md](README.md)

## 创作动机

OpenCode 与 oh-my（agent 配置）往往是体积大、层级深的 JSON。纯文本手改容易出错：漏逗号、模型 ID 写错、MCP 段落不一致，都可能让工作流在不知不觉中坏掉。本工具希望把这类日常维护变得更稳、更快：用结构化表单替代盲改 JSON，一眼看清与官方推荐是否一致，换厂商时能批量调整模型，再配合快照在试错后快速回滚。它面向需要长期维护这些配置、又希望少踩坑的使用者。

## 技术栈

- **Runtime**: Tauri v2 (Rust + WebView)
- **Frontend**: React 19 + TypeScript + shadcn/ui + Tailwind CSS v4
- **构建工具**: Vite
- **测试**: Vitest + Testing Library

## 开发

### 前置条件

- Node.js 20+
- **npm**（安装依赖与运行脚本请使用 npm；本项目不使用 tnpm）
- Rust 1.88+
- macOS / Windows / Linux（需要系统 WebView 运行时）

### 启动开发环境

```bash
npm install
npm run tauri dev
```

### 运行测试

```bash
npm run test
```

### 构建生产包

```bash
npm run tauri build
```

## 功能

### Agents & Categories 标签页
- 可视化编辑每个 agent/category 的模型和 variant
- 推荐模型指示器：绿色 ✅ 表示与官方推荐一致，橙色 ⚠️ 表示不同（悬浮可查看推荐链）
- 点击指示器一键应用官方推荐配置

### 批量替换
- 一键将所有使用某模型的 agent/category 替换为另一个模型
- 带确认对话框，防止误操作

### MCP 服务器管理
- 卡片列表展示所有 MCP 服务器（远程/本地）
- 点击展开内联编辑器：远程配置 URL + Headers，本地配置命令 + 环境变量
- 支持新增、删除服务器

### Provider 管理
- 左右分栏设计：左侧列表，右侧编辑表单
- 支持配置 name、NPM 包、Base URL、API Key（默认遮罩显示）
- 模型列表管理（添加/删除模型条目）

### 快照管理（侧边栏）
- 保存当前配置为带时间戳的快照
- 恢复快照（带确认对话框）
- 导出快照为 JSON 文件

### 版本检查
- 顶栏显示当前 **oh-my-openagent** npm 插件版本（来自 `opencode.json` 的 `plugin` 字段），以及正在编辑的插件配置文件
- 一键检查 npm 最新版本，有更新时可一键升级配置中的版本号。从 <5 升级时会先把 agents 与 categories 写入 `~/.omo/omo.jsonc`，因为插件自带的 5.x 迁移会丢弃它们

## 配置文件位置

| 文件 | 路径 |
|------|------|
| opencode.json | 优先 `~/.config/opencode/opencode.jsonc`，否则 `opencode.json` |
| 插件配置（插件 ≥5 或未固定版本） | `~/.omo/omo.jsonc`（设置位于 `"[opencode]"` 块，使用 `reasoning` 代替 `variant`） |
| 插件配置（插件 <5） | `~/.config/opencode/oh-my-opencode.json[c]`，否则 `oh-my-openagent.json[c]` |
| 快照目录 | `~/.config/opencode/.snapshots/` |

**插件配置（agents / categories）：** 应用根据 `opencode.json` 中固定的插件版本选择文件。插件 ≥5（或未固定版本）时读写 `~/.omo/omo.jsonc`，不存在则用 `omo.json`；旧文件只会被插件自带的迁移导入一次。插件 <5 时按插件自身的查找顺序：`oh-my-opencode.jsonc`、`oh-my-opencode.json`、`oh-my-openagent.jsonc`、`oh-my-openagent.json`。修改为就地编辑，JSONC 注释会保留。快照包含上述所有存在的文件以及 `opencode.json[c]`。
