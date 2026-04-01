import type {
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  Provider,
} from "@/types/config";

export function parseOpenCodeConfig(raw: string): OpenCodeConfig {
  return JSON.parse(raw) as OpenCodeConfig;
}

export function parseOhMyOpenCodeConfig(raw: string): OhMyOpenCodeConfig {
  return JSON.parse(raw) as OhMyOpenCodeConfig;
}

export function serializeConfig(config: unknown): string {
  return JSON.stringify(config, null, 2);
}

export function extractModelsFromProviders(
  providers: Record<string, Provider>,
): string[] {
  const models: string[] = [];
  for (const [providerName, provider] of Object.entries(providers)) {
    for (const model of provider.models) {
      models.push(`${providerName}/${model.name}`);
    }
  }
  return models;
}

export function getOhMyOpenCodeVersion(
  config: OpenCodeConfig,
): string | undefined {
  return config.plugins?.find((p) => p.name === "oh-my-opencode")?.version;
}
