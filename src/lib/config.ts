import {
  applyEdits,
  findNodeAtLocation,
  modify,
  parse,
  parseTree,
  printParseErrorCode,
  type JSONPath,
  type ParseError,
} from "jsonc-parser";
import type {
  AgentConfig,
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  PluginConfigLayout,
  Provider,
} from "@/types/config";

/** 新建 ~/.omo/omo.jsonc 时写入的 $schema */
export const OMO_SCHEMA_URL =
  "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/omo.schema.json";

/** 插件从该主版本起改用 ~/.omo/omo.jsonc（unified 布局） */
export const UNIFIED_CONFIG_MAJOR = 5;

/** 解析 JSON / JSONC（支持注释与尾逗号），语法错误时抛出 */
export function parseJsonc<T = unknown>(raw: string): T {
  const errors: ParseError[] = [];
  const value = parse(raw, errors, { allowTrailingComma: true }) as T;
  if (errors.length > 0) {
    const { error, offset } = errors[0];
    throw new Error(`JSONC 解析失败: ${printParseErrorCode(error)} @${offset}`);
  }
  return value;
}

export interface JsoncChange {
  path: JSONPath;
  /** undefined 表示删除该属性 */
  value: unknown;
}

/** 在原始文本上就地修改，保留注释与格式 */
export function applyJsoncChanges(raw: string, changes: JsoncChange[]): string {
  let text = raw.trim() === "" ? "{}" : raw;
  for (const { path, value } of changes) {
    if (value === undefined && !findNodeAtLocation(parseTree(text)!, path)) {
      continue;
    }
    text = applyEdits(
      text,
      modify(text, path, value, {
        formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
      }),
    );
  }
  return text;
}

export function parseOpenCodeConfig(raw: string): OpenCodeConfig {
  return parseJsonc<OpenCodeConfig>(raw);
}

type RawEntry = Record<string, unknown>;
type RawBlock = Record<string, RawEntry>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 读取 models 数组的首项（unified 布局中 fallback_models 会被迁移并入 models） */
function firstModelRef(entry: RawEntry): { model?: string; reasoning?: string } {
  const first = Array.isArray(entry.models) ? entry.models[0] : undefined;
  if (typeof first === "string") return { model: first };
  if (isRecord(first) && typeof first.model === "string") {
    return {
      model: first.model,
      reasoning: typeof first.reasoning === "string" ? first.reasoning : undefined,
    };
  }
  return {};
}

function toAgentConfig(entry: RawEntry, layout: PluginConfigLayout): AgentConfig {
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  if (layout === "legacy") {
    return { model: str(entry.model) ?? "", variant: str(entry.variant) };
  }
  const head = str(entry.model) === undefined ? firstModelRef(entry) : {};
  return {
    model: str(entry.model) ?? head.model ?? "",
    variant:
      str(entry.reasoning) ??
      str(entry.reasoningEffort) ??
      str(entry.variant) ??
      head.reasoning,
  };
}

function toView(block: unknown, layout: PluginConfigLayout) {
  if (!isRecord(block)) return undefined;
  const result: Record<string, AgentConfig> = {};
  for (const [name, entry] of Object.entries(block)) {
    if (isRecord(entry)) result[name] = toAgentConfig(entry, layout);
  }
  return result;
}

function mergeBlocks(base: unknown, override: unknown): RawBlock | undefined {
  if (!isRecord(base) && !isRecord(override)) return undefined;
  const result: RawBlock = {};
  for (const src of [base, override]) {
    if (!isRecord(src)) continue;
    for (const [name, entry] of Object.entries(src)) {
      if (isRecord(entry)) result[name] = { ...result[name], ...entry };
    }
  }
  return result;
}

/**
 * 从插件配置中提取 OpenCode 生效的 agents / categories
 * unified 布局下合并共享层与 "[opencode]" 块（后者优先），reasoning 映射为 variant
 */
export function parseOhMyOpenCodeConfig(
  raw: string,
  layout: PluginConfigLayout = "legacy",
): OhMyOpenCodeConfig {
  const doc = raw.trim() === "" ? {} : parseJsonc<Record<string, unknown>>(raw);
  if (layout === "legacy") {
    return {
      ...doc,
      agents: toView(doc.agents, layout),
      categories: toView(doc.categories, layout),
    } as OhMyOpenCodeConfig;
  }
  const opencode = isRecord(doc["[opencode]"]) ? doc["[opencode]"] : {};
  return {
    agents: toView(mergeBlocks(doc.agents, opencode.agents), layout),
    categories: toView(mergeBlocks(doc.categories, opencode.categories), layout),
  };
}

/** 计算写入某个 agent / category 所需的 JSONC 修改 */
export function pluginEntryChanges(
  raw: string,
  layout: PluginConfigLayout,
  kind: "agents" | "categories",
  name: string,
  config: AgentConfig,
): JsoncChange[] {
  if (layout === "legacy") {
    const path = [kind, name];
    return [
      { path: [...path, "model"], value: config.model },
      { path: [...path, "variant"], value: config.variant },
    ];
  }
  const path = ["[opencode]", kind, name];
  const doc = raw.trim() === "" ? {} : parseJsonc<Record<string, unknown>>(raw);
  const opencode = isRecord(doc["[opencode]"]) ? doc["[opencode]"] : {};
  const block = isRecord(opencode[kind]) ? opencode[kind] : {};
  const existing = isRecord(block[name]) ? block[name] : {};
  // 已用 models 链且无 model 字段时，替换链首而不是新增 model
  if (existing.model === undefined && Array.isArray(existing.models) && existing.models.length > 0) {
    return [
      {
        path: [...path, "models", 0],
        value: config.variant
          ? { model: config.model, reasoning: config.variant }
          : config.model,
      },
    ];
  }
  return [
    { path: [...path, "model"], value: config.model },
    { path: [...path, "reasoning"], value: config.variant },
    // 已弃用的旧字段会与 reasoning 冲突，一并移除
    { path: [...path, "variant"], value: undefined },
    { path: [...path, "reasoningEffort"], value: undefined },
  ];
}

/**
 * 以 legacy 配置中的 agents / categories 生成 unified 配置
 * 插件 5.x 的迁移不会导入这两项，升级前需主动带过去
 */
export function buildUnifiedSeed(legacy: OhMyOpenCodeConfig): string {
  const convert = (block?: Record<string, AgentConfig>) =>
    block &&
    Object.fromEntries(
      Object.entries(block).map(([name, c]) => [
        name,
        c.variant ? { model: c.model, reasoning: c.variant } : { model: c.model },
      ]),
    );
  const opencode: Record<string, unknown> = {};
  const agents = convert(legacy.agents);
  const categories = convert(legacy.categories);
  if (agents && Object.keys(agents).length > 0) opencode.agents = agents;
  if (categories && Object.keys(categories).length > 0) {
    // 插件 5.x 将 deep 重命名为 deep-low
    if (categories.deep && !categories["deep-low"]) {
      categories["deep-low"] = categories.deep;
    }
    delete categories.deep;
    opencode.categories = categories;
  }
  return (
    JSON.stringify({ $schema: OMO_SCHEMA_URL, "[opencode]": opencode }, null, 2) + "\n"
  );
}

export function serializeConfig(config: unknown): string {
  return JSON.stringify(config, null, 2);
}

/**
 * 从 providers 中聚合已声明的模型，格式为 "providerName/modelId"
 * models 是 Record<string, { name }> 格式
 */
export function extractModelsFromProviders(
  providers: Record<string, Provider>,
): string[] {
  const models: string[] = [];
  for (const [providerName, provider] of Object.entries(providers)) {
    if (provider.models) {
      for (const modelId of Object.keys(provider.models)) {
        models.push(`${providerName}/${modelId}`);
      }
    }
  }
  return models;
}

/**
 * 聚合所有可用模型（去重，顺序：外部内置 → opencode.json 自定义 → 当前在用）：
 * 1. auth.json 连接的内置 provider 的模型（opencode zen / openai / google 等）
 * 2. opencode.json provider 显式声明的模型（自定义 provider）
 * 3. agents / categories 中已在用但以上两项都未包含的模型
 */
export function buildModelList(
  openCodeConfig: OpenCodeConfig | null,
  ohMyOpenCodeConfig: OhMyOpenCodeConfig | null,
  externalModels: string[] = [],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  const addUnique = (m: string) => {
    if (!seen.has(m)) {
      seen.add(m);
      result.push(m);
    }
  };

  // 1. auth.json 连接的内置/外部 provider 模型
  externalModels.forEach(addUnique);

  // 2. opencode.json 显式声明的自定义 provider 模型
  if (openCodeConfig?.provider) {
    extractModelsFromProviders(openCodeConfig.provider).forEach(addUnique);
  }

  // 3. 当前 agents/categories 已在用但未包含的模型
  for (const agent of Object.values(ohMyOpenCodeConfig?.agents ?? {})) {
    if (agent.model) addUnique(agent.model);
  }
  for (const cat of Object.values(ohMyOpenCodeConfig?.categories ?? {})) {
    if (cat.model) addUnique(cat.model);
  }

  return result;
}

/** 匹配 plugin 数组中的 oh-my-openagent / oh-my-opencode 条目（含 npm: 前缀与作者 scope） */
const OMO_PLUGIN_PATTERN =
  /^(?:npm:)?(?:@code-yeongyu\/)?oh-my-open(?:agent|code)(?:@(.+))?$/;

/** plugin 条目的包名部分（兼容 [包名, 选项] 元组写法） */
export function pluginEntryName(entry: unknown): string | undefined {
  if (typeof entry === "string") return entry;
  if (Array.isArray(entry) && typeof entry[0] === "string") return entry[0];
  return undefined;
}

export function isOmoPluginEntry(entry: unknown): boolean {
  const name = pluginEntryName(entry);
  return name !== undefined && OMO_PLUGIN_PATTERN.test(name);
}

/**
 * 从 plugin 字符串数组中提取 oh-my-open(agent|code) 的版本号
 * 例如 "oh-my-openagent@3.14.0" → "3.14.0"
 */
export function getOhMyOpenCodeVersion(
  config: OpenCodeConfig,
): string | undefined {
  for (const p of config.plugin ?? []) {
    const version = pluginEntryName(p)?.match(OMO_PLUGIN_PATTERN)?.[1];
    if (version) return version;
  }
  return undefined;
}

/** 插件主版本号；未固定版本（如 @latest 或不带版本）时返回 undefined */
export function getPluginMajor(version: string | undefined): number | undefined {
  const major = Number.parseInt(version ?? "", 10);
  return Number.isNaN(major) ? undefined : major;
}

const LEGACY_VARIANTS = ["medium", "high", "xhigh", "max"];
/** 插件 5.x 的 reasoning 取值（variant 值与其一一对应） */
const REASONING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max", "auto"];

/** 推理强度下拉选项，"__none" 表示不设置；当前值不在列表中时追加，避免下拉显示为空 */
export function reasoningOptions(
  layout: PluginConfigLayout | undefined,
  current?: string,
): string[] {
  const levels = layout === "unified" ? REASONING_LEVELS : LEGACY_VARIANTS;
  const options = ["__none", ...levels];
  if (current && !options.includes(current)) options.push(current);
  return options;
}
