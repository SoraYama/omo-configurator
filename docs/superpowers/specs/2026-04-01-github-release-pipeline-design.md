# GitHub Actions Release Pipeline Design

## Goal

Automatically build and publish macOS binaries to GitHub Releases when a version tag is pushed.

## Triggers

- **Tag push**: Any tag matching `v*` (e.g. `v0.1.0`) triggers the workflow.
- **Manual**: `workflow_dispatch` allows triggering from the GitHub Actions UI.

## Build Matrix

| Runner | Architecture | Notes |
|---|---|---|
| `macos-latest` | aarch64 (Apple Silicon) | M-series chips |
| `macos-13` | x86_64 (Intel) | Last Intel macOS runner |

Both runners produce a `.dmg` installer.

## Workflow Steps

1. Checkout code (`actions/checkout@v4`)
2. Install Node.js (`actions/setup-node@v4`, node 20)
3. Install Rust toolchain (`dtolnay/rust-toolchain@stable`)
4. Install frontend dependencies (`npm install`)
5. Build and release (`tauri-apps/tauri-action@v0`)
   - Reads version from `package.json` / `tauri.conf.json`
   - Builds Tauri app (runs `tsc && vite build` then `tauri build`)
   - Uploads `.dmg` artifacts to a GitHub Release

## Signing

No code signing in the initial version. The workflow is structured so that Apple Developer certificate environment variables can be added later without restructuring.

## File

- `.github/workflows/release.yml` — single workflow file

## Usage

```bash
# Create and push a tag to trigger a release
git tag v0.1.0
git push origin v0.1.0
```

Or go to Actions tab > Release > Run workflow.
