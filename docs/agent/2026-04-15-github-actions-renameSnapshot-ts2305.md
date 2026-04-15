# GitHub Actions TS2305：`renameSnapshot` 未导出

## 现象

`beforeBuildCommand`（`npm run build` → `tsc`）报错：

- `src/components/layout/Sidebar.tsx`：`Module '"@/lib/snapshots"' has no exported member 'renameSnapshot'.`（TS2305）

## 根因

并非当前 `master` 代码缺失导出，而是 **发布所用 Git 引用与代码不一致**：

- 标签 **`v0.1.2`** 指向提交 `440f611`。
- 在该提交中，`Sidebar.tsx` 已从 `@/lib/snapshots` 导入 `renameSnapshot`，但 `src/lib/snapshots.ts` 里 **尚未** 实现并导出 `renameSnapshot`（该逻辑在后续提交 `96ab2ff` 中补齐）。
- Release 工作流在 **`push` 匹配 `v*` 标签** 时检出 **标签所指向的提交**，因此构建的是「半套」重命名 UI，TypeScript 必然失败。

## 验证

```bash
git show v0.1.2:src/lib/snapshots.ts   # 无 renameSnapshot
git show origin/master:src/lib/snapshots.ts   # 有 renameSnapshot
```

本地/当前 `master` 执行 `tnpm run build` 应能通过。

## 处理建议

1. **新发布**：在包含 `renameSnapshot` 的提交上打新标签（例如 `v0.1.3`，与当前 `package.json` 版本一致），推送标签触发 Release。
2. **若 `v0.1.2` 尚未对外发布且可改写历史**：删除远程 `v0.1.2` 标签并在正确提交上重建（需谨慎，已克隆者需同步）。
3. **流程上**：避免在「仅改 UI 引用、未改 lib 导出」的中间提交上打发布标签；或打标签前本地跑一遍 `tnpm run build`。

## 工作流说明

`.github/workflows/release.yml` 在 `push` 到 `v*` 标签时运行；构建的是 **该标签的 tree**，与 `master` 是否已前进无关。
