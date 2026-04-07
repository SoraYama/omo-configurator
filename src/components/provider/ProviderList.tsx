import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProviderEditor } from "@/components/provider/ProviderEditor";
import { useConfig } from "@/context/ConfigContext";
import type { Provider } from "@/types/config";

export function ProviderList() {
  const { openCodeConfig, updateProvider, deleteProvider } = useConfig();
  const { t } = useTranslation("providers");
  const [selected, setSelected] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const providers = openCodeConfig?.provider ?? {};
  const providerNames = Object.keys(providers);

  const handleAdd = () => {
    const name = `provider-${Date.now()}`;
    const newProvider: Provider = { name, models: {} };
    updateProvider(name, newProvider);
    setSelected(name);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteProvider(deleteTarget);
      if (selected === deleteTarget) setSelected(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-48 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Providers</h3>
          <Button variant="outline" size="sm" onClick={handleAdd}>
            +
          </Button>
        </div>
        <ScrollArea className="flex-1 border rounded-md">
          <div className="p-1">
            {providerNames.map((name) => (
              <div key={name} className="flex items-center group">
                <button
                  className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selected === name
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelected(name)}
                >
                  {name}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 text-destructive h-6"
                  onClick={() => setDeleteTarget(name)}
                >
                  ×
                </Button>
              </div>
            ))}
            {providerNames.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">{t("empty")}</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator orientation="vertical" />

      <div className="flex-1 overflow-auto">
        {selected && providers[selected] ? (
          <ProviderEditor name={selected} provider={providers[selected]} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t("selectHint")}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("dialogs.delete.title")}
        description={t("dialogs.delete.description", { name: deleteTarget })}
        confirmText={t("dialogs.delete.confirmText")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
