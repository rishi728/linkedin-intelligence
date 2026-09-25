"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { addDays, todayISO } from "@/lib/workspace/dates";
import { autoBackupSupported, backupFileName, downloadBackup } from "@/lib/workspace/autobackup";
import { useWorkspace } from "@/components/workspace/store";

/**
 * Saved-in-this-browser is not the same as safe. This is the one place the app
 * says so without being asked: a quiet line in the sidebar, only when there is no
 * backup file being written and the last manual copy is old or missing.
 */
export function BackupNudge() {
  const { people, settings, updateSettings, exportBackup } = useWorkspace();
  const [file, setFile] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void backupFileName().then((name) => {
      setFile(name);
      setChecked(true);
    });
  }, []);

  const last = settings.lastBackupAt?.slice(0, 10) ?? "";
  const stale = last < addDays(todayISO(), -14);
  if (!checked || file || !stale || !people.length) return null;

  return (
    <button
      type="button"
      onClick={() => {
        downloadBackup(exportBackup());
        updateSettings((s) => ({ ...s, lastBackupAt: new Date().toISOString() }));
      }}
      title={
        autoBackupSupported()
          ? "Settings can also keep a file on your drive up to date for you."
          : "Keep this file somewhere you back up."
      }
      className="flex w-full items-start gap-1.5 rounded-lg px-2 py-1 text-left text-[11px] text-[var(--t-amber)] transition hover:bg-hover"
    >
      <ShieldAlert size={11} className="mt-[3px] shrink-0" />
      <span>{last ? "No backup in two weeks." : "No backup yet."} Save a copy</span>
    </button>
  );
}
