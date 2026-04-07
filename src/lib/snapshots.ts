import { invoke } from "@tauri-apps/api/core";

export interface SnapshotInfo {
  name: string;
  timestamp: number;
}

export async function listSnapshots(): Promise<SnapshotInfo[]> {
  return invoke<SnapshotInfo[]>("list_snapshots");
}

export async function saveSnapshot(name: string): Promise<void> {
  return invoke("save_snapshot", { name });
}

export async function restoreSnapshot(name: string): Promise<void> {
  return invoke("restore_snapshot", { name });
}

export async function deleteSnapshot(name: string): Promise<void> {
  return invoke("delete_snapshot", { name });
}

export async function renameSnapshot(from: string, to: string): Promise<void> {
  return invoke("rename_snapshot", { from, to });
}

export async function exportSnapshot(name: string): Promise<string> {
  return invoke<string>("export_snapshot", { name });
}

export function generateSnapshotName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}
