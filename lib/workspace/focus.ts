// What the user told us they are here for, and how that steers who gets surfaced.
//
// Nothing here guesses at intent. The goals are chosen by the user; all this does
// is translate a chosen goal into the kinds of people that goal actually implies,
// using the same category and audience vocabulary the rest of the app filters on.

import type { PrimaryId } from "../primary";
import type { AudienceId, FocusGoalId, Filters, NetworkingFocus, Settings } from "./types";

export interface FocusGoalDef {
  id: FocusGoalId;
  label: string;
  hint: string;
  /** Categories this goal makes relevant, on top of whatever the user targets. */
  primaries: PrimaryId[];
  audiences: AudienceId[];
}

export const FOCUS_GOALS: FocusGoalDef[] = [
  {
    id: "research",
    label: "Research",
    hint: "Researchers, professors, collaborators and research opportunities.",
    primaries: ["research", "education", "ai"],
    audiences: [],
  },
  {
    id: "internship",
    label: "Internship",
    hint: "Internships, relevant teams, and people to learn from.",
    primaries: ["recruiters"],
    audiences: ["recruiters", "managers"],
  },
  {
    id: "job",
    label: "Job",
    hint: "Roles, companies and people relevant to a career path.",
    primaries: ["recruiters"],
    audiences: ["recruiters", "managers", "directors"],
  },
  {
    id: "networking",
    label: "Networking",
    hint: "Meet interesting people and build professional relationships.",
    primaries: [],
    audiences: ["peers", "alumni"],
  },
  {
    id: "learning",
    label: "Learning",
    hint: "People whose experience or knowledge you want to learn from.",
    primaries: [],
    audiences: ["managers", "directors"],
  },
  {
    id: "mentorship",
    label: "Mentorship",
    hint: "People who can give career or domain guidance.",
    primaries: [],
    audiences: ["directors", "executives", "alumni"],
  },
  {
    id: "building",
    label: "Building / Business",
    hint: "Founders, operators and collaborators relevant to something you are building.",
    primaries: ["founders", "product"],
    audiences: ["founders"],
  },
];

export const FOCUS_MAP = new Map(FOCUS_GOALS.map((g) => [g.id, g]));

export function hasFocus(focus: NetworkingFocus | undefined): boolean {
  return !!focus?.goals.length;
}

/**
 * The filter that "people worth contacting" means for this user: their explicit
 * goal targets first, widened by what their chosen goals imply. Returns an empty
 * filter when they have told us nothing, so callers can avoid showing a list that
 * would just be a guess.
 */
export function focusFilters(settings: Settings): Filters {
  const { goals } = settings;
  const chosen = (settings.focus?.goals ?? []).map((g) => FOCUS_MAP.get(g)).filter(Boolean) as FocusGoalDef[];

  const primaries = [...new Set(chosen.flatMap((g) => g.primaries))];
  const audiences = [...new Set([...goals.audiences, ...chosen.flatMap((g) => g.audiences)])];

  const f: Filters = {};
  if (goals.domains.length) f.domains = goals.domains;
  if (goals.functions.length) f.functions = goals.functions;
  if (goals.seniorities.length) f.seniorities = goals.seniorities;
  if (audiences.length) f.audiences = audiences;
  // Only used when the user has named no areas of their own, so it widens rather
  // than narrows: a goal should never exclude somebody they explicitly targeted.
  if (!goals.domains.length && !goals.functions.length && primaries.length) f.primaries = primaries;
  return f;
}

export function focusIsUseful(settings: Settings): boolean {
  return Object.keys(focusFilters(settings)).length > 0;
}
