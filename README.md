# OpenCode Configurator

桌面 GUI 工具，用于可视化编辑 `opencode.json` 和 `oh-my-opencode.json` 配置文件。

## 技术栈

- **Runtime**: Tauri v2 (Rust + WebView)
- **Frontend**: React 19 + TypeScript + shadcn/ui + Tailwind CSS v4
- **构建工具**: Vite
- **测试**: Vitest + Testing Library

## 开发

### 前置条件

- Node.js 20+
- Rust 1.88+
- macOS / Windows / Linux（需要系统 WebView 运行时）

### 启动开发环境

```bash
tnpm install
tnpm run tauri dev
```

### 运行测试

```bash
tnpm run test
```

### 构建生产包

```bash
tnpm run tauri build
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
- 顶栏显示当前 oh-my-opencode 插件版本
- 一键检查 npm 最新版本，有更新时可一键升级配置中的版本号

## 配置文件位置

| 文件 | 路径 |
|------|------|
| opencode.json | `~/.config/opencode/opencode.json` |
| oh-my-opencode.json | `~/.config/opencode/oh-my-opencode.json` |
| 快照目录 | `~/.config/opencode/.snapshots/` |
