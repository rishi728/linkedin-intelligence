// Nothing the model says is trusted until the repository agrees it exists.
//
// A returned bucket, section, role or sector that is not in the repository is
// dropped, not stored and not repaired into something plausible. Evidence that
// does not appear in the source data is dropped too. The result is that the
// model can only ever choose among answers the product already understands.

import { ROLE_BUCKETS, ROLE_PATH } from "../knowledge/roles";
import { SECTOR_IDS, SECTOR_LABEL, type SectorId } from "../knowledge/sectors";
import type { AiClassification, Correction, EvidenceItem, NetworkInsight, RawClassification } from "./types";

const byLabel = <T extends { id: string; label: string }>(items: T[]) => {
  const m = new Map<string, T>();
  for (const x of items) {
    m.set(x.id.toLowerCase(), x);
    m.set(x.label.toLowerCase(), x);
  }
  return m;
};

const BUCKETS = byLabel(ROLE_BUCKETS);
const SECTORS = byLabel(SECTOR_IDS.map((id) => ({ id, label: SECTOR_LABEL[id] })));

const norm = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

export function resolveBucket(value: unknown): string | null {
  return BUCKETS.get(norm(value))?.id ?? null;
}

export function resolveSector(value: unknown): SectorId | null {
  return (SECTORS.get(norm(value))?.id as SectorId | undefined) ?? null;
}

/** Confidence is a probability or it is nothing. Never rounded up to certainty. */
function confidence(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(0.99, Math.max(0.01, n));
}

/** Evidence has to quote the data we actually sent, or it does not survive. */
function cleanEvidence(items: unknown, source: { title: string; company: string }): EvidenceItem[] {
  if (!Array.isArray(items)) return [];
  const out: EvidenceItem[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Partial<EvidenceItem>;
    const field = e.field === "company" ? "company" : e.field === "title" ? "title" : null;
    const supports = e.supports === "sector" ? "sector" : e.supports === "role" ? "role" : null;
    const text = typeof e.text === "string" ? e.text.trim() : "";
    if (!field || !supports || !text) continue;
    const haystack = (field === "title" ? source.title : source.company).toLowerCase();
    if (!haystack.includes(text.toLowerCase())) continue; // fabricated quote
    out.push({ field, text, supports });
    if (out.length >= 4) break;
  }
  return out;
}

export interface ValidationSource {
  title: string;
  company: string;
}

/**
 * Turns one raw response into a stored classification, or null. The whole
 * role path must line up: the section has to belong to the bucket and the role
 * to the section, exactly as the repository defines them.
 */
export function validateClassification(
  raw: RawClassification,
  source: ValidationSource,
): AiClassification | null {
  if (!raw || typeof raw.id !== "string" || !raw.id) return null;

  const bucketId = resolveBucket(raw.role_bucket);
  if (!bucketId) return null;
  const bucket = ROLE_BUCKETS.find((b) => b.id === bucketId)!;

  const sectionKey = norm(raw.role_section);
  const section =
    bucket.sections.find((s) => s.id === sectionKey || s.label.toLowerCase() === sectionKey) ?? null;
  if (!section) return null;

  const roleKey = norm(raw.detailed_role);
  const role = section.roles.find((r) => r.id === roleKey || r.label.toLowerCase() === roleKey) ?? null;
  if (!role) return null;

  return {
    fingerprint: raw.id,
    bucket: bucket.id,
    section: section.id,
    roleId: role.id,
    sector: resolveSector(raw.sector),
    roleConfidence: confidence(raw.role_confidence, 0.6),
    sectorConfidence: confidence(raw.sector_confidence, 0.5),
    evidence: cleanEvidence(raw.evidence, source),
  };
}

export function validateClassifications(
  rows: unknown,
  sources: Map<string, ValidationSource>,
): { accepted: AiClassification[]; rejected: number } {
  if (!Array.isArray(rows)) return { accepted: [], rejected: 0 };
  const accepted: AiClassification[] = [];
  let rejected = 0;
  for (const row of rows) {
    const raw = row as RawClassification;
    const source = raw && typeof raw.id === "string" ? sources.get(raw.id) : undefined;
    if (!source) {
      rejected++;
      continue;
    }
    const ok = validateClassification(raw, source);
    if (ok) accepted.push(ok);
    else rejected++;
  }
  return { accepted, rejected };
}

const CORRECTION_FIELDS = new Set(["role_bucket", "role_section", "detailed_role", "sector"]);

export function validateCorrections(rows: unknown): Correction[] {
  if (!Array.isArray(rows)) return [];
  const out: Correction[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const c = row as Partial<Correction>;
    if (typeof c.id !== "string" || !c.id) continue;
    if (!c.field || !CORRECTION_FIELDS.has(c.field)) continue;
    if (typeof c.to !== "string" || !c.to) continue;
    // The destination must be a real taxonomy value, checked the same way as a
    // fresh classification.
    if (c.field === "role_bucket" && !resolveBucket(c.to)) continue;
    if (c.field === "sector" && !resolveSector(c.to)) continue;
    out.push({
      id: c.id,
      field: c.field,
      from: typeof c.from === "string" ? c.from : "",
      to: c.to,
      reason: typeof c.reason === "string" ? c.reason.slice(0, 240) : "",
      confidence: confidence(c.confidence, 0.6),
    });
  }
  return out;
}

export function validateInsights(rows: unknown): NetworkInsight[] {
  if (!Array.isArray(rows)) return [];
  const out: NetworkInsight[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const i = row as Partial<NetworkInsight>;
    const headline = typeof i.headline === "string" ? i.headline.trim() : "";
    if (!headline) continue;
    const bucket = resolveBucket(i.bucket);
    const sector = resolveSector(i.sector);
    out.push({
      headline: headline.slice(0, 90),
      detail: typeof i.detail === "string" ? i.detail.trim().slice(0, 260) : "",
      ...(bucket ? { bucket } : {}),
      ...(sector ? { sector } : {}),
    });
    if (out.length >= 8) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The compact reply
//
// A detailed role already implies its section and its bucket, so asking for all
// three wastes output tokens and invites the model to return a path that does
// not line up. One role id per profile is both smaller and impossible to get
// internally wrong.


/** `[index, "role-id", confidence, "sector-id"?]`, as the model is asked to reply. */
export type CompactRow = [number, string, number?, string?];

export function validateCompactRow(
  row: unknown,
  sources: Array<{ fingerprint: string; title: string; company: string }>,
): AiClassification | null {
  if (!Array.isArray(row) || row.length < 2) return null;
  const [index, roleValue, conf, sectorValue] = row as CompactRow;
  if (typeof index !== "number" || !Number.isInteger(index)) return null;

  const source = sources[index];
  if (!source) return null;

  const key = typeof roleValue === "string" ? roleValue.trim().toLowerCase() : "";
  const path = ROLE_PATH.get(key) ?? [...ROLE_PATH.values()].find((p) => p.roleLabel.toLowerCase() === key);
  if (!path) return null;

  const roleConfidence = confidence(conf, 0.6);

  return {
    fingerprint: source.fingerprint,
    bucket: path.bucketId,
    section: path.sectionId,
    roleId: path.roleId,
    sector: resolveSector(sectorValue),
    roleConfidence,
    sectorConfidence: sectorValue ? Math.min(roleConfidence, 0.8) : 0,
    // Evidence is built here rather than asked for: the classification was made
    // from this title, and saying so is true without a round trip that could
    // come back quoting something nobody sent.
    evidence: [{ field: "title", text: source.title, supports: "role" }],
  };
}

export function validateCompactRows(
  rows: unknown,
  sources: Array<{ fingerprint: string; title: string; company: string }>,
): { accepted: AiClassification[]; rejected: number } {
  if (!Array.isArray(rows)) return { accepted: [], rejected: 0 };
  const accepted: AiClassification[] = [];
  let rejected = 0;
  for (const row of rows) {
    const ok = validateCompactRow(row, sources);
    if (ok) accepted.push(ok);
    else rejected++;
  }
  return { accepted, rejected };
}
