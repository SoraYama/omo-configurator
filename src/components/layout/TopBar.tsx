import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useConfig } from "@/context/ConfigContext";
import { getOhMyOpenCodeVersion } from "@/lib/config";
import type { ConfigFileType } from "@/types/config";

export function TopBar() {
  const {
    openCodeConfig,
    activeFile,
    setActiveFile,
    updatePluginVersion,
    externalModels,
    authConfig,
    refreshExternalModels,
  } = useConfig();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const currentVersion = openCodeConfig
    ? getOhMyOpenCodeVersion(openCodeConfig)
    : undefined;

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const res = await fetch(
        "https://registry.npmjs.org/oh-my-openagent/latest",
      );
      const data = (await res.json()) as { version: string };
      setLatestVersion(data.version);
    } catch {
      setLatestVersion(null);
    } finally {
      setChecking(false);
    }
  };

  const hasUpdate =
    latestVersion && currentVersion && latestVersion !== currentVersion;

  const fileOptions: { label: string; value: ConfigFileType }[] = [
    { label: "oh-my-opencode.json", value: "oh-my-opencode" },
    { label: "opencode.json", value: "opencode" },
  ];

  return (
    <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">OpenCode Configurator</h1>
        {currentVersion && (
          <Badge variant="secondary">v{currentVersion}</Badge>
        )}
        {hasUpdate && (
          <Badge
            variant="outline"
            className="cursor-pointer text-orange-600 border-orange-300"
            onClick={() =>
              updatePluginVersion("oh-my-openagent", latestVersion!)
            }
          >
            → v{latestVersion} 可更新，点击升级
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* 已连接的外部 provider 及模型数量指示 */}
        {authConfig && Object.keys(authConfig).length > 0 && (
          <Badge
            variant="secondary"
            className="cursor-pointer text-xs"
            title={`已连接: ${Object.keys(authConfig).join(", ")}`}
            onClick={() => void refreshExternalModels()}
          >
            {externalModels.length > 0
              ? `${externalModels.length} 个外部模型`
              : "加载外部模型..."}
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={checkUpdate}
          disabled={checking}
        >
          {checking ? "检查中..." : "检查更新"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {fileOptions.find((f) => f.value === activeFile)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {fileOptions.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => setActiveFile(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
