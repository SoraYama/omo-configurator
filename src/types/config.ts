/** 插件配置中的 agent 配置（variant 在 unified 布局下对应 reasoning 字段） */
export interface AgentConfig {
  model: string;
  variant?: string;
}

/** 插件配置中的 category 配置（variant 在 unified 布局下对应 reasoning 字段） */
export interface CategoryConfig {
  model: string;
  variant?: string;
}

/** oh-my-opencode.json 中的 claude_code 设置 */
export interface ClaudeCodeSettings {
  [key: string]: unknown;
}

/** 插件配置中 OpenCode 生效的 agents / categories 视图 */
export interface OhMyOpenCodeConfig {
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  claude_code?: ClaudeCodeSettings;
}

/** 远程 MCP 服务器的 OAuth 配置 */
export interface McpOAuthConfig {
  clientId?: string;
  clientSecret?: string;
  scope?: string;
  callbackPort?: number;
  redirectUri?: string;
}

/** opencode.json 中的 MCP 服务器（远程） */
export interface McpServerRemote {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
  /** false 表示关闭 OAuth 自动探测 */
  oauth?: McpOAuthConfig | false;
  /** 请求超时（毫秒），默认 5000 */
  timeout?: number;
  enabled?: boolean;
}

/** opencode.json 中的 MCP 服务器（本地） */
export interface McpServerLocal {
  type: "local";
  command: string[];
  cwd?: string;
  environment?: Record<string, string>;
  timeout?: number;
  enabled?: boolean;
}

/** 只覆盖启用状态的条目，例如在项目配置中禁用全局定义的 server */
export interface McpServerToggle {
  type?: undefined;
  enabled: boolean;
}

export type McpServer = McpServerRemote | McpServerLocal | McpServerToggle;

/** opencode.json 中 provider 的 options */
export interface ProviderOptions {
  baseURL?: string;
  apiKey?: string;
  [key: string]: unknown;
}

/** opencode.json 中 provider 的单个模型（limit、cost、options、variants 等字段原样保留） */
export interface ProviderModelEntry {
  name?: string;
  [key: string]: unknown;
}

/** opencode.json 中的 Provider */
export interface Provider {
  name?: string;
  npm?: string;
  env?: string[];
  whitelist?: string[];
  blacklist?: string[];
  options?: ProviderOptions;
  models?: Record<string, ProviderModelEntry>;
  [key: string]: unknown;
}

/** opencode.json 完整结构（字段名以实际文件为准） */
/** plugin 条目：包名字符串，或 [包名, 插件选项] 元组 */
export type PluginEntry = string | [string, Record<string, unknown>];

export interface OpenCodeConfig {
  plugin?: PluginEntry[];
  mcp?: Record<string, McpServer>;
  provider?: Record<string, Provider>;
  [key: string]: unknown;
}

/** ~/.local/share/opencode/auth.json 中的单条认证记录 */
export interface AuthEntryApi {
  type: "api";
  key: string;
}

export interface AuthEntryOAuth {
  type: "oauth";
  refresh: string;
  access: string;
  expires: number;
  accountId?: string;
}

export type AuthEntry = AuthEntryApi | AuthEntryOAuth;

/**
 * auth.json 的完整结构：providerName → AuthEntry
 * 存储通过 /connect 命令连接的所有 provider 的认证信息
 */
export type AuthConfig = Record<string, AuthEntry>;

/** 快照元信息 */
export interface Snapshot {
  name: string;
  timestamp: number;
  files: {
    opencode?: string;
    ohMyOpencode?: string;
  };
}

/** 应用当前编辑的配置文件类型 */
export type ConfigFileType = "opencode" | "oh-my-opencode";

/** 推荐模型条目 */
export interface RecommendedModel {
  /** "provider/modelId"，provider 取 providers 中的第一个 */
  model: string;
  variant?: string;
  /** 可提供该模型的 provider 列表；为空时只按完整 model 字符串匹配 */
  providers?: string[];
  fallbacks: Array<{ model: string; variant?: string }>;
}

/**
 * 插件配置文件布局
 * - unified：插件 ≥5 读取的 ~/.omo/omo.jsonc，OpenCode 专属设置位于 "[opencode]" 块，推理强度字段为 reasoning
 * - legacy：插件 <5 读取的 ~/.config/opencode/oh-my-open(code|agent).json[c]，推理强度字段为 variant
 */
export type PluginConfigLayout = "unified" | "legacy";

/** Rust 侧 resolve_plugin_config 的返回值 */
export interface PluginConfigLocation {
  path: string;
  layout: PluginConfigLayout;
  exists: boolean;
}
