# design-assets 技能安装说明

## 来源

- 仓库：[jezweb/claude-skills](https://github.com/jezweb/claude-skills)
- 插件路径：`plugins/design-assets/`
- 许可证：与原仓库一致（MIT，见上游 [LICENSE](https://github.com/jezweb/claude-skills/blob/main/LICENSE)）

## 本仓库中的位置

已安装到 Cursor 项目级技能目录：

- `.cursor/skills/`

## 已包含的子技能

| 目录 | 能力概要 |
|------|----------|
| `ai-image-generator` | AI 图像生成（Gemini/GPT 等） |
| `color-palette` | 从单色十六进制生成可访问配色 |
| `favicon-gen` | favicon 与图标包 |
| `icon-set-generator` | 自定义 SVG 图标集 |
| `image-processing` | 图片缩放、格式转换、优化 |

## 与 Claude Code 插件命令的对应关系

上游 README 中若使用 Claude Code，可通过：

```text
/plugin marketplace add jezweb/claude-skills
/plugin install design-assets@jezweb-skills
```

本仓库为 **Cursor** 场景，已将上述插件内的 `skills/` 子目录同步到 `.cursor/skills/`，无需在终端执行 `/plugin` 命令。

## 更新方式

如需更新到上游最新版，可重新从 `main` 分支拉取 `plugins/design-assets/skills/` 并覆盖 `.cursor/skills/` 中对应子目录。
