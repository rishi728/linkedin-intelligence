import type { Band } from "../classifier/categories";
import type { SectorId } from "../knowledge/sectors";
import type { ContactHistory } from "../archive";
import type { Basis } from "../phrases";
import type { ClassificationSource, CustomRule, RoleHierarchy } from "../classifier/corrections";
import type { TagId } from "../taxonomy";

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
  classification?: Partial<RoleHierarchy>;
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
  /** Categories the user is aiming at, by id. */
  categories: string[];
  /** Role families inside those categories. */
  roleFamilies: string[];
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

/** What the user said they are here for, confirmed at first import. */
export type FocusGoalId = "research" | "job" | "networking";

export interface NetworkingFocus {
  goals: FocusGoalId[];
  /** Optional free text, e.g. "Looking for AI research internships". */
  direction: string;
  /** Set once the user finishes the setup flow, so it never runs twice. */
  confirmedAt: string;
}

/** A list of people the user put together by hand. Membership only, no statuses. */
export interface PersonList {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
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
  lists: PersonList[];
  focus: NetworkingFocus;
  rules: CustomRule[];
  /** ISO date of the last downloaded backup, so the app can nudge when it goes stale. */
  lastBackupAt?: string;
  /** Routes whose guide has been read, so Pip only introduces a page once. */
  toursSeen?: string[];
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
  roles?: string[];
  companies?: string[];
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
  /** One of the ten categories, by id. */
  categories?: string[];
  /** Role families inside a category. */
  roleFamilies?: string[];
  /** Confidence bands. */
  bands?: string[];
  /** Broad sectors of the employer. */
  sectors?: string[];
  /** People in this user-made list. */
  listId?: string;
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

  needsReview: boolean;
  classSource: ClassificationSource;
  classBasis: Basis;
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
  // ---- the classifier's view of this person --------------------------------
  /** One of the ten categories, or "No Professional Information". */
  category: string;
  /** The function inside that category, or the generic family when there is none. */
  roleFamily: string;
  /** 0.20 to 0.97. Never 1 for a real classification. */
  confidence: number;
  band: Band;
  /** The runner-up, when it scored close enough to be worth naming. */
  secondCategory: string | null;
  /** How this classification was reached, in the classifier's own words. */
  method: string;
  /** 1 to 10: the seeded centroid this person's title and employer sit nearest. */
  cluster: number | null;
  /** The title disagreed with a confident cluster. */
  conflict: boolean;
  /** The title named no function, so company and colleagues decided it. */
  genericInference: boolean;
  /** The employer's broad sector, which is about the company, not the person. */
  sector: SectorId | null;
  /** Lower-cased text used by search. */
  haystack: string;
}
