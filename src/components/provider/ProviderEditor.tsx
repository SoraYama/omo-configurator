import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConfig } from "@/context/ConfigContext";
import type { Provider, ProviderModelEntry } from "@/types/config";

interface ProviderEditorProps {
  name: string;
  provider: Provider;
}

export function ProviderEditor({ name, provider }: ProviderEditorProps) {
  const { updateProvider } = useConfig();
  const { t } = useTranslation("providers");
  const [draft, setDraft] = useState<Provider>({ ...provider });
  const [showKey, setShowKey] = useState(false);

  const save = (updated: Provider) => {
    setDraft(updated);
    updateProvider(name, updated);
  };

  const models = Object.entries(draft.models ?? {});

  const updateModelId = (oldId: string, newId: string) => {
    const updated: Record<string, ProviderModelEntry> = {};
    for (const [id, entry] of Object.entries(draft.models ?? {})) {
      updated[id === oldId ? newId : id] = entry;
    }
    save({ ...draft, models: updated });
  };

  const updateModelName = (id: string, displayName: string) => {
    save({
      ...draft,
      models: { ...draft.models, [id]: { name: displayName } },
    });
  };

  const addModel = () => {
    const newId = `new-model-${Date.now()}`;
    save({
      ...draft,
      models: { ...draft.models, [newId]: { name: "" } },
    });
  };

  const removeModel = (id: string) => {
    const updated = { ...draft.models };
    delete updated[id];
    save({ ...draft, models: updated });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>{t("editor.nameLabel")}</Label>
          <Input
            value={draft.name ?? ""}
            onChange={(e) => save({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("editor.npmLabel")}</Label>
          <Input
            value={draft.npm ?? ""}
            onChange={(e) => save({ ...draft, npm: e.target.value })}
            placeholder={t("editor.npmPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={draft.options?.baseURL ?? ""}
            onChange={(e) =>
              save({
                ...draft,
                options: { ...draft.options, baseURL: e.target.value },
              })
            }
            placeholder="https://api.example.com/v1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key-input">{t("editor.apiKeyLabel")}</Label>
          <div className="flex gap-2">
            <Input
              id="api-key-input"
              type={showKey ? "text" : "password"}
              aria-label="API Key"
              value={draft.options?.apiKey ?? ""}
              onChange={(e) =>
                save({
                  ...draft,
                  options: { ...draft.options, apiKey: e.target.value },
                })
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? t("editor.hideKey") : t("editor.showKey")}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("editor.modelsLabel")}</Label>
          <Button variant="outline" size="sm" onClick={addModel}>
            {t("editor.addModel")}
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("editor.modelIdHeader")}</TableHead>
              <TableHead>{t("editor.displayNameHeader")}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map(([id, entry]) => (
              <TableRow key={id}>
                <TableCell>
                  <Input
                    value={id}
                    onChange={(e) => updateModelId(id, e.target.value)}
                    placeholder="model-id"
                    className="font-mono text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={entry.name}
                    onChange={(e) => updateModelName(id, e.target.value)}
                    placeholder="Model Display Name"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeModel(id)}
                  >
                    ×
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {models.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground text-sm py-4"
                >
                  {t("editor.emptyModels")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
