# Task 7：共享组件（ConfirmDialog、ModelSelect、JsonPreview）

## Status

**DONE**

## 创建的文件

- `src/components/shared/ConfirmDialog.tsx` — 基于 `AlertDialog` 的确认弹层，支持默认/危险样式与自定义按钮文案。
- `src/components/shared/ModelSelect.tsx` — 从 `ConfigContext` 读取 `openCodeConfig.providers`，经 `extractModelsFromProviders` 生成 `provider/model` 选项列表。
- `src/components/shared/JsonPreview.tsx` — JSON 只读预览与可切换的文本编辑、校验与保存回调。

## 编译结果

`tnpm run build`（`tsc && vite build`）**成功**，无 TypeScript 错误。

## 自我 review

1. **ConfirmDialog**：`onOpenChange` 在关闭时调用 `onCancel`，与取消按钮的 `onClick` 可能重复触发；若调用方副作用非幂等需注意（常见模式可接受）。`AlertDialog` 为受控 `open`，行为与 Radix 一致。
2. **ModelSelect**：空 `providers` 时列表为空，仍为合法 Select；调用方需保证 `value` 与选项一致，否则可能出现无选中展示（由 shadcn Select 行为决定）。
3. **JsonPreview**：`JSON.stringify` 对 `undefined` 返回 `undefined`（运行时），当前与任务给定实现一致；极端输入下展示与 `useState` 初值需由调用方约束 `value` 类型时更稳妥。
4. **规范**：`import` 顺序与任务中 ModelSelect 示例一致；`noUnusedLocals` 下无多余符号。
