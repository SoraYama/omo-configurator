import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  listSnapshots,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  exportSnapshot,
  generateSnapshotName,
  type SnapshotInfo,
} from "@/lib/snapshots";
import { useConfig } from "@/context/ConfigContext";

export function Sidebar() {
  const { reload } = useConfig();
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

  const refreshSnapshots = async () => {
    const list = await listSnapshots();
    setSnapshots(list);
  };

  useEffect(() => {
    void refreshSnapshots();
  }, []);

  const handleSave = async () => {
    const name = generateSnapshotName();
    await saveSnapshot(name);
    await refreshSnapshots();
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await restoreSnapshot(restoreTarget);
    setRestoreTarget(null);
    await reload();
  };

  const handleDelete = async (name: string) => {
    await deleteSnapshot(name);
    await refreshSnapshots();
  };

  const handleExport = async (name: string) => {
    const data = await exportSnapshot(name);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-56 border-r flex flex-col bg-muted/30">
      <div className="p-3 font-medium text-sm text-muted-foreground">
        快照管理
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {snapshots.map((snap) => (
            <div
              key={snap.name}
              className="group rounded-md p-2 text-sm hover:bg-accent cursor-pointer"
            >
              <div
                className="font-mono text-xs"
                onClick={() => setRestoreTarget(snap.name)}
              >
                {snap.name}
              </div>
              <div className="hidden group-hover:flex gap-1 mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleExport(snap.name)}
                >
                  导出
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={() => handleDelete(snap.name)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
          {snapshots.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">暂无快照</p>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Button className="w-full" size="sm" onClick={handleSave}>
          + 保存快照
        </Button>
      </div>

      <ConfirmDialog
        open={restoreTarget !== null}
        title="恢复快照"
        description={`确定要恢复快照 "${restoreTarget}" 吗？当前配置将被覆盖。`}
        confirmText="恢复"
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
