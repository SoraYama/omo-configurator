import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  OpenCodeConfig,
  OhMyOpenCodeConfig,
  AgentConfig,
  CategoryConfig,
  McpServer,
  Provider,
  ConfigFileType,
  AuthConfig,
} from "@/types/config";
import {
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  serializeConfig,
} from "@/lib/config";
import { fetchExternalProviderModels } from "@/lib/providers";

interface ConfigState {
  openCodeConfig: OpenCodeConfig | null;
  ohMyOpenCodeConfig: OhMyOpenCodeConfig | null;
  authConfig: AuthConfig | null;
  /** 从 auth.json 连接的内置/外部 provider 拉取到的模型列表 */
  externalModels: string[];
  activeFile: ConfigFileType;
  loading: boolean;
  error: string | null;
}

type ConfigAction =
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_OPENCODE"; config: OpenCodeConfig }
  | { type: "SET_OH_MY"; config: OhMyOpenCodeConfig }
  | { type: "SET_ACTIVE_FILE"; file: ConfigFileType }
  | { type: "SET_BOTH"; openCode: OpenCodeConfig; ohMy: OhMyOpenCodeConfig; auth: AuthConfig }
  | { type: "SET_EXTERNAL_MODELS"; models: string[] };

function configReducer(state: ConfigState, action: ConfigAction): ConfigState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_OPENCODE":
      return { ...state, openCodeConfig: action.config };
    case "SET_OH_MY":
      return { ...state, ohMyOpenCodeConfig: action.config };
    case "SET_ACTIVE_FILE":
      return { ...state, activeFile: action.file };
    case "SET_BOTH":
      return {
        ...state,
        openCodeConfig: action.openCode,
        ohMyOpenCodeConfig: action.ohMy,
        authConfig: action.auth,
        loading: false,
        error: null,
      };
    case "SET_EXTERNAL_MODELS":
      return { ...state, externalModels: action.models };
    default:
      return state;
  }
}

interface ConfigContextValue extends ConfigState {
  reload: () => Promise<void>;
  setActiveFile: (file: ConfigFileType) => void;
  /** 手动触发重新拉取外部 provider 模型（例如新连接了 provider 后） */
  refreshExternalModels: () => Promise<void>;
  updateAgent: (name: string, config: AgentConfig) => void;
  updateCategory: (name: string, config: CategoryConfig) => void;
  updateMcpServer: (name: string, server: McpServer) => void;
  deleteMcpServer: (name: string) => void;
  updateProvider: (name: string, provider: Provider) => void;
  deleteProvider: (name: string) => void;
  batchReplaceModel: (
    fromModel: string,
    toModel: string,
    toVariant?: string,
  ) => void;
  updatePluginVersion: (pluginName: string, newVersion: string) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

async function persistOhMy(config: OhMyOpenCodeConfig) {
  await invoke("write_config", {
    filename: "oh-my-opencode.json",
    content: serializeConfig(config),
  });
}

async function persistOpenCode(config: OpenCodeConfig) {
  await invoke("write_config", {
    filename: "opencode.json",
    content: serializeConfig(config),
  });
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, {
    openCodeConfig: null,
    ohMyOpenCodeConfig: null,
    authConfig: null,
    externalModels: [],
    activeFile: "oh-my-opencode",
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const [ocRaw, omRaw, authRaw] = await Promise.all([
        invoke<string>("read_config", { filename: "opencode.json" }),
        invoke<string>("read_config", { filename: "oh-my-opencode.json" }),
        invoke<string>("read_auth"),
      ]);
      const oc = parseOpenCodeConfig(ocRaw);
      const auth = JSON.parse(authRaw) as AuthConfig;
      dispatch({
        type: "SET_BOTH",
        openCode: oc,
        ohMy: parseOhMyOpenCodeConfig(omRaw),
        auth,
      });
      // 异步拉取外部模型，不阻塞 UI 渲染
      void fetchExternalProviderModels(auth, oc).then((models) => {
        dispatch({ type: "SET_EXTERNAL_MODELS", models });
      });
    } catch (e) {
      dispatch({ type: "SET_ERROR", error: String(e) });
    }
  }, []);

  const refreshExternalModels = useCallback(async () => {
    if (!state.authConfig) return;
    const models = await fetchExternalProviderModels(state.authConfig, state.openCodeConfig);
    dispatch({ type: "SET_EXTERNAL_MODELS", models });
  }, [state.authConfig, state.openCodeConfig]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setActiveFile = useCallback((file: ConfigFileType) => {
    dispatch({ type: "SET_ACTIVE_FILE", file });
  }, []);

  const updateAgent = useCallback(
    (name: string, config: AgentConfig) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        agents: { ...state.ohMyOpenCodeConfig.agents, [name]: config },
      };
      dispatch({ type: "SET_OH_MY", config: updated });
      void persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updateCategory = useCallback(
    (name: string, config: CategoryConfig) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        categories: { ...state.ohMyOpenCodeConfig.categories, [name]: config },
      };
      dispatch({ type: "SET_OH_MY", config: updated });
      void persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updateMcpServer = useCallback(
    (name: string, server: McpServer) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        mcp: { ...state.openCodeConfig.mcp, [name]: server },
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      void persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const deleteMcpServer = useCallback(
    (name: string) => {
      if (!state.openCodeConfig?.mcp) return;
      const mcp = { ...state.openCodeConfig.mcp };
      delete mcp[name];
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        mcp,
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      void persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const updateProvider = useCallback(
    (name: string, provider: Provider) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        provider: { ...state.openCodeConfig.provider, [name]: provider },
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      void persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const deleteProvider = useCallback(
    (name: string) => {
      if (!state.openCodeConfig?.provider) return;
      const provider = { ...state.openCodeConfig.provider };
      delete provider[name];
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        provider,
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      void persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  const batchReplaceModel = useCallback(
    (fromModel: string, toModel: string, toVariant?: string) => {
      if (!state.ohMyOpenCodeConfig) return;
      const updated: OhMyOpenCodeConfig = {
        ...state.ohMyOpenCodeConfig,
        agents: { ...state.ohMyOpenCodeConfig.agents },
        categories: { ...state.ohMyOpenCodeConfig.categories },
      };
      if (updated.agents) {
        for (const [agentName, agent] of Object.entries(updated.agents)) {
          if (agent.model === fromModel) {
            updated.agents[agentName] = { model: toModel, variant: toVariant };
          }
        }
      }
      if (updated.categories) {
        for (const [catName, cat] of Object.entries(updated.categories)) {
          if (cat.model === fromModel) {
            updated.categories[catName] = {
              model: toModel,
              variant: toVariant,
            };
          }
        }
      }
      dispatch({ type: "SET_OH_MY", config: updated });
      void persistOhMy(updated);
    },
    [state.ohMyOpenCodeConfig],
  );

  const updatePluginVersion = useCallback(
    (pluginName: string, newVersion: string) => {
      if (!state.openCodeConfig) return;
      const updated: OpenCodeConfig = {
        ...state.openCodeConfig,
        plugin: state.openCodeConfig.plugin?.map((p) => {
          if (typeof p === "string" && p.startsWith(pluginName + "@")) {
            return `${pluginName}@${newVersion}`;
          }
          return p;
        }),
      };
      dispatch({ type: "SET_OPENCODE", config: updated });
      void persistOpenCode(updated);
    },
    [state.openCodeConfig],
  );

  return (
    <ConfigContext.Provider
      value={{
        ...state,
        reload,
        setActiveFile,
        refreshExternalModels,
        updateAgent,
        updateCategory,
        updateMcpServer,
        deleteMcpServer,
        updateProvider,
        deleteProvider,
        batchReplaceModel,
        updatePluginVersion,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig 必须在 ConfigProvider 内使用");
  }
  return context;
}
