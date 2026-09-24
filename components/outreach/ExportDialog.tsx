"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { buildTrackerWorkbook, DEFAULT_EXPORT_COLUMNS, downloadWorkbook, EXPORT_COLUMNS } from "@/lib/exporter";
import { applyFilters, describeFilters } from "@/lib/workspace/filters";
import { groupCompanies } from "@/lib/workspace/insights";
import { todayISO } from "@/lib/workspace/dates";
import { FilterBar } from "@/components/people/FilterBar";
import { Button, Checkbox, Dialog, Field, Input, cx } from "@/components/ui";
import { useUI, useWorkspace } from "@/components/workspace/store";

export function ExportDialog() {
  const { people, settings } = useWorkspace();
  const { exportRequest, openExport, toast } = useUI();
  const [columns, setColumns] = useState<string[]>(DEFAULT_EXPORT_COLUMNS);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [fileName, setFileName] = useState(`NetLens outreach ${todayISO()}`);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState(exportRequest?.filters ?? {});
  const [request, setRequest] = useState(exportRequest);

  // Re-seed local state when a new export is requested.
  if (exportRequest !== request) {
    setRequest(exportRequest);
    setFilters(exportRequest?.filters ?? {});
  }

  const companies = useMemo(() => groupCompanies(people, settings).map((c) => ({ key: c.key, name: c.name, count: c.count })), [people, settings]);
  const rows = useMemo(() => {
    if (!exportRequest) return [];
    if (exportRequest.ids?.length) {
      const ids = new Set(exportRequest.ids);
      return people.filter((p) => ids.has(p.id));
    }
    return applyFilters(people, filters, settings);
  }, [exportRequest, people, filters, settings]);

  if (!exportRequest) return null;
  const isSelection = !!exportRequest.ids?.length;

  const run = async () => {
    setBusy(true);
    try {
      const buffer = await buildTrackerWorkbook(rows, settings, {
        columns,
        includeSummary,
        title: exportRequest.title ?? "NetLens outreach list",
      });
      await downloadWorkbook(buffer, fileName);
      toast(`Exported ${rows.length.toLocaleString()} people.`);
      openExport(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={() => openExport(null)}
      title="Export to Excel"
      subtitle="A working outreach tracker: frozen header, filters, date formats and dropdowns for status, priority, channel and opportunity type."
      width={860}
      footer={
        <>
          <Button onClick={() => openExport(null)}>Cancel</Button>
          <Button variant="primary" icon={Download} disabled={busy || rows.length === 0} onClick={run}>
            {busy ? "Building…" : `Export ${rows.length.toLocaleString()} people`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">Who to export</p>
          {isSelection ? (
            <p className="rounded-lg border border-line bg-subtle px-3 py-2 text-[12.5px]">
              {exportRequest.ids!.length.toLocaleString()} people you selected.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                people={people}
                settings={settings}
                companies={companies}
                placeholder="Narrow the export — e.g. “consulting managers not contacted”"
              />
              <p className="px-4 py-2 text-[12.5px] text-muted">
                {rows.length.toLocaleString()} people
                {describeFilters(filters, settings).length ? "" : " (everyone — add filters to narrow it down)"}
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Columns</p>
            <div className="flex gap-2">
              <button type="button" className="text-[11.5px] text-muted hover:text-ink" onClick={() => setColumns(EXPORT_COLUMNS.map((c) => c.key))}>Select all</button>
              <button type="button" className="text-[11.5px] text-muted hover:text-ink" onClick={() => setColumns(DEFAULT_EXPORT_COLUMNS)}>Reset</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-line p-3 sm:grid-cols-3">
            {EXPORT_COLUMNS.map((c) => (
              <Checkbox
                key={c.key}
                checked={columns.includes(c.key)}
                onChange={(v) => setColumns((prev) => (v ? [...EXPORT_COLUMNS.filter((x) => prev.includes(x.key) || x.key === c.key).map((x) => x.key)] : prev.filter((k) => k !== c.key)))}
                label={<span className={cx(columns.includes(c.key) ? "text-ink" : "text-muted")}>{c.label}</span>}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Field label="File name" className="min-w-[260px] flex-1">
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </Field>
          <div className="pb-1.5">
            <Checkbox checked={includeSummary} onChange={setIncludeSummary} label="Include a summary sheet" />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
