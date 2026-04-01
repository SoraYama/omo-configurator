# OpenCode Configurator - Design Document

## Overview

A desktop GUI tool for editing opencode.json and oh-my-opencode.json configuration files, built with Tauri + React + shadcn/ui.

## Problem

Users frequently need to modify opencode configurations — switching models across agents/categories, managing MCP servers and providers, and maintaining config snapshots. Manual JSON editing is error-prone and tedious.

## Tech Stack

- **Runtime**: Tauri v2 (Rust backend + system WebView)
- **Frontend**: React + TypeScript + shadcn/ui
- **File I/O**: Tauri fs API for direct JSON file read/write
- **Project location**: `/Users/sorayama/Projects/personal/opencode-configurator`

## Config Files Managed

| File | Location | Content |
|------|----------|---------|
| opencode.json | `~/.config/opencode/opencode.json` | Plugins, MCP servers, Providers (API keys, models) |
| oh-my-opencode.json | `~/.config/opencode/oh-my-opencode.json` | Agent models/variants, Category models/variants, claude_code settings |

## Architecture

```
opencode-configurator/
├── src-tauri/              # Tauri backend (Rust)
│   └── src/
│       └── main.rs         # File I/O, snapshot management
├── src/                    # React frontend
│   ├── App.tsx             # Main layout: topbar + tabs + sidebar
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Snapshot list
│   │   │   └── TabBar.tsx            # Three main tabs
│   │   ├── agents/
│   │   │   ├── AgentTable.tsx        # Agent config table
│   │   │   ├── CategoryTable.tsx     # Category config table
│   │   │   └── BatchModelBar.tsx     # Batch model replacement toolbar
│   │   ├── mcp/
│   │   │   ├── McpList.tsx           # MCP server list
│   │   │   └── McpEditor.tsx         # Single MCP edit form
│   │   ├── provider/
│   │   │   ├── ProviderList.tsx      # Provider list
│   │   │   └── ProviderEditor.tsx    # Provider editor (apiKey, models)
│   │   └── shared/
│   │       ├── ModelSelect.tsx       # Reusable model dropdown
│   │       ├── JsonPreview.tsx       # JSON preview/direct edit
│   │       └── ConfirmDialog.tsx     # Confirmation dialog
│   ├── hooks/
│   │   └── useConfig.ts             # Config file read/write hook
│   ├── lib/
│   │   ├── config.ts                # Type definitions & parsing
│   │   ├── snapshots.ts             # Snapshot management logic
│   │   └── recommended-models.ts    # Official recommended models data
│   └── types/
│       └── config.ts                # TypeScript types
└── package.json
```

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│  OpenCode Configurator   [v3.14.0 → 3.15.0 available]  [file ▾] │
├──────────┬───────────────────────────────────────────────────┤
│          │  [Agents & Categories] [MCP Servers] [Providers]  │
│ Snapshots│───────────────────────────────────────────────────│
│          │  Batch: [From ▾] → [To ▾] [Apply]                │
│ ★ 默认   │───────────────────────────────────────────────────│
│ ○ 备用A  │  Agent      │ Model         │ Variant │ 推荐     │
│ ○ 实验   │  sisyphus   │ openrouter/.. │ max     │ ✅/⚠️    │
│          │  hephaestus │ openai/...    │ medium  │ ✅/⚠️    │
│──────────│  ...        │ ...           │ ...     │ ...      │
│ [+ Save] │───────────────────────────────────────────────────│
│ [📤 Export]│ Category   │ Model         │ Variant │ 推荐     │
│          │  ultrabrain │ openrouter/.. │ xhigh   │ ⚠️       │
│          │  deep       │ zhipuai/...   │ medium  │ ✅        │
│          │  ...        │ ...           │ ...     │ ...      │
└──────────┴───────────────────────────────────────────────────┘
```

## Core Features

### 1. Top Bar — File Switcher & Update Checker

- Dropdown to switch between editing `opencode.json` and `oh-my-opencode.json`
- Display current oh-my-openagent version parsed from plugin field
- [Check Update] button queries npm registry for latest version
- Show version diff if update available, one-click to update plugin version in config

### 2. Tab: Agents & Categories

**Agent Table:**
- Columns: Name (read-only), Model (dropdown), Variant (dropdown), Recommended indicator
- Model dropdown options aggregated from all configured Providers
- Recommended indicator:
  - Green checkmark if matches official default
  - Yellow warning if different, hover to see full recommended fallback chain
  - Click to apply official default

**Category Table:**
- Same structure as Agent Table, below Agent Table (collapsible sections)

**Batch Replace Toolbar:**
- Select source model → target model → apply to all matching agents/categories
- Confirmation dialog before applying

### 3. Tab: MCP Servers

- Card list showing: name, type (remote/local), enabled status
- Click card to expand inline editor:
  - Remote: url, headers (key-value pairs), enabled toggle
  - Local: command (array editor), environment (key-value pairs)
- [+ Add MCP] button at top right
- Delete button on each card with confirmation

### 4. Tab: Providers

- Left panel: provider name list
- Right panel: edit form for selected provider
  - name, npm package, baseURL, apiKey (masked with reveal toggle)
  - Model list table (name + display name), add/delete rows
- New provider button

### 5. Sidebar — Snapshot Management

- List saved snapshots with timestamp names
- Click to restore (overwrites current config with confirmation)
- [+ Save Snapshot] creates timestamped copy
- Export button to download snapshot as file
- Snapshots stored in `~/.config/opencode/.snapshots/` directory

### 6. Auto-Save & Safety

- All edits save immediately to disk
- Batch replace and snapshot restore require confirmation dialog
- JSON preview mode available for direct editing

## Official Recommended Models

Hardcoded in `src/lib/recommended-models.ts`, updated with each release.

### Agents

| Agent | Recommended Model | Variant |
|-------|------------------|---------|
| sisyphus | anthropic/claude-opus-4-6 | max |
| hephaestus | openai/gpt-5.4 | medium |
| oracle | openai/gpt-5.4 | high |
| librarian | opencode-go/minimax-m2.7 | - |
| explore | github-copilot/grok-code-fast-1 | - |
| multimodal-looker | openai/gpt-5.4 | medium |
| prometheus | anthropic/claude-opus-4-6 | max |
| metis | anthropic/claude-opus-4-6 | max |
| momus | openai/gpt-5.4 | xhigh |
| atlas | anthropic/claude-sonnet-4-6 | - |
| sisyphus-junior | anthropic/claude-sonnet-4-6 | - |

### Categories

| Category | Recommended Model | Variant |
|----------|------------------|---------|
| visual-engineering | google/gemini-3.1-pro | high |
| ultrabrain | openai/gpt-5.4 | xhigh |
| deep | openai/gpt-5.3-codex | medium |
| artistry | google/gemini-3.1-pro | high |
| quick | openai/gpt-5.4-mini | - |
| unspecified-low | anthropic/claude-sonnet-4-6 | - |
| unspecified-high | anthropic/claude-opus-4-6 | max |
| writing | kimi-for-coding/k2p5 | - |

### Fallback Chains

Each agent/category also has 2-6 fallback options. Stored as ordered arrays, displayed on hover in the recommended indicator tooltip.

## Data Flow

1. App reads both JSON files on startup via Tauri fs API
2. Parsed into TypeScript objects with full type safety
3. React state manages current editing state
4. Every field change triggers immediate write to disk
5. Batch operations modify state then write once

## Non-Goals

- Editing tui.json (can be added later)
- Managing .opencode/ directory files (agents markdown, commands)
- Multiple language support (Chinese UI only for now)
