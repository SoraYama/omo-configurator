import type { OpenCodeConfig, OhMyOpenCodeConfig, Provider } from "@/types/config";

export function parseOpenCodeConfig(raw: string): OpenCodeConfig {
  return JSON.parse(raw) as OpenCodeConfig;
}

export function parseOhMyOpenCodeConfig(raw: string): OhMyOpenCodeConfig {
  return JSON.parse(raw) as OhMyOpenCodeConfig;
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

/**
 * 从 plugin 字符串数组中提取 oh-my-open(agent|code) 的版本号
 * 例如 "oh-my-openagent@3.14.0" → "3.14.0"
 */
export function getOhMyOpenCodeVersion(
  config: OpenCodeConfig,
): string | undefined {
  for (const p of config.plugin ?? []) {
    if (typeof p === "string") {
      const match = p.match(/^oh-my-open(?:agent|code)@(.+)$/);
      if (match) return match[1];
    }
  }
  return undefined;
}
