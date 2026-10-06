import type { Cadence, Goals, NetworkingFocus, PriorityWeights, Profile, Settings, StatusDef, Template } from "./types";

export const DEFAULT_STATUSES: StatusDef[] = [
  { id: "not_contacted", label: "Not contacted", tone: "gray", onBoard: false, kind: "idle" },
  { id: "to_contact", label: "To contact", tone: "blue", onBoard: true, kind: "active" },
  { id: "contacted", label: "Contacted", tone: "violet", onBoard: true, kind: "active", followUpDays: 3 },
  { id: "awaiting", label: "Awaiting response", tone: "amber", onBoard: true, kind: "active", followUpDays: 3 },
  { id: "follow_up", label: "Follow-up", tone: "orange", onBoard: true, kind: "active", followUpDays: 0 },
  { id: "replied", label: "Replied", tone: "teal", onBoard: false, kind: "positive", followUpDays: 3 },
  { id: "call_scheduled", label: "Call scheduled", tone: "teal", onBoard: false, kind: "positive" },
  { id: "interested", label: "Interested", tone: "green", onBoard: true, kind: "positive", followUpDays: 3 },
  { id: "referral", label: "Referral", tone: "green", onBoard: false, kind: "positive" },
  { id: "opportunity", label: "Opportunity", tone: "green", onBoard: true, kind: "positive" },
  { id: "not_interested", label: "Not interested", tone: "slate", onBoard: false, kind: "closed" },
  { id: "closed", label: "Closed", tone: "slate", onBoard: true, kind: "closed" },
  { id: "do_not_contact", label: "Do not contact", tone: "red", onBoard: false, kind: "closed" },
];

export const CHANNELS = ["LinkedIn", "Email", "Phone", "WhatsApp", "In person", "Intro via someone", "Other"];
export const OPPORTUNITY_TYPES = ["Internship", "Full-time", "Referral", "Mentorship", "Project", "Research", "Consulting", "Freelance", "Startup opportunity"];
export const PURPOSES = ["Referral", "Advice", "Mentorship", "Introduction", "Internship", "Job", "Networking"];
export const RESPONSES = ["No response yet", "Positive", "Neutral", "Declined", "Asked for resume", "Offered referral", "Scheduled a call"];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "referral-linkedin", name: "Referral request", purpose: "Referral", channel: "LinkedIn",
    body: "Hi {{first_name}}, I came across your work as {{role}} at {{company}}. {{reason}} I'm {{my_background}} and am applying for {{ask}}. Would you be open to referring me, or pointing me to the right person? Happy to share my resume. Thank you!",
  },
  {
    id: "advice-linkedin", name: "Quick advice", purpose: "Advice", channel: "LinkedIn",
    body: "Hi {{first_name}}, I'm {{my_background}}. {{reason}} Given your experience as {{role}} at {{company}}, could I ask you {{ask}}? Even a few lines would help a lot.",
  },
  {
    id: "mentorship-email", name: "Mentorship", purpose: "Mentorship", channel: "Email",
    body: "Hi {{first_name}},\n\nI'm {{my_name}}, {{my_background}}. {{reason}}\n\n{{common_context}}\n\nI'd really value your perspective on {{ask}}. Would you be open to a 15-minute call in the next couple of weeks?\n\nThanks so much,\n{{my_name}}",
  },
  {
    id: "intro-linkedin", name: "Introduction", purpose: "Introduction", channel: "LinkedIn",
    body: "Hi {{first_name}}, great to be connected. {{common_context}} I'm {{my_background}} and {{reason}} Would you be open to {{ask}}?",
  },
  {
    id: "internship-email", name: "Internship enquiry", purpose: "Internship", channel: "Email",
    body: "Hi {{first_name}},\n\nI'm {{my_name}}, {{my_background}}. {{reason}}\n\nI'm exploring {{ask}} at {{company}} and would love to learn whether your team takes interns, or who I should speak to.\n\nThank you for your time,\n{{my_name}}",
  },
  {
    id: "job-linkedin", name: "Job opportunity", purpose: "Job", channel: "LinkedIn",
    body: "Hi {{first_name}}, I noticed you're {{role}} at {{company}}. {{reason}} I'm {{my_background}} and am interested in {{ask}}. Could I ask how your team hires, or whether there's someone I should reach out to?",
  },
  {
    id: "networking-linkedin", name: "Catch up / networking", purpose: "Networking", channel: "LinkedIn",
    body: "Hi {{first_name}}, hope you're doing well! {{common_context}} I'd love to hear what you're working on at {{company}}. {{ask}}",
  },
];

/** Added in version 1 of the template set. Placeholders are left as written, never filled in. */
export const PLAIN_TEMPLATES: Template[] = [
  {
    id: "plain-referral", name: "Referral Request (as written)", purpose: "Referral", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, I came across your work as {{role}} at {{company}} and noticed {{reason}}. I’m {{my_background}} and currently exploring {{ask}}. Would you be open to referring me, or pointing me toward the right person on the team? Happy to share my resume. Thanks!",
  },
  {
    id: "plain-advice", name: "Quick Advice (as written)", purpose: "Advice", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, I’m {{my_background}}. I came across your profile because {{reason}}. Given your experience as {{role}} at {{company}}, I wanted to ask you {{ask}}. Even a quick perspective would be really helpful. Thanks!",
  },
  {
    id: "plain-intro", name: "Introduction / Connect (as written)", purpose: "Introduction", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, great to connect! {{common_context}}. I’m {{my_background}}, and {{reason}}. I’d love to learn more about your experience and was wondering if you’d be open to {{ask}}.",
  },
  {
    id: "plain-job", name: "Job / Internship Opportunity (as written)", purpose: "Job", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, I noticed you’re working as {{role}} at {{company}}. {{reason}}. I’m {{my_background}} and currently exploring {{ask}}. I wanted to ask how your team usually hires for these roles, or if there’s someone you’d recommend I reach out to. Thanks!",
  },
  {
    id: "plain-networking", name: "Catch-up / Networking (as written)", purpose: "Networking", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, hope you’re doing well! {{common_context}}. I’m really interested in what you’re building/working on at {{company}}. Would love to hear about your experience and {{ask}}.",
  },
  {
    id: "plain-cold", name: "Cold Connect", purpose: "Networking", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, came across your profile while looking into {{topic/company/role}}. Your work in {{specific_area}} caught my attention. I’m {{my_background}} and exploring {{area}}. Would be great to connect!",
  },
  {
    id: "plain-followup", name: "Follow-up", purpose: "Networking", channel: "LinkedIn", literal: true,
    body: "Hi {{first_name}}, just wanted to follow up on my previous message. I know things can get busy, so no worries if you haven’t had a chance to look at it. I’d really appreciate your thoughts whenever you get a moment. Thanks!",
  },
];

export const TEMPLATES_VERSION = 1;

export const DEFAULT_CADENCE: Cadence = { steps: [5, 9, 14], enabled: true };

export const DEFAULT_WEIGHTS: PriorityWeights = {
  functionMatch: 35, domainMatch: 28, targetCompany: 25, seniorityMatch: 15,
  recruiter: 12, hiring: 8, alumni: 10, hasEmail: 4, replied: 12, theyInvited: 6,
};

export const EMPTY_GOALS: Goals = { opportunityTypes: [], categories: [], roleFamilies: [], audiences: [] };
export const EMPTY_FOCUS: NetworkingFocus = { goals: [], direction: "", confirmedAt: "" };
export const EMPTY_PROFILE: Profile = { name: "", background: "", schools: [] };

export function defaultSettings(): Settings {
  return {
    profile: { ...EMPTY_PROFILE },
    cadence: { ...DEFAULT_CADENCE, steps: [...DEFAULT_CADENCE.steps] },
    weights: { ...DEFAULT_WEIGHTS },
    goals: { ...EMPTY_GOALS },
    targetCompanies: [],
    statuses: DEFAULT_STATUSES.map((s) => ({ ...s })),
    templates: [...DEFAULT_TEMPLATES, ...PLAIN_TEMPLATES].map((t) => ({ ...t })),
    templatesVersion: TEMPLATES_VERSION,
    segments: [],
    lists: [],
    focus: { ...EMPTY_FOCUS, goals: [] },
    rules: [],
  };
}
