// Shapes shared across the intelligence layer.
//
// Nothing here is OpenRouter-specific. The provider is one module; everything
// else talks in these terms, so swapping the model or the provider touches one
// file rather than the whole app.

import type { SectorId } from "../knowledge/sectors";

export const MAX_OPENROUTER_REQUESTS_PER_RUN = 9;
export const MAX_CLASSIFICATION_REQUESTS = 7;

/** What we send about one person. Deliberately the smallest thing that can classify them. */
export interface CompactProfile {
  /** The fingerprint, not the person: one entry stands for everyone who matches it. */
  id: string;
  title: string;
  /** Index into the batch's company table, so an employer is spelled once per batch. */
  c?: number;
}

export interface EvidenceItem {
  field: "title" | "company";
  text: string;
  supports: "role" | "sector";
}

/** One classification as the model returns it, before validation. */
export interface RawClassification {
  id: string;
  role_bucket?: string;
  role_section?: string;
  detailed_role?: string;
  sector?: string;
  role_confidence?: number;
  sector_confidence?: number;
  evidence?: EvidenceItem[];
}

/** One classification after it has been checked against the repository. */
export interface AiClassification {
  fingerprint: string;
  bucket: string;
  section: string;
  roleId: string;
  sector: SectorId | null;
  roleConfidence: number;
  sectorConfidence: number;
  evidence: EvidenceItem[];
}

export interface Correction {
  id: string;
  field: "role_bucket" | "role_section" | "detailed_role" | "sector";
  from: string;
  to: string;
  reason: string;
  confidence: number;
}

export interface NetworkInsight {
  /** A short heading, e.g. "Strong product and technology cluster". */
  headline: string;
  detail: string;
  /** Optional filter the insight opens, validated before it is stored. */
  bucket?: string;
  sector?: string;
}

export interface NetworkIntelligence {
  insights: NetworkInsight[];
  /** Areas the user said they want that their network is thin on. */
  gaps: string[];
}

export type RunMode = "full" | "incremental" | "single";

/** Everything worth knowing about one run, shown in the UI and kept for the next one. */
export interface RunStats {
  runId: string;
  mode: RunMode;
  startedAt: string;
  completedAt: string;
  connectionsTotal: number;
  deterministicClassifications: number;
  aiClassifications: number;
  unresolvedCount: number;
  requestsUsed: number;
  requestsFailed: number;
  cacheHits: number;
  batchCount: number;
  averageConfidence: number;
  lowConfidenceCount: number;
  /** Set when the run stopped early, in the user's words. */
  stoppedBecause?: string;
}

export interface AiSettings {
  enabled: boolean;
  /** Stored in this browser only, like everything else here. */
  apiKey: string;
  model: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  apiKey: "",
  model: "anthropic/claude-3.5-haiku",
};
