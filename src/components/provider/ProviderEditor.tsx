import { useState } from "react";
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
import type { Provider, ProviderModel } from "@/types/config";

interface ProviderEditorProps {
  name: string;
  provider: Provider;
}

export function ProviderEditor({ name, provider }: ProviderEditorProps) {
  const { updateProvider } = useConfig();
  const [draft, setDraft] = useState<Provider>({ ...provider });
  const [showKey, setShowKey] = useState(false);

  const save = (updated: Provider) => {
    setDraft(updated);
    updateProvider(name, updated);
  };

  const updateModel = (index: number, field: keyof ProviderModel, value: string) => {
    const models = [...draft.models];
    models[index] = { ...models[index], [field]: value };
    save({ ...draft, models });
  };

  const addModel = () => {
    save({ ...draft, models: [...draft.models, { name: "" }] });
  };

  const removeModel = (index: number) => {
    const models = draft.models.filter((_, i) => i !== index);
    save({ ...draft, models });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>名称</Label>
          <Input
            value={draft.name}
            onChange={(e) => save({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>NPM 包</Label>
          <Input
            value={draft.npm ?? ""}
            onChange={(e) => save({ ...draft, npm: e.target.value })}
            placeholder="例如: @openai/provider"
          />
        </div>
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={draft.baseURL ?? ""}
            onChange={(e) => save({ ...draft, baseURL: e.target.value })}
            placeholder="https://api.example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="api-key-input">API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key-input"
              type={showKey ? "text" : "password"}
              aria-label="API Key"
              value={draft.apiKey ?? ""}
              onChange={(e) => save({ ...draft, apiKey: e.target.value })}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "隐藏" : "显示"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>模型列表</Label>
          <Button variant="outline" size="sm" onClick={addModel}>
            + 添加模型
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模型名称</TableHead>
              <TableHead>显示名称</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {draft.models.map((model, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Input
                    value={model.name}
                    onChange={(e) => updateModel(i, "name", e.target.value)}
                    placeholder="gpt-5.4"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={model.displayName ?? ""}
                    onChange={(e) =>
                      updateModel(i, "displayName", e.target.value)
                    }
                    placeholder="GPT 5.4"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeModel(i)}
                  >
                    ×
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
