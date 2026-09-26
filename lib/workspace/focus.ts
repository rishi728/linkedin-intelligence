// What the user told us they are here for, and how that steers who gets surfaced.
//
// Nothing here guesses at intent. The goals are chosen by the user; all this does
// is translate a chosen goal into the kinds of people that goal actually implies,
// using the same category and audience vocabulary the rest of the app filters on.

import type { AudienceId, FocusGoalId, Filters, NetworkingFocus, Settings } from "./types";

export interface FocusGoalDef {
  id: FocusGoalId;
  label: string;
  hint: string;
  /** Role buckets this goal makes relevant, on top of whatever the user targets. */
  buckets: string[];
  audiences: AudienceId[];
}

export const FOCUS_GOALS: FocusGoalDef[] = [
  {
    id: "research",
    label: "Research",
    hint: "Researchers, professors, collaborators and research opportunities.",
    buckets: ["research-and-science", "education-and-academia", "data-and-ai"],
    audiences: [],
  },
  {
    id: "internship",
    label: "Internship",
    hint: "Internships, relevant teams, and people to learn from.",
    buckets: ["people-and-talent"],
    audiences: ["recruiters", "managers"],
  },
  {
    id: "job",
    label: "Job",
    hint: "Roles, companies and people relevant to a career path.",
    buckets: ["people-and-talent"],
    audiences: ["recruiters", "managers", "directors"],
  },
  {
    id: "networking",
    label: "Networking",
    hint: "Meet interesting people and build professional relationships.",
    buckets: [],
    audiences: ["peers", "alumni"],
  },
  {
    id: "learning",
    label: "Learning",
    hint: "People whose experience or knowledge you want to learn from.",
    buckets: [],
    audiences: ["managers", "directors"],
  },
  {
    id: "mentorship",
    label: "Mentorship",
    hint: "People who can give career or domain guidance.",
    buckets: [],
    audiences: ["directors", "executives", "alumni"],
  },
  {
    id: "building",
    label: "Building / Business",
    hint: "Founders, operators and collaborators relevant to something you are building.",
    buckets: ["founders-and-entrepreneurship", "product-and-design"],
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

  const buckets = [...new Set(chosen.flatMap((g) => g.buckets))];
  const implied = [...new Set(chosen.flatMap((g) => g.audiences))];

  const f: Filters = {};
  if (goals.domains.length) f.domains = goals.domains;
  if (goals.functions.length) f.functions = goals.functions;
  if (goals.seniorities.length) f.seniorities = goals.seniorities;
  if (goals.audiences.length) f.audiences = goals.audiences;

  // Goals only widen, and only along one axis. Filters are combined with AND, so
  // asking for both the categories and the audiences a goal implies would return
  // the people in both at once, which is far narrower than the goal means.
  const named = goals.domains.length + goals.functions.length > 0;
  if (!named && buckets.length) f.buckets = buckets;
  else if (!named && !goals.audiences.length && implied.length) f.audiences = implied;
  return f;
}

export function focusIsUseful(settings: Settings): boolean {
  return Object.keys(focusFilters(settings)).length > 0;
}
