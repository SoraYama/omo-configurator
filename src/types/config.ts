/** oh-my-opencode.json 中的 agent 配置 */
export interface AgentConfig {
  model: string;
  variant?: string;
}

/** oh-my-opencode.json 中的 category 配置 */
export interface CategoryConfig {
  model: string;
  variant?: string;
}

/** oh-my-opencode.json 中的 claude_code 设置 */
export interface ClaudeCodeSettings {
  [key: string]: unknown;
}

/** oh-my-opencode.json 完整结构 */
export interface OhMyOpenCodeConfig {
  agents?: Record<string, AgentConfig>;
  categories?: Record<string, CategoryConfig>;
  claude_code?: ClaudeCodeSettings;
}

/** opencode.json 中的 MCP 服务器（远程） */
export interface McpServerRemote {
  type: "remote";
  url: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}

/** opencode.json 中的 MCP 服务器（本地） */
export interface McpServerLocal {
  type: "local";
  command: string[];
  environment?: Record<string, string>;
  enabled?: boolean;
}

export type McpServer = McpServerRemote | McpServerLocal;

/** opencode.json 中 provider 的 options */
export interface ProviderOptions {
  baseURL?: string;
  apiKey?: string;
}

/** opencode.json 中 provider 的单个模型 */
export interface ProviderModelEntry {
  name: string;
}

/** opencode.json 中的 Provider */
export interface Provider {
  name?: string;
  npm?: string;
  options?: ProviderOptions;
  models?: Record<string, ProviderModelEntry>;
}

/** opencode.json 完整结构（字段名以实际文件为准） */
export interface OpenCodeConfig {
  plugin?: string[];
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
  model: string;
  variant?: string;
  fallbacks: Array<{ model: string; variant?: string }>;
}
