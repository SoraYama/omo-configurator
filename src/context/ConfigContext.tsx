import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
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
  PluginConfigLayout,
  PluginConfigLocation,
} from "@/types/config";
import {
  applyJsoncChanges,
  buildUnifiedSeed,
  getOhMyOpenCodeVersion,
  getPluginMajor,
  isOmoPluginEntry,
  OMO_SCHEMA_URL,
  parseOpenCodeConfig,
  parseOhMyOpenCodeConfig,
  pluginEntryChanges,
  UNIFIED_CONFIG_MAJOR,
  type JsoncChange,
} from "@/lib/config";
import { fetchExternalProviderModels } from "@/lib/providers";

interface ConfigState {
  openCodeConfig: OpenCodeConfig | null;
  ohMyOpenCodeConfig: OhMyOpenCodeConfig | null;
  /** 插件实际读取的配置文件位置与布局 */
  pluginConfigLocation: PluginConfigLocation | null;
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
  | {
      type: "SET_ALL";
      openCode: OpenCodeConfig;
      ohMy: OhMyOpenCodeConfig;
      location: PluginConfigLocation;
      auth: AuthConfig;
    }
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
    case "SET_ALL":
      return {
        ...state,
        openCodeConfig: action.openCode,
        ohMyOpenCodeConfig: action.ohMy,
        pluginConfigLocation: action.location,
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
  updatePluginVersion: (newVersion: string) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

/** OpenCode 同时支持 opencode.jsonc 与 opencode.json，优先 jsonc */
async function resolveOpenCodeFilename(): Promise<string> {
  const hasJsonc = await invoke<boolean>("config_file_exists", {
    filename: "opencode.jsonc",
  });
  return hasJsonc ? "opencode.jsonc" : "opencode.json";
}

async function resolvePluginConfig(openCode: OpenCodeConfig) {
  return invoke<PluginConfigLocation>("resolve_plugin_config", {
    pluginMajor: getPluginMajor(getOhMyOpenCodeVersion(openCode)) ?? null,
  });
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(configReducer, {
    openCodeConfig: null,
    ohMyOpenCodeConfig: null,
    pluginConfigLocation: null,
    authConfig: null,
    externalModels: [],
    activeFile: "oh-my-opencode",
    loading: true,
    error: null,
  });

  // 原始文本保存在 ref 中：每次修改都基于最新文本就地编辑，保留注释与格式
  const openCodeRaw = useRef("");
  const openCodeFilename = useRef("opencode.json");
  const pluginRaw = useRef("");
  const pluginLocation = useRef<PluginConfigLocation | null>(null);

  const reload = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    try {
      const filename = await resolveOpenCodeFilename();
      const [ocRaw, authRaw] = await Promise.all([
        invoke<string>("read_config", { filename }),
        invoke<string>("read_auth"),
      ]);
      const oc = parseOpenCodeConfig(ocRaw);
      const location = await resolvePluginConfig(oc);
      const omRaw = await invoke<string>("read_plugin_config", {
        path: location.path,
      });
      const auth = JSON.parse(authRaw) as AuthConfig;
      openCodeFilename.current = filename;
      openCodeRaw.current = ocRaw;
      pluginRaw.current = omRaw;
      pluginLocation.current = location;
      dispatch({
        type: "SET_ALL",
        openCode: oc,
        ohMy: parseOhMyOpenCodeConfig(omRaw, location.layout),
        location,
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

  const editOpenCode = useCallback(async (changes: JsoncChange[]) => {
    const raw = applyJsoncChanges(openCodeRaw.current, changes);
    openCodeRaw.current = raw;
    dispatch({ type: "SET_OPENCODE", config: parseOpenCodeConfig(raw) });
    await invoke("write_config", {
      filename: openCodeFilename.current,
      content: raw,
    });
  }, []);

  const editPlugin = useCallback(
    (changesFor: (raw: string, layout: PluginConfigLayout) => JsoncChange[]) => {
      const location = pluginLocation.current;
      if (!location) return;
      let raw = pluginRaw.current;
      // 新建 unified 配置时带上 $schema，便于编辑器补全
      if (raw.trim() === "" && location.layout === "unified") {
        raw = applyJsoncChanges("{}", [{ path: ["$schema"], value: OMO_SCHEMA_URL }]);
      }
      raw = applyJsoncChanges(raw, changesFor(raw, location.layout));
      pluginRaw.current = raw;
      dispatch({
        type: "SET_OH_MY",
        config: parseOhMyOpenCodeConfig(raw, location.layout),
      });
      void invoke("write_plugin_config", { path: location.path, content: raw });
    },
    [],
  );

  const updateAgent = useCallback(
    (name: string, config: AgentConfig) => {
      editPlugin((raw, layout) =>
        pluginEntryChanges(raw, layout, "agents", name, config),
      );
    },
    [editPlugin],
  );

  const updateCategory = useCallback(
    (name: string, config: CategoryConfig) => {
      editPlugin((raw, layout) =>
        pluginEntryChanges(raw, layout, "categories", name, config),
      );
    },
    [editPlugin],
  );

  const updateMcpServer = useCallback(
    (name: string, server: McpServer) => {
      void editOpenCode([{ path: ["mcp", name], value: server }]);
    },
    [editOpenCode],
  );

  const deleteMcpServer = useCallback(
    (name: string) => {
      void editOpenCode([{ path: ["mcp", name], value: undefined }]);
    },
    [editOpenCode],
  );

  const updateProvider = useCallback(
    (name: string, provider: Provider) => {
      void editOpenCode([{ path: ["provider", name], value: provider }]);
    },
    [editOpenCode],
  );

  const deleteProvider = useCallback(
    (name: string) => {
      void editOpenCode([{ path: ["provider", name], value: undefined }]);
    },
    [editOpenCode],
  );

  const batchReplaceModel = useCallback(
    (fromModel: string, toModel: string, toVariant?: string) => {
      const view = state.ohMyOpenCodeConfig;
      if (!view) return;
      const next = { model: toModel, variant: toVariant };
      editPlugin((raw, layout) => {
        const changes: JsoncChange[] = [];
        for (const kind of ["agents", "categories"] as const) {
          for (const [name, entry] of Object.entries(view[kind] ?? {})) {
            if (entry.model === fromModel) {
              changes.push(...pluginEntryChanges(raw, layout, kind, name, next));
            }
          }
        }
        return changes;
      });
    },
    [state.ohMyOpenCodeConfig, editPlugin],
  );

  const updatePluginVersion = useCallback(
    async (newVersion: string) => {
      const oc = state.openCodeConfig;
      const legacyView = state.ohMyOpenCodeConfig;
      if (!oc?.plugin) return;
      const index = oc.plugin.findIndex(isOmoPluginEntry);
      if (index < 0) return;
      // 插件已改名为 oh-my-openagent，升级时顺带替换旧包名
      await editOpenCode([
        { path: ["plugin", index], value: `oh-my-openagent@${newVersion}` },
      ]);

      // 跨越到 unified 布局时，插件迁移会丢弃旧文件中的 agents / categories，
      // 在插件首次启动前先把它们写入 ~/.omo/omo.jsonc（迁移不会覆盖已有值）
      const crossing =
        pluginLocation.current?.layout === "legacy" &&
        (getPluginMajor(newVersion) ?? UNIFIED_CONFIG_MAJOR) >= UNIFIED_CONFIG_MAJOR;
      if (crossing && legacyView) {
        const target = await invoke<PluginConfigLocation>("resolve_plugin_config", {
          pluginMajor: getPluginMajor(newVersion) ?? null,
        });
        if (!target.exists) {
          await invoke("write_plugin_config", {
            path: target.path,
            content: buildUnifiedSeed(legacyView),
          });
        }
      }
      await reload();
    },
    [state.openCodeConfig, state.ohMyOpenCodeConfig, editOpenCode, reload],
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
