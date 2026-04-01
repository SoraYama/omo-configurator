# Task 5：Tauri Rust 后端 — 文件读写与快照命令

## Status

**DONE**

## 编译结果

- 首次 `cargo build` 因本机 `rustc 1.87.0` 低于依赖要求的 `1.88.0+` 失败。
- 已执行 `rustup update stable`，升级至 `rustc 1.94.1` 后，`src-tauri` 下 `cargo build` **成功**（`Finished dev profile`）。

## 修改的文件

| 路径 | 说明 |
|------|------|
| `src-tauri/src/commands.rs` | 新建：`read_config` / `write_config` / `config_file_exists`，路径 `~/.config/opencode` |
| `src-tauri/src/snapshots.rs` | 新建：快照目录 `~/.config/opencode/.snapshots`，列表/保存/恢复/删除/导出 |
| `src-tauri/src/lib.rs` | 注册 `mod commands` / `mod snapshots`，`invoke_handler` 挂载上述命令，移除 `greet` |

## 自我 Review

1. **与规格一致**：命令签名、错误信息中文、`opencode.json` / `oh-my-opencode.json` 快照逻辑与任务描述一致。
2. **`write_config` 边界**：若 `~/.config/opencode` 不存在，`fs::write` 可能失败；当前按任务给定实现，前端或后续可补 `create_dir_all`。
3. **`restore_snapshot`**：仅复制快照中存在的文件到配置目录，不删除目标侧多余文件，符合「按文件恢复」的常见预期。
4. **`export_snapshot`**：导出为 JSON map，值为原始文件字符串，便于前端展示或再处理；非严格 JSON 合并语义（与设计一致）。
5. **环境**：仓库未提交 `rust-toolchain.toml`；协作者若仍为旧 rustc，需升级或锁依赖版本——可选后续改进，非本任务范围。

## Git

- 提交信息：`feat: 实现 Tauri 后端文件读写和快照管理命令`
- 哈希：`3c8d64a`（以实际 `git log -1` 为准）
