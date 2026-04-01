import { invoke } from "@tauri-apps/api/core";
import type { AuthConfig } from "@/types/config";

/**
 * 从 opencode zen 的 /models 端点获取模型列表（通过 Rust 侧，绕过 CORS）
 * 返回格式为 ["opencode/gpt-5.4", "opencode/claude-opus-4-6", ...]
 */
async function fetchZenModels(apiKey: string): Promise<string[]> {
  try {
    const json = await invoke<string>("fetch_zen_models", { apiKey });
    return JSON.parse(json) as string[];
  } catch (e) {
    console.warn("[providers] fetchZenModels 失败:", e);
    return [];
  }
}

/**
 * 从 models.dev/api.json 批量获取多个内置 provider 的模型列表（通过 Rust 侧）
 * 返回格式为 ["providerName/modelId", ...]
 */
async function fetchModelsDevProviders(providerIds: string[]): Promise<string[]> {
  if (providerIds.length === 0) return [];
  try {
    const json = await invoke<string>("fetch_models_dev", { providerIds });
    return JSON.parse(json) as string[];
  } catch (e) {
    console.warn("[providers] fetchModelsDevProviders 失败:", e);
    return [];
  }
}

/**
 * 根据 auth.json 中连接的 provider 列表，异步拉取所有外部模型。
 *
 * - opencode (zen)：调用 zen /models API
 * - 其他内置 provider：调用 models.dev/api.json 批量获取
 *
 * 返回扁平化的 "providerName/modelId" 字符串数组
 */
export async function fetchExternalProviderModels(
  auth: AuthConfig,
): Promise<string[]> {
  const entries = Object.entries(auth);
  if (entries.length === 0) return [];

  let zenApiKey: string | null = null;
  const otherProviderIds: string[] = [];

  for (const [providerId, entry] of entries) {
    if (providerId === "opencode" && entry.type === "api") {
      zenApiKey = entry.key;
    } else if (providerId !== "opencode") {
      otherProviderIds.push(providerId);
    }
  }

  const [zenModels, externalModels] = await Promise.all([
    zenApiKey ? fetchZenModels(zenApiKey) : Promise.resolve([]),
    fetchModelsDevProviders(otherProviderIds),
  ]);

  console.info(
    `[providers] 加载完成：zen ${zenModels.length} 个，其他 ${externalModels.length} 个`,
  );

  return [...zenModels, ...externalModels];
}
