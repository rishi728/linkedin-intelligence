"use client";

import { useRef, useState } from "react";
import { FolderUp, MessagesSquare } from "lucide-react";
import { Button, Card, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

/**
 * Pulls the rest of the LinkedIn export (messages, invitations, education…) into
 * the workspace. Only dates, directions and counts are kept, never message text.
 */
export function ArchiveImport({ compact = false }: { compact?: boolean }) {
  const { archive, importArchive, people } = useWorkspace();
  const { toast } = useUI();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const withHistory = people.filter((p) => p.history?.messageCount).length;
  const replied = people.filter((p) => p.history?.theyReplied).length;

  const handle = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    try {
      const files = await Promise.all([...list].map(async (f) => ({ name: f.name, text: await f.text() })));
      const summary = importArchive(files);
      toast(
        summary.matched
          ? `Found ${summary.description}. ${summary.applied} connections updated${summary.skipped ? `, ${summary.skipped} left as you set them` : ""}.`
          : `Read ${summary.description}, but none of it matched your connections.`,
      );
    } catch {
      toast("Could not read those files. Pick the CSV files from your LinkedIn export folder.");
    } finally {
      setBusy(false);
    }
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept=".csv,text/csv"
      multiple
      className="hidden"
      onChange={(e) => {
        void handle(e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (compact) {
    return (
      <>
        {picker}
        <Button icon={FolderUp} disabled={busy} onClick={() => input.current?.click()}>
          {busy ? "Reading…" : archive ? "Update from archive" : "Add archive files"}
        </Button>
      </>
    );
  }

  return (
    <Card className={cx("p-4", !archive && "border-accent/40 bg-accent-soft/30")}>
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg tone-teal">
          <MessagesSquare size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">
            {archive ? "Conversation history is loaded" : "Add the rest of your LinkedIn export"}
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            {archive
              ? `${withHistory.toLocaleString()} connections have message history · ${replied.toLocaleString()} have replied to you. Import again after a fresh export to update.`
              : "Your export folder also holds messages.csv, Invitations.csv, Education.csv, Positions.csv and Profile.csv. Select them and it will fill in who you've already spoken to, who replied, who invited whom, and your own schools."}
          </p>
          <p className="mt-1.5 text-[11.5px] text-muted">
            Your conversations are kept so you can read them back on a person’s profile. Nothing leaves this browser.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {picker}
            <Button variant={archive ? "secondary" : "primary"} icon={FolderUp} disabled={busy} onClick={() => input.current?.click()}>
              {busy ? "Reading…" : archive ? "Import again" : "Choose archive files"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
