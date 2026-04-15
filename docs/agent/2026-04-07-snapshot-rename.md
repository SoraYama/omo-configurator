# 快照重命名功能

## 变更摘要

- **Rust**（`src-tauri/src/snapshots.rs`）：新增 `validate_snapshot_name` 校验名称（非空、无路径分隔符、非 `.` / `..`）；新增命令 `rename_snapshot(from, to)`，使用 `fs::rename` 重命名快照目录；若目标名已存在或源不存在则返回明确错误。
- **注册**（`src-tauri/src/lib.rs`）：将 `rename_snapshot` 加入 `invoke_handler`。
- **前端**（`src/lib/snapshots.ts`）：新增 `renameSnapshot(from, to)`。
- **UI**（`src/components/layout/Sidebar.tsx`）：快照项悬停操作区增加「改名」按钮，弹出对话框编辑名称；失败时 `alert` 展示后端错误信息。

## 验证

- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run build`
- `npm test`
