// The sector side of the knowledge repository.
//
// One broad sector per person, read from where they work. It stops here: there
// is no industry or sub-industry beneath it, deliberately, because a connections
// export does not carry enough evidence to support a deeper hierarchy honestly.
//
// A company that matches nothing is left unclassified rather than dropped into
// "Other", so the Other sector means "genuinely something else", not "unknown".

export const SECTOR_IDS = [
  "technology", "financial", "healthcare", "manufacturing", "consumer", "energy",
  "transport", "realestate", "media", "education", "public", "professional", "other",
] as const;

export type SectorId = (typeof SECTOR_IDS)[number];

export const SECTOR_LABEL: Record<SectorId, string> = {
  technology: "Technology & Software",
  financial: "Financial Services",
  healthcare: "Healthcare & Life Sciences",
  manufacturing: "Manufacturing & Industrial",
  consumer: "Consumer & Retail",
  energy: "Energy & Natural Resources",
  transport: "Transportation & Logistics",
  realestate: "Real Estate & Construction",
  media: "Media, Entertainment & Creative",
  education: "Education",
  public: "Government, Public Sector & Social Impact",
  professional: "Professional & Business Services",
  other: "Other",
};

export const SECTORS = SECTOR_IDS.map((id) => ({ id, label: SECTOR_LABEL[id] }));

interface SectorRule {
  sector: SectorId;
  /** Whole company names, matched exactly against the normalised name. */
  names?: string[];
  /** Phrases that can appear anywhere in the company name. */
  words?: string[];
}

// Ordered: the first match wins, so put the specific rules above the general ones.
const RULES: SectorRule[] = [
  {
    sector: "technology",
    names: [
      "google", "alphabet", "microsoft", "amazon", "apple", "meta", "facebook", "netflix", "nvidia",
      "adobe", "salesforce", "oracle", "sap", "ibm", "intel", "qualcomm", "cisco", "dell", "hp",
      "uber", "airbnb", "spotify", "stripe", "shopify", "atlassian", "twilio", "snowflake", "databricks",
      "openai", "anthropic", "deepmind", "mistral", "cohere", "hugging face", "perplexity", "scale ai",
      "tcs", "tata consultancy services", "infosys", "wipro", "hcl", "hcltech", "tech mahindra", "cognizant",
      "accenture technology", "mindtree", "ltimindtree", "persistent systems", "zoho", "freshworks",
      "flipkart", "swiggy", "zomato", "paytm", "phonepe", "razorpay", "cred", "zerodha", "meesho",
      "ola", "oyo", "byjus", "unacademy", "postman", "browserstack", "zeta", "groww", "urban company",
      "samsung", "sony", "lg electronics", "xiaomi", "oneplus", "lenovo", "asus", "acer",
    ],
    words: [
      "technologies", "technology", "software", "systems", "infotech", "info tech", "it services",
      "digital", "cyber", "cloud", "data", "analytics", " ai", "ai ", "artificial intelligence",
      "labs", "solutions", "computing", "semiconductor", "electronics", "telecom", "networks",
      "saas", "platform", "app", "web", "cognitive", "robotics",
    ],
  },
  {
    sector: "financial",
    names: [
      "goldman sachs", "morgan stanley", "jpmorgan", "jp morgan", "j p morgan", "citi", "citibank",
      "hsbc", "barclays", "deutsche bank", "ubs", "credit suisse", "bank of america", "wells fargo",
      "blackrock", "blackstone", "kkr", "carlyle", "apollo global", "bain capital", "sequoia capital",
      "accel", "andreessen horowitz", "tiger global", "softbank", "peak xv",
      "hdfc bank", "icici bank", "axis bank", "state bank of india", "sbi", "kotak mahindra bank",
      "yes bank", "idfc first bank", "indusind bank", "bajaj finance", "bajaj finserv",
      "lic", "hdfc life", "icici prudential", "max life", "tata aia", "policybazaar",
      "visa", "mastercard", "paypal", "american express", "nse", "bse", "moodys", "s and p global",
    ],
    words: [
      "bank", "banking", "capital", "asset management", "investments", "investment", "securities",
      "insurance", "assurance", "mutual fund", "wealth", "financial services", "finserv", "fintech",
      "private equity", "venture", "ventures", "brokerage", "nbfc", "credit union", "payments",
    ],
  },
  {
    sector: "healthcare",
    names: [
      "pfizer", "moderna", "astrazeneca", "novartis", "roche", "merck", "johnson and johnson",
      "glaxosmithkline", "gsk", "sanofi", "abbott", "bayer", "eli lilly", "amgen", "gilead",
      "sun pharma", "cipla", "dr reddys", "lupin", "zydus", "torrent pharma", "biocon", "glenmark",
      "divis laboratories", "aurobindo pharma", "serum institute of india", "bharat biotech",
      "apollo hospitals", "fortis healthcare", "max healthcare", "manipal hospitals", "aiims",
      "narayana health", "practo", "pharmeasy", "1mg", "medanta", "thyrocare", "dr lal pathlabs",
    ],
    words: [
      "hospital", "hospitals", "clinic", "healthcare", "health care", "medical", "medicare",
      "pharma", "pharmaceutical", "pharmaceuticals", "biotech", "biosciences", "life sciences",
      "diagnostics", "laboratories", "wellness", "therapeutics", "nursing home", "dental",
    ],
  },
  {
    sector: "manufacturing",
    names: [
      "tata motors", "tata steel", "mahindra and mahindra", "maruti suzuki", "hero motocorp",
      "bajaj auto", "tvs motor", "ashok leyland", "eicher motors", "force motors", "escorts kubota",
      "bosch", "siemens", "abb", "schneider electric", "honeywell", "ge", "general electric",
      "caterpillar", "john deere", "3m", "emerson", "rockwell automation", "hitachi", "mitsubishi",
      "toyota", "honda", "hyundai", "volkswagen", "bmw", "mercedes benz", "ford", "general motors",
      "larsen and toubro", "l and t", "thermax", "kirloskar", "cummins", "jsw steel", "hindalco",
      "sail", "bharat forge", "sundram fasteners", "motherson", "boeing", "airbus", "hal",
      "foxconn", "flex", "jabil", "micron", "tsmc", "applied materials",
    ],
    words: [
      "manufacturing", "industries", "industrial", "engineering works", "steel", "cement",
      "automotive", "auto components", "machinery", "equipments", "equipment", "fabrication",
      "foundry", "plastics", "chemicals", "polymers", "textiles", "mills", "aerospace", "defence systems",
    ],
  },
  {
    sector: "consumer",
    names: [
      "unilever", "hindustan unilever", "procter and gamble", "nestle", "pepsico", "coca cola",
      "mondelez", "itc", "britannia", "dabur", "marico", "godrej consumer products", "emami",
      "nykaa", "myntra", "ajio", "bigbasket", "blinkit", "zepto", "dmart", "reliance retail",
      "walmart", "target", "ikea", "decathlon", "nike", "adidas", "puma", "levis", "zara", "hnm",
      "mcdonalds", "starbucks", "dominos", "burger king", "haldirams", "bikanervala",
    ],
    words: [
      "retail", "retailers", "fmcg", "consumer goods", "consumer products", "foods", "beverages",
      "restaurant", "restaurants", "hospitality", "hotels", "resorts", "apparel", "fashion",
      "cosmetics", "supermarket", "stores", "mart", "ecommerce", "e commerce", "brands",
    ],
  },
  {
    sector: "energy",
    names: [
      "reliance industries", "indian oil", "bharat petroleum", "hindustan petroleum", "ongc",
      "gail", "ntpc", "power grid", "coal india", "nhpc", "adani green energy", "adani power",
      "tata power", "jsw energy", "suzlon", "renew power", "shell", "bp", "exxonmobil", "chevron",
      "total energies", "schlumberger", "halliburton", "vestas", "first solar",
    ],
    words: [
      "energy", "power", "petroleum", "oil and gas", "refinery", "solar", "wind", "renewables",
      "renewable", "mining", "minerals", "metals", "utilities", "electricity", "gas limited", "hydro",
    ],
  },
  {
    sector: "transport",
    names: [
      "fedex", "dhl", "ups", "maersk", "blue dart", "delhivery", "ecom express", "shadowfax",
      "rivigo", "blackbuck", "vrl logistics", "container corporation", "concor", "gati",
      "indigo", "air india", "spicejet", "vistara", "emirates", "lufthansa", "singapore airlines",
      "indian railways", "irctc", "adani ports", "jsw infrastructure", "flexport", "db schenker",
      "kuehne nagel", "c h robinson", "expeditors",
    ],
    words: [
      "logistics", "freight", "shipping", "transport", "transportation", "courier", "supply chain solutions",
      "airlines", "aviation", "airways", "cargo", "ports", "warehousing", "fulfilment", "fulfillment",
      "mobility", "railways", "shipyard",
    ],
  },
  {
    sector: "realestate",
    names: [
      "dlf", "godrej properties", "oberoi realty", "prestige group", "brigade group", "sobha",
      "lodha", "macrotech developers", "hiranandani", "embassy group", "rmz", "nobroker",
      "housing com", "magicbricks", "99acres", "jll", "cbre", "colliers", "knight frank", "cushman and wakefield",
      "shapoorji pallonji", "afcons", "gmr", "gvk", "ncc limited",
    ],
    words: [
      "real estate", "realty", "realtors", "properties", "property", "builders", "developers",
      "construction", "infrastructure", "infra", "housing", "estates", "architects", "interiors",
    ],
  },
  {
    sector: "media",
    names: [
      "disney", "warner bros", "paramount", "universal", "hbo", "bbc", "cnn", "reuters",
      "the new york times", "the guardian", "bloomberg", "the times of india", "hindustan times",
      "the hindu", "ndtv", "india today", "network18", "zee entertainment", "star india",
      "sony pictures", "yash raj films", "dharma productions", "saregama", "t series",
      "ogilvy", "wpp", "publicis", "dentsu", "havas", "leo burnett", "mccann", "vml",
    ],
    words: [
      "media", "entertainment", "broadcasting", "television", "studios", "productions", "publishing",
      "films", "pictures", "music", "records", "advertising", "creative agency", "communications agency",
      "news", "magazine", "gaming", "animation",
    ],
  },
  {
    sector: "education",
    names: [
      "harvard university", "stanford university", "mit", "oxford university", "cambridge university",
      "iit", "iim", "nit", "bits pilani", "vit", "manipal university", "amity university",
      "delhi university", "jawaharlal nehru university", "ashoka university", "isb",
      "byjus learning", "vedantu", "physics wallah", "coursera", "udemy", "edx", "khan academy",
      "whitehat jr", "cuemath", "upgrad", "simplilearn", "scaler", "newton school",
    ],
    words: [
      "university", "college", "institute of technology", "school", "schools", "academy",
      "education", "educational", "edtech", "learning", "coaching", "gurukul", "vidyalaya",
      "polytechnic", "campus", "institute of management",
    ],
  },
  {
    sector: "public",
    names: [
      "united nations", "unicef", "world bank", "world health organization", "unesco", "undp",
      "niti aayog", "reserve bank of india", "isro", "drdo", "csir", "icar", "ministry of finance",
      "government of india", "indian army", "indian navy", "indian air force", "indian police service",
      "teach for india", "pratham", "smile foundation", "goonj", "akshaya patra", "cry",
      "bill and melinda gates foundation", "azim premji foundation", "tata trusts",
    ],
    words: [
      "government", "ministry", "municipal", "corporation of india", "public sector", "nagar nigam",
      "foundation", "trust", "ngo", "non profit", "nonprofit", "charitable", "welfare",
      "development agency", "council", "commission", "authority", "bureau", "department of",
    ],
  },
  {
    sector: "professional",
    names: [
      "mckinsey and company", "boston consulting group", "bain and company", "deloitte", "pwc",
      "pricewaterhousecoopers", "ey", "ernst and young", "kpmg", "accenture", "capgemini",
      "zs associates", "kearney", "oliver wyman", "roland berger", "alvarez and marsal",
      "grant thornton", "bdo", "rsm", "protiviti", "korn ferry", "mercer", "aon", "willis towers watson",
      "randstad", "adecco", "manpowergroup", "michael page", "robert half", "naukri", "linkedin",
      "cyril amarchand mangaldas", "shardul amarchand mangaldas", "khaitan and co", "trilegal", "azb and partners",
    ],
    words: [
      "consulting", "consultancy", "advisory", "associates", "and partners", "llp", "chartered accountants",
      "law firm", "legal services", "recruitment", "staffing", "talent solutions", "hr services",
      "outsourcing", "bpo", "kpo", "shared services", "audit", "professional services",
    ],
  },
];

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(pvt|private|ltd|limited|inc|incorporated|llc|corp|corporation|co|company|group|holdings|plc|gmbh|sa|bv|nv)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export interface SectorResult {
  sector: SectorId | null;
  /** What in the company name decided it. Empty when nothing did. */
  evidence: string;
}

/**
 * Works out the broad sector from where someone works. Returns null rather than
 * guessing, so an unrecognised employer stays unclassified instead of becoming
 * a sector the data does not support.
 */
export function classifySector(company: string): SectorResult {
  const name = normalise(company);
  if (!name) return { sector: null, evidence: "" };

  for (const rule of RULES) {
    for (const known of rule.names ?? []) {
      const n = normalise(known);
      if (name === n || name.startsWith(`${n} `) || name.endsWith(` ${n}`) || name.includes(` ${n} `)) {
        return { sector: rule.sector, evidence: `Employer "${company}" is a known ${SECTOR_LABEL[rule.sector]} company` };
      }
    }
  }

  for (const rule of RULES) {
    for (const word of rule.words ?? []) {
      if (name.includes(word.trim())) {
        return { sector: rule.sector, evidence: `Employer name contains "${word.trim()}"` };
      }
    }
  }

  return { sector: null, evidence: "" };
}

export function sectorLabel(id: string | null): string {
  return id && id in SECTOR_LABEL ? SECTOR_LABEL[id as SectorId] : "Sector not stated";
}
