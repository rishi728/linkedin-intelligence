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
  /** Role categories this goal makes relevant, on top of whatever the user targets. */
  categories: string[];
  audiences: AudienceId[];
}

export const FOCUS_GOALS: FocusGoalDef[] = [
  {
    id: "research",
    label: "Research opportunities",
    hint: "Researchers, professors, collaborators and lab positions.",
    categories: ["education", "data"],
    audiences: [],
  },
  {
    id: "job",
    label: "Internship or full-time",
    hint: "Roles, the teams behind them, and the people who hire.",
    categories: ["business"],
    audiences: ["recruiters", "founders"],
  },
  {
    id: "networking",
    label: "Networking",
    hint: "Meet interesting people and build professional relationships.",
    categories: [],
    audiences: ["alumni", "founders"],
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

  const categories = [...new Set(chosen.flatMap((g) => g.categories))];
  const implied = [...new Set(chosen.flatMap((g) => g.audiences))];

  const f: Filters = {};
  if (goals.categories.length) f.categories = goals.categories;
  if (goals.roleFamilies.length) f.roleFamilies = goals.roleFamilies;
  if (goals.audiences.length) f.audiences = goals.audiences;

  // Goals only widen, and only along one axis. Filters are combined with AND, so
  // asking for both the categories and the audiences a goal implies would return
  // the people in both at once, which is far narrower than the goal means.
  const named = goals.categories.length + goals.roleFamilies.length > 0;
  if (!named && categories.length) f.categories = categories;
  else if (!named && !goals.audiences.length && implied.length) f.audiences = implied;
  return f;
}

export function focusIsUseful(settings: Settings): boolean {
  return Object.keys(focusFilters(settings)).length > 0;
}
