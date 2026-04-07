import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface JsonPreviewProps {
  value: unknown;
  onSave?: (newValue: string) => void;
  readOnly?: boolean;
}

export function JsonPreview({ value, onSave, readOnly = false }: JsonPreviewProps) {
  const formatted = JSON.stringify(value, null, 2);
  const { t } = useTranslation("common");

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatted);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditValue(formatted);
    setError(null);
    setEditing(true);
  };

  const handleSave = () => {
    try {
      JSON.parse(editValue);
      setError(null);
      onSave?.(editValue);
      setEditing(false);
    } catch (e) {
      setError(
        t("jsonPreview.jsonError", {
          message: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  };

  if (!editing) {
    return (
      <div className="relative">
        <pre className="rounded-md border bg-muted p-4 text-sm overflow-auto max-h-[400px]">
          <code>{formatted}</code>
        </pre>
        {!readOnly && (
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleEdit}
          >
            {t("jsonPreview.edit")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="font-mono text-sm min-h-[300px]"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          {t("actions.save")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
          {t("actions.cancel")}
        </Button>
      </div>
    </div>
  );
}
