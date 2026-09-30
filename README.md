# OmO Configurator

A desktop GUI for visually editing OpenCode's `opencode.json` and the oh-my-openagent plugin config (`~/.omo/omo.jsonc`, or the legacy `oh-my-opencode.json` for plugin < 5).

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
- **npm** (use npm for install and scripts; this project does not use `tnpm`)
- Rust 1.88+
- macOS / Windows / Linux (system WebView runtime required)

### Run the dev app

```bash
npm install
npm run tauri dev
```

### Run tests

```bash
npm run test
```

### Production build

```bash
npm run tauri build
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

- Top bar shows the current **oh-my-openagent** npm plugin version (from `opencode.json` `plugin` entries) and which plugin config file is being edited
- One-click check for the latest npm version; when an update exists, bump the version in config in one step. Upgrading from < 5 copies your agents and categories into `~/.omo/omo.jsonc` first, because the plugin's own 5.x migration drops them

## Config file locations

| File | Path |
|------|------|
| opencode.json | `~/.config/opencode/opencode.jsonc`, else `opencode.json` |
| Plugin config (plugin ≥ 5, or unpinned) | `~/.omo/omo.jsonc` (settings in the `"[opencode]"` block, `reasoning` instead of `variant`) |
| Plugin config (plugin < 5) | `~/.config/opencode/oh-my-opencode.json[c]`, else `oh-my-openagent.json[c]` |
| Snapshots | `~/.config/opencode/.snapshots/` |

**Plugin config (agents / categories):** The app follows the plugin version pinned in `opencode.json`. For plugin ≥ 5 (or an unpinned version) it reads and writes `~/.omo/omo.jsonc`, falling back to `omo.json`; the legacy files are only imported once by the plugin's own migration. For plugin < 5 it uses the same lookup order as the plugin: `oh-my-opencode.jsonc`, `oh-my-opencode.json`, `oh-my-openagent.jsonc`, `oh-my-openagent.json`. Edits are applied in place, so JSONC comments are kept. Snapshots include every one of these files that exists, plus `opencode.json[c]`.
