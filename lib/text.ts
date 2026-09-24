// Text normalization shared by the classifier's rule index and its inputs.
// Rules and job titles go through the exact same pipeline, so "Sr. Software
// Engineers", "senior software engineer" and "SR SOFTWARE ENGINEER" all
// produce identical tokens.

const STOPWORDS = new Set([
  "a", "an", "the", "of", "and", "in", "for", "to", "with", "on", "at", "by", "from",
  "our", "my", "your", "i", "am", "is", "are", "as", "or",
  // common non-English connectors
  "de", "del", "da", "do", "dos", "das", "du", "des", "la", "le", "les", "el", "los",
  "las", "y", "e", "et", "und", "der", "die", "von", "fur", "en", "al", "di", "il",
  "van", "het", "een",
]);

// Expanded before singularization. Values may be multi-word.
const ABBREVIATIONS: Record<string, string> = {
  sr: "senior", snr: "senior", jr: "junior", jnr: "junior",
  mgr: "manager", mngr: "manager", mgmt: "management",
  engg: "engineer", engr: "engineer", eng: "engineer",
  dev: "developer", devs: "developer",
  mktg: "marketing", mkt: "marketing",
  acct: "accountant", accts: "accounting", accounts: "accounting",
  asst: "assistant", assoc: "associate", admin: "administrator",
  ops: "operations", biz: "business", bizdev: "business development",
  bd: "business development",
  sw: "software", hw: "hardware", dir: "director", exec: "executive",
  coord: "coordinator", rep: "representative", reps: "representative",
  spl: "specialist", spec: "specialist",
  svp: "vp", evp: "vp", avp: "vp",
  intl: "international", govt: "government", gov: "government",
  dept: "department", univ: "university", prof: "professor",
  cofounder: "co founder", cofounders: "co founder", cofundador: "co fundador",
  frontend: "front end", backend: "back end", fullstack: "full stack",
  cybersecurity: "cyber security", programme: "program", programmes: "program",
  organisation: "organization", organisational: "organizational",
  centre: "center", labour: "labor", counsellor: "counselor",
  paediatrician: "pediatrician", anaesthetist: "anesthetist", defence: "defense",
  theatre: "theater", jeweller: "jeweler", fulfilment: "fulfillment",
  aspirant: "aspiring",
  coop: "co op", mgmnt: "management", tech: "tech", sse: "senior software engineer",
  jre: "junior engineer", asm: "area sales manager", rsm: "regional sales manager",
  kam: "key account manager", abm: "assistant brand manager", pmm: "product marketing manager",
  hod: "hod", cxo: "cxo", swe: "swe", sde: "sde", mle: "mle",
  qe: "quality engineer", hrm: "hr manager",
};

// Words whose trailing "s" is not a plural.
const NO_SINGULAR = new Set([
  "securities", "news", "series", "species", "business", "aws", "ios", "sales",
  "canvas", "chess", "wellness", "fitness", "press", "gas", "bus", "status",
  "campus", "alumnus", "corpus", "focus", "thesis", "analysis", "diagnosis",
  "dynamics", "always", "express", "access", "success",
]);

function singularize(token: string): string {
  if (token.length <= 3 || NO_SINGULAR.has(token)) return token;
  if (token.endsWith("ies") && token.length > 4) return token.slice(0, -3) + "y";
  if (token.endsWith("sses")) return token.slice(0, -2);
  if (/(ss|us|is|ics|ous)$/.test(token)) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function foldText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss");
}

function preClean(input: string): string {
  return foldText(input)
    .replace(/c\+\+/g, " cpp ")
    .replace(/c#/g, " csharp ")
    .replace(/\.net\b/g, " dotnet ")
    .replace(/\bnode\.js\b/g, " nodejs ")
    .replace(/\br\s*&\s*d\b/g, " rnd ")
    .replace(/\bm\s*&\s*a\b/g, " mna ")
    .replace(/\bl\s*&\s*d\b/g, " lnd ")
    .replace(/\bf\s*&\s*b\b/g, " fnb ")
    .replace(/\bp\s*&\s*l\b/g, " pnl ")
    .replace(/\bj\s*&\s*j\b/g, " jnj ")
    .replace(/\bh\s*&\s*m\b/g, " hnm ")
    .replace(/\bfp\s*&\s*a\b/g, " fpa ")
    .replace(/\bat\s*&\s*t\b/g, " att ")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    // "SDE2", "L3", "PM1" → "sde 2"; leaves "b2b", "web3", "3d", "12th" alone.
    .replace(/\b([a-z]{2,})(\d{1,2})\b/g, (m, word: string, num: string) => (KEEP_DIGIT_WORDS.has(m) ? m : `${word} ${num}`));
}

const KEEP_DIGIT_WORDS = new Set(["web3", "web2", "b2b", "b2c", "d2c", "c2c", "h2o", "co2", "dream11", "prince2", "ec2", "fy24", "fy25", "fy26"]);

export function tokenize(input: string): string[] {
  const out: string[] = [];
  for (const raw of preClean(input).split(/[^a-z0-9]+/)) {
    if (!raw) continue;
    const expanded = ABBREVIATIONS[raw] ?? raw;
    for (const part of expanded.split(" ")) {
      if (!part || STOPWORDS.has(part)) continue;
      out.push(singularize(part));
    }
  }
  return out;
}

export interface TitleSegment {
  title: string;
  /** Company named inside the title itself, e.g. "SWE @ Google". */
  inlineCompany: string;
  /** 1 for the primary segment, lower for trailing or past ("Ex-") segments. */
  weight: number;
}

// Splits LinkedIn headline-style positions such as
// "Founder @ Acme | Ex-Google | Angel Investor" into weighted segments.
export function splitSegments(position: string): TitleSegment[] {
  const parts = position
    .split(/\s*[|•·▪►◆‖;]\s*|\s+[-–—]\s+|\s*\/\/\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts.map((part, i) => {
    const [title, ...rest] = part.split(/\s*@\s*|\s+at\s+/i);
    const isPast = /^(ex|former|formerly|previously|prev|past|earlier)\b/i.test(part);
    return {
      title: title ?? "",
      inlineCompany: rest.join(" "),
      weight: isPast ? 0.25 : i === 0 ? 1 : 0.7,
    };
  });
}

const JUNK = /^(n\/?a|na|none|nil|null|nothing|no|self|me|test|unknown|tbd|tba|private|confidential|\W+|x+|-+|\.+)$/i;

/** Returns "" for placeholders like "N/A", "-", "..." that carry no information. */
export function cleanField(value: string | undefined | null): string {
  const v = (value ?? "").replace(/\s+/g, " ").trim();
  if (!v || JUNK.test(v) || !/[\p{L}]/u.test(v)) return "";
  return v;
}

/** Damerau-style edit distance with an early exit once `max` is exceeded. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}
