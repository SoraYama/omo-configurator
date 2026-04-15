# Task 6：全局配置 Context 与 useConfig — 自我审查

## Status

**DONE**

## 测试结果

- `npm run test -- tests/hooks/useConfig.test.tsx`：**2 passed / 2**
- `npm run build`（`tsc && vite build`）：**通过**

## 修改的文件（当前仓库状态）

Task 6 相关文件已在提交 `a862326`（`feat: 实现全局配置 Context、useConfig hook 和快照前端逻辑`）中纳入版本库：

- `src/context/ConfigContext.tsx` — `ConfigProvider`、`useConfig`、reducer、读写 Tauri `read_config` / `write_config`
- `src/lib/snapshots.ts` — 快照相关 `invoke` 封装与 `generateSnapshotName`
- `tests/hooks/useConfig.test.tsx` — 初始化加载与 `updateAgent` 行为测试

未单独新增 `src/hooks/useConfig.ts`：hook 由 `@/context/ConfigContext` 导出，符合任务说明。

## 自我审查

### 与任务范本的差异（有意为之）

1. **`useEffect` / 持久化**：使用 `void reload()`、`void persistOhMy(...)`、`void persistOpenCode(...)`，避免未处理的 Promise 在严格 lint 规则下产生告警，语义与直接调用一致。
2. **`deleteMcpServer` / `deleteProvider`**：采用「浅拷贝后 `delete key`」，而非 `const { [name]: _, ...rest }`，避免在 `noUnusedLocals: true` 下对忽略绑定 `_` 的误报或风格争议。

### TypeScript / 质量

- `tsc` 随 `build` 通过；`ConfigContext` 与 `snapshots.ts` 类型与 `@/types/config`、`@/lib/config` 一致。
- `batchReplaceModel` 在替换时显式写入 `{ model, variant }`，`toVariant` 为 `undefined` 时会覆盖为无 `variant` 字段，与常见「清空 variant」语义一致；若产品期望「未传则保留原 variant」，后续可再收紧。

### 提交说明

本次会话执行时，上述实现已存在于 `master` 且无新的未提交 diff；**无需重复提交**。若需在本机核对：`git show a862326`。
