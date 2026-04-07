import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useConfig } from "@/context/ConfigContext";
import { getOhMyOpenCodeVersion } from "@/lib/config";

export function TopBar() {
  const {
    openCodeConfig,
    updatePluginVersion,
    externalModels,
    authConfig,
    refreshExternalModels,
  } = useConfig();
  const { t } = useTranslation("common");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    void getVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion(null));
  }, []);

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

  return (
    <div className="flex items-center justify-between border-b px-4 py-2 bg-background">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold">{t("app.name")}</h1>
        {appVersion && (
          <Badge variant="secondary" title={t("app.appVersionTitle")}>
            v{appVersion}
          </Badge>
        )}
        {currentVersion && (
          <Badge variant="secondary" title={t("app.pluginVersionTitle")}>
            oh-my-openagent v{currentVersion}
          </Badge>
        )}
        {hasUpdate && (
          <Badge
            variant="outline"
            className="cursor-pointer text-orange-600 border-orange-300"
            onClick={() =>
              updatePluginVersion("oh-my-openagent", latestVersion!)
            }
          >
            {t("app.updateAvailable", { version: latestVersion })}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {authConfig && Object.keys(authConfig).length > 0 && (
          <Badge
            variant="secondary"
            className="cursor-pointer text-xs"
            title={t("app.connectedProviders", {
              names: Object.keys(authConfig).join(", "),
            })}
            onClick={() => void refreshExternalModels()}
          >
            {externalModels.length > 0
              ? t("app.externalModelsLoaded", { count: externalModels.length })
              : t("app.externalModelsLoading")}
          </Badge>
        )}
        <LanguageSwitcher />
        <Button
          variant="outline"
          size="sm"
          onClick={checkUpdate}
          disabled={checking}
        >
          {checking ? t("app.checking") : t("app.checkUpdate")}
        </Button>
      </div>
    </div>
  );
}
