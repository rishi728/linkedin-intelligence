// A small body of networking craft the product can draw on. These are principles,
// not motivation: each one should teach something you could act on in the next
// five minutes. Nothing here is generated, personalised, or tied to a person.

export type KnowledgeCategory =
  | "outreach"
  | "networking"
  | "coldOutreach"
  | "followUp"
  | "mentorship"
  | "referrals"
  | "career"
  | "relationships"
  | "conversation"
  | "confidence"
  | "discovery"
  | "dataQuality";

export interface Principle {
  /** The line worth remembering. Short enough to read in one glance. */
  quote: string;
  /** Why it is true, or what to do about it. One or two sentences. */
  insight: string;
  category: KnowledgeCategory;
}

/** Shown under the quote, so a principle is labelled rather than floating. */
export const CATEGORY_LABEL: Record<KnowledgeCategory, string> = {
  outreach: "Outreach principle",
  networking: "Networking principle",
  coldOutreach: "Cold outreach principle",
  followUp: "Follow-up principle",
  mentorship: "Mentorship principle",
  referrals: "Referral principle",
  career: "Career principle",
  relationships: "Relationship principle",
  conversation: "Conversation principle",
  confidence: "Confidence principle",
  discovery: "Discovery principle",
  dataQuality: "Data principle",
};

export const KNOWLEDGE: Principle[] = [
  // --- networking
  { category: "networking", quote: "You do not need a bigger network. You need better conversations.", insight: "Another hundred connections will not help if the ones you have never hear from you. Depth beats reach." },
  { category: "networking", quote: "A connection becomes useful when you give it attention.", insight: "An unused connection is just a name. One message turns it into a relationship you can draw on later." },
  { category: "networking", quote: "The easiest introduction is usually the one that already exists.", insight: "Before looking for a way in somewhere new, check who you already know there." },
  { category: "networking", quote: "Most people are happy to help. Very few are happy to guess.", insight: "Vague requests get ignored because they are work. Make it obvious what you are asking for." },
  { category: "networking", quote: "Your network is more useful when you know its shape.", insight: "Knowing you have forty people in one industry changes what you ask for, and who you ask." },

  // --- outreach
  { category: "outreach", quote: "People remember specificity.", insight: "A specific reason for reaching out is more useful than a clever introduction. Name the thing only they could tell you." },
  { category: "outreach", quote: "Lead with context, not credentials.", insight: "Why you are writing to this person matters more than your CV. Put the connection first." },
  { category: "outreach", quote: "The goal of outreach is not a reply. It is a relationship.", insight: "Judge a message by whether it starts something, not whether it gets answered today." },
  { category: "outreach", quote: "A thoughtful message is worth more than a clever one.", insight: "Cleverness asks to be admired. Thoughtfulness asks to be answered." },
  { category: "outreach", quote: "Send the shorter version.", insight: "A long message asks for a long reply, which is exactly why it does not get one." },

  // --- cold outreach
  { category: "coldOutreach", quote: "Nobody owes you a reply. That is freedom, not rejection.", insight: "Silence usually means a busy week, not a judgement. Send the next one." },
  { category: "coldOutreach", quote: "Say why them, and say it first.", insight: "The opening line should make it impossible to mistake your message for a template." },
  { category: "coldOutreach", quote: "Ask for perspective before asking for help.", insight: "Perspective is cheap to give and easy to say yes to. Help is a bigger ask and usually comes later." },

  // --- follow-up
  { category: "followUp", quote: "Follow-up is where most networking disappears.", insight: "The first message is the easy part. The second one is what separates a contact from a conversation." },
  { category: "followUp", quote: "A good conversation should have a next step.", insight: "Before you close a thread, decide what happens next and when. Otherwise nothing does." },
  { category: "followUp", quote: "One more message is rarely the thing that annoys someone.", insight: "Being forgotten costs more than being mildly persistent. Give it a week and try once more." },
  { category: "followUp", quote: "Consistency beats intensity.", insight: "Five messages a week for a month will do more than fifty in one afternoon." },

  // --- mentorship
  { category: "mentorship", quote: "Ask about decisions, not advice.", insight: "\"How did you decide?\" gets a real story. \"Any advice?\" gets a platitude." },
  { category: "mentorship", quote: "Nobody wants to be your mentor. Plenty of people will answer one good question.", insight: "Do not open with a long commitment. Open with something answerable in two minutes." },
  { category: "mentorship", quote: "Come back with what you did.", insight: "Telling someone how their answer changed what you did is the single best way to earn a second conversation." },

  // --- referrals
  { category: "referrals", quote: "Make it easy to say yes.", insight: "Send the role, the link and two lines they can paste. A referral should cost them a minute, not an afternoon." },
  { category: "referrals", quote: "Ask the person who knows your work, not the person with the best title.", insight: "A referral carries weight because of what the referrer can honestly say about you." },
  { category: "referrals", quote: "Ask before you apply, not after.", insight: "Most referral schemes need the referral to come first. Afterwards, it is usually too late to count." },

  // --- relationships
  { category: "relationships", quote: "Warm beats cold, every time.", insight: "Someone who has replied to you before is far more likely to reply again. Start there." },
  { category: "relationships", quote: "Keep the door open with people who said no.", insight: "A no today is often about timing. The relationship outlives the request." },
  { category: "relationships", quote: "Give before you need something.", insight: "The best time to be useful to someone is when you want nothing from them." },

  // --- conversation
  { category: "conversation", quote: "Ask the question only they can answer.", insight: "If your question could be sent to a hundred people, it reads like it was." },
  { category: "conversation", quote: "Curiosity travels further than flattery.", insight: "Praise is easy to ignore. A real question is hard not to answer." },
  { category: "conversation", quote: "End with one clear ask.", insight: "Two questions halve your chances. Pick the one that matters." },

  // --- career
  { category: "career", quote: "Opportunities move through people long before they reach a job board.", insight: "By the time a role is posted, someone in the building has usually already been asked." },
  { category: "career", quote: "Talk to people doing the job you want, not the job you have.", insight: "They will tell you what actually matters, which is rarely what the description says." },

  // --- confidence
  { category: "confidence", quote: "The worst outcome of a good message is silence.", insight: "You are not risking much. Weigh that against never having asked." },
  { category: "confidence", quote: "You are not interrupting. You are giving someone a reason to talk about their work.", insight: "Most people enjoy being asked about what they know." },

  // --- discovery
  { category: "discovery", quote: "You probably already know someone who knows someone.", insight: "Second-degree paths are the most underused part of any network. Start from who you have." },
  { category: "discovery", quote: "Search for the job, not the person.", insight: "You rarely know who you need by name. You almost always know what they do." },
  { category: "discovery", quote: "The interesting people are rarely the obvious ones.", insight: "The person two rungs below the title you were looking for usually has more time and more detail." },

  // --- data quality
  { category: "dataQuality", quote: "A list you do not trust is a list you will not use.", insight: "Fixing a handful of wrong job titles pays for itself the first time you search." },
  { category: "dataQuality", quote: "Correct it once, and it stays correct.", insight: "Every correction teaches a rule that applies to everyone with the same job title." },
];

const BY_CATEGORY = new Map<KnowledgeCategory, Principle[]>();
for (const p of KNOWLEDGE) {
  const list = BY_CATEGORY.get(p.category) ?? [];
  list.push(p);
  BY_CATEGORY.set(p.category, list);
}

export function principlesFor(categories: KnowledgeCategory[]): Principle[] {
  const out = categories.flatMap((c) => BY_CATEGORY.get(c) ?? []);
  return out.length ? out : KNOWLEDGE;
}

/**
 * A stable starting point that still changes: the same place shows the same
 * principle all day, and a different one tomorrow. No randomness, so a re-render
 * never swaps the text out from under someone mid-read.
 */
export function startIndex(seed: string, length: number, day = new Date()): number {
  if (length <= 0) return 0;
  const key = `${seed}-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 100003;
  return hash % length;
}
