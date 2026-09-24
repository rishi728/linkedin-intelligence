// The three reasons anyone actually opens a message to someone in their network.
// Each carries its own preset, written to sound like a person rather than a mail
// merge. Placeholders in square brackets stay visible and editable when the data
// to fill them does not exist, so nothing is ever invented on the reader's behalf.

export type OutreachIntentId = "explore_connect" | "referral" | "job_internship";

export interface OutreachIntent {
  id: OutreachIntentId;
  label: string;
  description: string;
  /** Stored on the person, and used as the mail subject. */
  purpose: string;
  body: string;
}

export const OUTREACH_INTENTS: OutreachIntent[] = [
  {
    id: "explore_connect",
    label: "Explore / Connect",
    description: "Learn about their work, experience, or build a professional relationship.",
    purpose: "Advice",
    body: `Hi {{first_name}},

I'm {{my_name}}, {{my_background}}.

I came across your profile while exploring {{area}}, and your experience as {{role}} at {{company}} caught my attention.

I'm currently exploring [topic] and would love to hear about your experience with [specific question], if you're open to sharing.

Best,
{{my_name}}`,
  },
  {
    id: "referral",
    label: "Referral",
    description: "Reach out regarding a referral or introduction for an opportunity.",
    purpose: "Referral",
    body: `Hi {{first_name}},

I'm {{my_name}}, {{my_background}}.

I came across your profile while exploring opportunities in {{area}} at {{company}}, and I'm particularly interested in [role].

I wanted to learn a little more about the team and the kind of profiles they're looking for. If you think my background could be relevant, I'd really appreciate any guidance on how best to explore the opportunity.

Best,
{{my_name}}`,
  },
  {
    id: "job_internship",
    label: "Job / Internship",
    description: "Reach out directly about a relevant job or internship.",
    purpose: "Job",
    body: `Hi {{first_name}},

I'm {{my_name}}, {{my_background}}.

I came across your profile while exploring {{opportunity}} opportunities in {{area}} at {{company}}. I'm particularly interested in [team].

I'd love to learn more about the work your team is doing and whether there might be a relevant opportunity.

Best,
{{my_name}}`,
  },
];

export const INTENT_MAP: Record<OutreachIntentId, OutreachIntent> = Object.fromEntries(
  OUTREACH_INTENTS.map((i) => [i.id, i]),
) as Record<OutreachIntentId, OutreachIntent>;

/**
 * Small rewrites that keep a draft in the user's hands. Deterministic text work,
 * not generation: nothing new is claimed, sentences are only cut or softened.
 */
export const DRAFT_TOOLS = [
  {
    id: "shorter",
    label: "Make shorter",
    apply: (text: string) =>
      text
        .split(/\n{2,}/)
        .filter((para, i, all) => i === 0 || i === all.length - 1 || para.trim().length < 180)
        .join("\n\n"),
  },
  {
    id: "warmer",
    label: "Make warmer",
    apply: (text: string) =>
      text
        .replace(/^Hi /m, "Hi ")
        .replace(/\bI wanted to\b/g, "I'd love to")
        .replace(/\bI would\b/g, "I'd")
        .replace(/\bBest,/m, "Thanks so much,"),
  },
  {
    id: "direct",
    label: "Make more direct",
    apply: (text: string) =>
      text
        .replace(/\bI would really appreciate\b/g, "I'd appreciate")
        .replace(/\bI was wondering whether\b/g, "Could")
        .replace(/\bif you're open to sharing\b/g, "if you have a moment")
        .replace(/\bI'd really appreciate any guidance on how best to explore the opportunity\./g, "Any pointers would help."),
  },
] as const;
