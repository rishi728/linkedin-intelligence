import type { ContactHistory } from "../archive";
import type { Basis } from "../classifier";
import type { ClassificationSource, CustomRule, Hierarchy } from "../intelligence";
import type { Seniority, TagId } from "../taxonomy";

export type Priority = "high" | "medium" | "low";
export type Tone = "gray" | "blue" | "violet" | "amber" | "orange" | "teal" | "green" | "slate" | "red";

export interface StatusDef {
  id: string;
  label: string;
  tone: Tone;
  /** Shown as a column on the Outreach board. */
  onBoard: boolean;
  /** "closed" statuses stop follow-up reminders. */
  kind: "idle" | "active" | "positive" | "closed";
  /** When moving someone into this status, suggest a follow-up this many days out (if none is set). */
  followUpDays?: number;
}

export interface Personalization {
  why: string;
  know: string;
  common: string;
  ask: string;
  personal: string;
}

/** A message you wrote here. Kept in full, because you wrote it. */
export interface SavedMessage {
  at: string;
  text: string;
  channel: string;
  /** Which preset it started from, when it started from one. */
  intent?: string;
  /** Set when you marked the person contacted off the back of it. */
  sent?: boolean;
}

export interface Activity {
  at: string;
  kind: "status" | "note" | "followup" | "contacted" | "classification" | "message" | "priority";
  text: string;
}

/** Everything the user adds to a connection. Stored locally, keyed by connection id. */
export interface PersonRecord {
  classification?: Partial<Hierarchy>;
  location?: string;
  status?: string;
  priority?: Priority;
  lastContactedAt?: string;
  followUpAt?: string;
  channel?: string;
  response?: string;
  nextAction?: string;
  opportunityType?: string;
  notes?: string;
  personalization?: Partial<Personalization>;
  draft?: string;
  /** Every message drafted for this person, oldest first. */
  messages?: SavedMessage[];
  sequenceStep?: number;
  userTags?: string[];
  activity?: Activity[];
  updatedAt?: string;
}

export type AudienceId = "peers" | "alumni" | "managers" | "directors" | "founders" | "recruiters" | "executives";

export interface Goals {
  opportunityTypes: string[];
  domains: string[];
  functions: string[];
  seniorities: Seniority[];
  audiences: AudienceId[];
}

export interface Profile {
  name: string;
  background: string;
  /** Schools/colleges; connections there (or at their clubs) count as alumni/peers. */
  schools: string[];
}

export interface Template {
  id: string;
  name: string;
  purpose: string;
  channel: string;
  body: string;
}

export interface Segment {
  id: string;
  name: string;
  filters: Filters;
  createdAt: string;
}

export interface Cadence {
  /** Days after first contact to nudge, then again. */
  steps: number[];
  enabled: boolean;
}

export interface PriorityWeights {
  functionMatch: number;
  domainMatch: number;
  targetCompany: number;
  seniorityMatch: number;
  recruiter: number;
  hiring: number;
  alumni: number;
  hasEmail: number;
  replied: number;
  theyInvited: number;
}

export interface Settings {
  profile: Profile;
  cadence: Cadence;
  weights: PriorityWeights;
  goals: Goals;
  targetCompanies: string[];
  statuses: StatusDef[];
  templates: Template[];
  segments: Segment[];
  rules: CustomRule[];
}

export interface DatasetFile {
  fileName: string;
  importedAt: string;
  csv: string;
}

/** Every connections export the user has added. Duplicated people are merged. */
export interface Dataset {
  /** Newest last. Older saves had a single file; they are migrated on load. */
  files: DatasetFile[];
  /** The most recent import, kept for labels and for older saves. */
  fileName: string;
  importedAt: string;
  csv: string;
}

/** Relationship history read from the rest of the LinkedIn archive. */
export interface ArchiveData {
  importedAt: string;
  fileNames: string[];
  history: Record<string, ContactHistory>;
  counts: Record<string, number>;
}

export type HealthIssue =
  | "duplicates" | "missing-position" | "missing-company" | "missing-email" | "missing-linkedin"
  | "unclassified" | "low-confidence" | "manual";

export interface Filters {
  q?: string;
  domains?: string[];
  functions?: string[];
  roles?: string[];
  seniorities?: string[];
  companies?: string[];
  industries?: string[];
  locations?: string[];
  connectedAfter?: string;
  connectedBefore?: string;
  hasEmail?: boolean;
  hasLinkedIn?: boolean;
  statuses?: string[];
  priorities?: Priority[];
  tags?: string[];
  audiences?: AudienceId[];
  targetOnly?: boolean;
  /** Anyone you have moved out of "not contacted", whatever stage they are at. */
  inPipeline?: boolean;
  needsReview?: boolean;
  health?: HealthIssue;
  followUp?: "overdue" | "scheduled" | "none";
  /** Conversation history from the archive. */
  history?: "messaged" | "replied" | "no-reply" | "never" | "they-invited";
  pastCompanies?: string[];
  /** Connected within the last N days. */
  connectedWithinDays?: number;
  /** Connected over a year ago and never contacted. */
  dormant?: boolean;
}

export interface Person {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  url: string;
  email: string;
  company: string;
  companyKey: string;
  position: string;
  connectedOn: Date | null;

  domain: string;
  fn: string;
  role: string;
  seniority: Seniority;
  industry: string;
  industryInferred: boolean;
  confidence: number;
  needsReview: boolean;
  classSource: ClassificationSource;
  classBasis: Basis;
  reasons: string[];
  systemTags: TagId[];
  tags: string[];

  location: string;
  status: string;
  priority: Priority;
  priorityScore: number;
  priorityReasons: string[];
  priorityManual: boolean;
  lastContactedAt: string;
  followUpAt: string;
  channel: string;
  response: string;
  nextAction: string;
  opportunityType: string;
  notes: string;
  personalization: Personalization;
  draft: string;
  messages: SavedMessage[];
  activity: Activity[];

  pastCompanies: string[];
  history: ContactHistory | null;
  sequenceStep: number;
  isTarget: boolean;
  isCampus: boolean;
  /** What a campus role actually involves ("Marketing"); empty for everyone else. */
  campusActivity: string;
  /** Founder or co-founder of the company itself. */
  isFounder: boolean;
  isAlumni: boolean;
  duplicateOf: string | null;
  /** Lower-cased text used by search. */
  haystack: string;
}
