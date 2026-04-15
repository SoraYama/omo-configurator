# OmO Configurator

A desktop GUI for visually editing `opencode.json` and the oh-my agent config (`oh-my-openagent.json`, with legacy support for `oh-my-opencode.json`).

**Other languages:** [简体中文](README.zh-CN.md)

## Motivation

OpenCode and oh-my agent configs ship large, nested JSON configs. Hand-editing them in a text editor is easy to get wrong: a missing comma, a mistyped model id, or an inconsistent MCP block can break a workflow silently. This app exists to make that work safer and faster—structured forms instead of raw JSON, visibility into recommended models, bulk changes when you switch providers, and snapshots so you can roll back after experiments. It is a companion for people who live in these configs daily and want fewer surprises.

## Stack

- **Runtime**: Tauri v2 (Rust + WebView)
- **Frontend**: React 19 + TypeScript + shadcn/ui + Tailwind CSS v4
- **Build**: Vite
- **Tests**: Vitest + Testing Library

## Development

### Prerequisites

- Node.js 20+
- Rust 1.88+
- macOS / Windows / Linux (system WebView runtime required)

### Run the dev app

```bash
tnpm install
tnpm run tauri dev
```

### Run tests

```bash
tnpm run test
```

### Production build

```bash
tnpm run tauri build
```

## Features

### Agents & Categories tab

- Edit model and variant per agent/category in the UI
- Recommended-model indicators: green ✅ when it matches the official recommendation, orange ⚠️ when it differs (hover for the recommendation chain)
- Click an indicator to apply the official recommendation in one step

### Bulk replace

- Replace every agent/category that uses one model with another, in one action
- Confirmation dialog to reduce mistakes

### MCP servers

- Card list of all MCP servers (remote/local)
- Inline editor on expand: remote URL + headers; local command + environment variables
- Add and remove servers

### Providers

- Split layout: list on the left, form on the right
- Configure name, NPM package, base URL, API key (masked by default)
- Manage model entries (add/remove)

### Snapshots (sidebar)

- Save the current configuration as a timestamped snapshot
- Restore a snapshot (with confirmation)
- Export a snapshot as a JSON file

### Version check

- Top bar shows the current **oh-my-openagent** npm plugin version (from `opencode.json` `plugin` entries)
- One-click check for the latest npm version; when an update exists, bump the version in config in one step

## Config file locations

| File | Path |
|------|------|
| opencode.json | `~/.config/opencode/opencode.json` |
| oh-my agent config | `~/.config/opencode/oh-my-openagent.json` |
| Snapshots | `~/.config/opencode/.snapshots/` |

**Oh-my config (agents / categories):** The app reads **`oh-my-openagent.json` first**, then falls back to **`oh-my-opencode.json`** in the same directory if the new file is missing. Saves always go to **`oh-my-openagent.json`**. Snapshots include both filenames when present, plus `opencode.json`.
