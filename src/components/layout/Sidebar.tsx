import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  listSnapshots,
  saveSnapshot,
  restoreSnapshot,
  deleteSnapshot,
  renameSnapshot,
  exportSnapshot,
  generateSnapshotName,
  type SnapshotInfo,
} from "@/lib/snapshots";
import { useConfig } from "@/context/ConfigContext";

export function Sidebar() {
  const { reload } = useConfig();
  const { t } = useTranslation(["common", "snapshot"]);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

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

  const openRename = (name: string) => {
    setRenameTarget(name);
    setRenameValue(name);
  };

  const handleRenameConfirm = async () => {
    if (!renameTarget) return;
    const next = renameValue.trim();
    if (!next) return;
    try {
      await renameSnapshot(renameTarget, next);
      setRenameTarget(null);
      await refreshSnapshots();
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : String(err);
      window.alert(msg);
    }
  };

  return (
    <div className="w-56 border-r flex flex-col bg-muted/30">
      <div className="p-3 font-medium text-sm text-muted-foreground">
        {t("snapshot:title")}
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
              <div className="hidden group-hover:flex gap-1 mt-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => openRename(snap.name)}
                >
                  {t("snapshot:actions.rename")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => handleExport(snap.name)}
                >
                  {t("snapshot:actions.export")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive"
                  onClick={() => handleDelete(snap.name)}
                >
                  {t("snapshot:actions.delete")}
                </Button>
              </div>
            </div>
          ))}
          {snapshots.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">
              {t("snapshot:empty")}
            </p>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <Button className="w-full" size="sm" onClick={handleSave}>
          {t("snapshot:saveButton")}
        </Button>
      </div>

      <ConfirmDialog
        open={restoreTarget !== null}
        title={t("snapshot:dialogs.restore.title")}
        description={t("snapshot:dialogs.restore.description", {
          name: restoreTarget,
        })}
        confirmText={t("snapshot:actions.restore")}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
        variant="destructive"
      />

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{t("snapshot:dialogs.rename.title")}</DialogTitle>
            <DialogDescription>
              {t("snapshot:dialogs.rename.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="snapshot-rename">
              {t("snapshot:dialogs.rename.label")}
            </Label>
            <Input
              id="snapshot-rename"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleRenameConfirm();
              }}
              className="font-mono text-xs"
              autoFocus
            />
          </div>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameTarget(null)}
            >
              {t("common:actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleRenameConfirm()}
              disabled={!renameValue.trim()}
            >
              {t("common:actions.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
