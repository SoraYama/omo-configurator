import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { McpEditor } from "@/components/mcp/McpEditor";
import { useConfig } from "@/context/ConfigContext";
import type { McpServer } from "@/types/config";

export function McpList() {
  const { openCodeConfig, updateMcpServer, deleteMcpServer } = useConfig();
  const { t } = useTranslation(["mcp", "common"]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const mcpServers = openCodeConfig?.mcp ?? {};

  const handleSave = (name: string, server: McpServer) => {
    updateMcpServer(name, server);
    setExpanded(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMcpServer(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleAdd = (type: "remote" | "local") => {
    const name = newName.trim() || `mcp-${Date.now()}`;
    const server: McpServer =
      type === "remote"
        ? { type: "remote", url: "", enabled: true }
        : { type: "local", command: [], enabled: true };
    updateMcpServer(name, server);
    setAdding(false);
    setNewName("");
    setExpanded(name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <Button size="sm" onClick={() => setAdding(true)}>
          {t("addButton")}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder={t("addForm.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAdd("remote")}>
                {t("addForm.remoteServer")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd("local")}
              >
                {t("addForm.localServer")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                {t("common:actions.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {Object.entries(mcpServers).map(([name, server]) => (
        <Card key={name}>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => setExpanded(expanded === name ? null : name)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono">{name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{server.type}</Badge>
                <Badge
                  variant={
                    server.enabled !== false ? "default" : "secondary"
                  }
                >
                  {server.enabled !== false
                    ? t("status.enabled")
                    : t("status.disabled")}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(name);
                  }}
                >
                  {t("dialogs.delete.confirmText")}
                </Button>
              </div>
            </div>
          </CardHeader>
          {expanded === name && (
            <CardContent>
              <McpEditor name={name} server={server} onSave={handleSave} />
            </CardContent>
          )}
        </Card>
      ))}

      {Object.keys(mcpServers).length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {t("empty")}
        </p>
      )}

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
