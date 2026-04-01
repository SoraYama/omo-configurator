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
  env?: Record<string, string>;
  enabled?: boolean;
}

export type McpServer = McpServerRemote | McpServerLocal;

/** opencode.json 中的模型定义 */
export interface ProviderModel {
  name: string;
  displayName?: string;
}

/** opencode.json 中的 Provider */
export interface Provider {
  name: string;
  npm?: string;
  baseURL?: string;
  apiKey?: string;
  models: ProviderModel[];
}

/** opencode.json 中的插件定义 */
export interface Plugin {
  name: string;
  version: string;
  [key: string]: unknown;
}

/** opencode.json 完整结构 */
export interface OpenCodeConfig {
  plugins?: Plugin[];
  mcpServers?: Record<string, McpServer>;
  providers?: Record<string, Provider>;
  [key: string]: unknown;
}

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
