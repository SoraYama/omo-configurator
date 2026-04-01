import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { McpServer, McpServerRemote, McpServerLocal } from "@/types/config";

interface KeyValueEditorProps {
  label: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}

function KeyValueEditor({ label, value, onChange }: KeyValueEditorProps) {
  const entries = Object.entries(value);

  const updateKey = (oldKey: string, newKey: string) => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      updated[k === oldKey ? newKey : k] = v;
    }
    onChange(updated);
  };

  const updateValue = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  const addEntry = () => {
    const newKey = `key${entries.length}`;
    onChange({ ...value, [newKey]: "" });
  };

  const removeEntry = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="键"
            value={k}
            onChange={(e) => updateKey(k, e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="值"
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeEntry(k)}
            className="text-destructive"
          >
            ×
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addEntry}>
        + 添加
      </Button>
    </div>
  );
}

interface McpEditorProps {
  name: string;
  server: McpServer;
  onSave: (name: string, server: McpServer) => void;
}

export function McpEditor({ name, server, onSave }: McpEditorProps) {
  const [draft, setDraft] = useState<McpServer>({ ...server });

  if (draft.type === "remote") {
    const remote = draft as McpServerRemote;
    return (
      <div className="space-y-4 p-4 border rounded-md bg-background">
        <div className="space-y-2">
          <Label>URL</Label>
          <Input
            value={remote.url}
            onChange={(e) =>
              setDraft({ ...remote, url: e.target.value })
            }
          />
        </div>
        <KeyValueEditor
          label="Headers"
          value={remote.headers ?? {}}
          onChange={(headers) => setDraft({ ...remote, headers })}
        />
        <div className="flex items-center gap-2">
          <Switch
            checked={remote.enabled !== false}
            onCheckedChange={(enabled) =>
              setDraft({ ...remote, enabled })
            }
          />
          <Label>启用</Label>
        </div>
        <Button size="sm" onClick={() => onSave(name, draft)}>
          保存
        </Button>
      </div>
    );
  }

  const local = draft as McpServerLocal;
  return (
    <div className="space-y-4 p-4 border rounded-md bg-background">
      <div className="space-y-2">
        <Label>Command</Label>
        <Input
          value={local.command.join(" ")}
          onChange={(e) =>
            setDraft({
              ...local,
              command: e.target.value.split(" ").filter(Boolean),
            })
          }
          placeholder="例如: node server.js"
        />
        <p className="text-xs text-muted-foreground">用空格分隔命令和参数</p>
      </div>
      <KeyValueEditor
        label="环境变量"
        value={local.environment ?? {}}
        onChange={(environment) => setDraft({ ...local, environment })}
      />
      <div className="flex items-center gap-2">
        <Switch
          checked={local.enabled !== false}
          onCheckedChange={(enabled) =>
            setDraft({ ...local, enabled })
          }
        />
        <Label>启用</Label>
      </div>
      <Button size="sm" onClick={() => onSave(name, draft)}>
        保存
      </Button>
    </div>
  );
}
