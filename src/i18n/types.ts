import "react-i18next";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof import("./locales/zh-CN/common.json");
      agents: typeof import("./locales/zh-CN/agents.json");
      mcp: typeof import("./locales/zh-CN/mcp.json");
      providers: typeof import("./locales/zh-CN/providers.json");
      snapshot: typeof import("./locales/zh-CN/snapshot.json");
    };
  }
}
