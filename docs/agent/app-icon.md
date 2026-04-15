# App 图标（omo-configurator）

## 设计说明

- **语义**：整体为一个 **齿轮 (Gear)**，代表「设置/配置 (Configurator)」；齿轮中心镂空，内部是一个 **终端提示符 `>`**，代表「代码/终端 (OpenCode)」。组合起来直观表达了「OpenCode 配置工具」的含义。
- **配色**：`#171717` 深色底、`#fafafa` 浅色图形，与界面 `index.css` 中黑白灰主题一致；图形为原创矢量，非 OpenCode 商标文件。
- **参考**：OpenCode 品牌方形资源见 [anomalyco/opencode](https://github.com/anomalyco/opencode)（`packages/console/app/src/asset/brand/`）。

## 仓库内路径

| 用途 | 路径 |
|------|------|
| 矢量源稿（唯一需手改的文件） | `src-tauri/icons/app-icon.svg` |
| Web / dev 页签图标 | `public/app-icon.svg`（与源稿同步） |
| Tauri 生成的各平台位图 | `src-tauri/icons/*`（`tauri icon` 输出） |

## 构建流程

修改 `app-icon.svg` 后执行（请使用 **npm**）：

```bash
npm run icons
```

该脚本会：用 `tauri icon` 根据 `src-tauri/icons/app-icon.svg` 生成各平台位图，并把同一 SVG 同步到 `public/app-icon.svg`（供 Vite 页签图标）。

`tauri build` / `tauri dev` 会按 `tauri.conf.json` 的 `bundle.icon` 使用 `src-tauri/icons` 下已生成文件，无需在每次 `npm run build` 前强制跑 `icons`，除非更新了源 SVG。
