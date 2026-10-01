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
    id: "explore-connect", name: "Explore / Connect", purpose: "Introduction", channel: "LinkedIn",
    body: "Hi {{first_name}},\n\nI came across your profile while exploring [industry/role/company] and found your journey from [specific detail] to {{role}} really interesting.\n\nI'm currently [your role/year] at [college/company], working on [area/project], and I'm trying to learn more about [specific field/role].\n\nI'd love to connect and, if you're open to it, hear a little about your experience in [specific area] -- especially [specific question/topic].\n\nWould be great to connect!\n\nBest,\n{{my_name}}",
  },
  {
    id: "job-internship", name: "Job / Internship Opportunity", purpose: "Job", channel: "LinkedIn",
    body: "Hi {{first_name}},\n\nI'm [your role/year] at [college/company], currently looking for opportunities in [role/field].\n\nI came across {{company}} and was particularly interested in [specific project/product/team/area]. My experience in [skill/area] includes [1-2 relevant achievements or projects], and I believe it aligns well with the kind of work your team is doing.\n\nI wanted to reach out and ask if there are any [internship/full-time] opportunities in [role/team] currently or coming up.\n\nI'd be happy to share my resume or any additional details if useful.\n\nThanks for your time!\n\nBest,\n{{my_name}}",
  },
  {
    id: "referral-linkedin", name: "Referral", purpose: "Referral", channel: "LinkedIn",
    body: "Hi {{first_name}},\n\nHope you're doing well!\n\nI'm [your role/year] at [college/company] and recently came across the [Role Name] opportunity at {{company}}. The role caught my attention because of its focus on [specific responsibility/area].\n\nI've worked on [relevant project/experience] and have experience with [2-3 relevant skills], so I feel the opportunity aligns closely with my background.\n\nSince you're currently at {{company}}, I wanted to ask if you'd be comfortable referring me for the role. I completely understand if you'd prefer to know more about my background first.\n\nI can share my resume and the job link for reference.\n\nThanks a lot for considering it!\n\nBest,\n{{my_name}}",
  },
];

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
    templates: DEFAULT_TEMPLATES.map((t) => ({ ...t })),
    segments: [],
    lists: [],
    focus: { ...EMPTY_FOCUS, goals: [] },
    rules: [],
  };
}
