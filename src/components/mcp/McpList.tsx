import { useState } from "react";
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
        <h3 className="text-sm font-medium">MCP 服务器</h3>
        <Button size="sm" onClick={() => setAdding(true)}>
          + 添加 MCP
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="服务器名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAdd("remote")}>
                远程服务器
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd("local")}
              >
                本地服务器
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
              >
                取消
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
                  {server.enabled !== false ? "启用" : "禁用"}
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
                  删除
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
          暂无 MCP 服务器配置
        </p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除 MCP 服务器"
        description={`确定要删除 "${deleteTarget}" 吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
