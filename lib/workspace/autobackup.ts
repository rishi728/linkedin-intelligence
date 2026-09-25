// Keeping a copy outside the browser.
//
// Everything a user does lives in IndexedDB, which is fast, private and needs no
// account, but it is still one browser profile. Clearing site data, switching
// laptop or a reinstall takes a month of work with it, and there is no server to
// recover it from. Where the browser allows it, the app can therefore keep a real
// file on disk up to date by itself.
//
// Chromium browsers support the File System Access API. Everywhere else this
// module reports unsupported and the app falls back to reminding the user to
// download a backup by hand.

import { dbGet, dbSet, dbDelete } from "./db";

const HANDLE_KEY = "backupFileHandle";

/** Minimal shape of the bits of FileSystemFileHandle we rely on. */
interface BackupHandle {
  name: string;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission(opts: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission(opts: { mode: "readwrite" }): Promise<PermissionState>;
}

type PickerWindow = Window & {
  showSaveFilePicker?: (opts: unknown) => Promise<BackupHandle>;
};

export function autoBackupSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as PickerWindow).showSaveFilePicker === "function";
}

/** Asks once for a file to keep updated. Returns its name, or null if cancelled. */
export async function chooseBackupFile(): Promise<string | null> {
  const picker = (window as PickerWindow).showSaveFilePicker;
  if (!picker) return null;
  try {
    const handle = await picker({
      suggestedName: "linkedin-intelligence-backup.json",
      types: [{ description: "Workspace backup", accept: { "application/json": [".json"] } }],
    });
    await dbSet(HANDLE_KEY, handle);
    return handle.name;
  } catch {
    return null; // the user closed the dialog
  }
}

export async function backupFileName(): Promise<string | null> {
  const handle = await dbGet<BackupHandle>(HANDLE_KEY);
  return handle?.name ?? null;
}

export async function forgetBackupFile(): Promise<void> {
  await dbDelete(HANDLE_KEY);
}

/**
 * Writes the backup to the chosen file. Permission can lapse between sessions, so
 * it is re-checked every time; `silent` avoids prompting in the background, which
 * browsers reject outside a user gesture anyway.
 */
export async function writeBackup(json: string, opts: { silent?: boolean } = {}): Promise<boolean> {
  try {
    const handle = await dbGet<BackupHandle>(HANDLE_KEY);
    if (!handle) return false;

    let state = await handle.queryPermission({ mode: "readwrite" });
    if (state !== "granted") {
      if (opts.silent) return false;
      state = await handle.requestPermission({ mode: "readwrite" });
    }
    if (state !== "granted") return false;

    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

/** Manual fallback, used where the browser cannot write a file on its own. */
export function downloadBackup(json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `netlens-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
