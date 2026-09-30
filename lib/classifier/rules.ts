// The title and company rules, ported from classify_v3.py and classify_v4.py.
//
// Each title rule adds its weight to a category when it matches: 5 is decisive,
// 3 to 4 strong, 2 moderate, 1 to 1.5 weak. Nothing here reads seniority: a
// Director is a Director of something, and the something is what decides.
//
// V4 drops every one of V3's Founders rules and replaces them with explicit
// founder, owner and C-suite language, which is why those are listed separately
// below rather than edited in place.

import { BIZ, DATA, EDU, FIN, FOUND, OPS, PROD, SALES, STUD, TECH } from "./categories";

export interface TitleRule {
  rx: RegExp;
  cat: string;
  fam: string;
  w: number;
}

const r = (pattern: string, cat: string, fam: string, w: number): TitleRule => ({
  rx: new RegExp(pattern, "i"),
  cat,
  fam,
  w,
});

/** V3's rules, minus every Founders rule, which V4 replaces wholesale. */
const V3_RULES: TitleRule[] = [
  // ---- Data & AI
  r(String.raw`\bdata (scien|analy|engineer|ecosystem|architect|platform|steward|govern|product)`, DATA, "Data Science & Analytics", 5),
  r(String.raw`\b(machine learning|deep learning|ml|mlops|genai|gen ai|generative|llm|nlp|computer vision|artificial intelligence)\b`, DATA, "AI / ML", 4),
  r(String.raw`\bai\b`, DATA, "AI / ML", 3),
  r(String.raw`\b(ml|ai) (engineer|scientist|researcher|developer)\b`, DATA, "AI / ML", 5),
  r(String.raw`\b(analytics|data|business intelligence|bi)\b`, DATA, "Data Science & Analytics", 3),
  r(String.raw`\bdecision (science|scientist)`, DATA, "Data Science & Analytics", 4),
  r(String.raw`\bapplied scientist\b`, DATA, "AI / ML", 4),
  r(String.raw`\b(statistician|data\s?base|dba)\b`, DATA, "Data Science & Analytics", 5),
  r(String.raw`\b(system|systems|network|it|server|linux|cloud) administrator\b|\bsysadmin\b`, TECH, "Software Engineering", 5),
  r(String.raw`\bautomation (engineer|analyst|specialist)`, TECH, "Software Engineering", 2),
  r(String.raw`\b(smart contract|blockchain|web3)\b`, TECH, "Software Engineering", 4),

  // ---- Product & Design
  r(String.raw`\b(associate )?product (manag|owner|lead|head|analyst|executive|strateg|operations|marketing manager|director|specialist|leader)`, PROD, "Product Management", 5),
  r(String.raw`\b(apm|gpm|cpo)\b`, PROD, "Product Management", 5),
  r(String.raw`\bproduct\b`, PROD, "Product Management", 2),
  r(String.raw`\b(ux|ui|ui/ux|user experience|user research|interaction design|visual design|graphic|experience design|creative director|art director|illustrator|animator|motion design|industrial design|product design|designer)\b`, PROD, "Design / UX", 4),
  r(String.raw`\bdesign (lead|head|manager|director|intern|researcher)`, PROD, "Design / UX", 3),
  r(String.raw`\bdesign\b`, PROD, "Design / UX", 1),

  // ---- Sales & Marketing
  r(String.raw`\b(sales|marketing|brand|growth|gtm|go[- ]to[- ]market|seo|sem|performance marketing|social media|copywrit|advertis|merchandis|e-?commerce|category (manag|lead|head|analyst|executive)|customer success|account (executive|manager|director|management)|client (partner|success|servic|relations)|business development|bd\b|partnerships?|demand generation|lead generation|inside sales|key account|channel|retail|content (creator|strateg|market|writer|lead|manager)|community manager|influencer)`, SALES, "Sales / Marketing", 4),
  r(String.raw`\b(content|editorial|writer|journalist|communications?|public relations|pr|media|storytell|podcast|newsletter)\b`, SALES, "Content / Communications", 3),
  r(String.raw`\bsales engineer`, SALES, "Sales / Marketing", 6),
  r(String.raw`\b(customer|consumer|category)\b`, SALES, "Sales / Marketing", 1.5),

  // ---- Operations & Supply Chain
  r(String.raw`\b(supply chain|supply|logistic|procurement|sourcing|purchas|warehous|inventory|fulfil?lment|distribution|transportation|demand planning|s&op|vendor|import|export|fleet|dispatch|last mile)`, OPS, "Operations / Supply Chain", 4),
  r(String.raw`\bproduct supply`, OPS, "Operations / Supply Chain", 6),
  r(String.raw`\b(operations?|ops|manufacturing|plant|production (manager|planner|head|lead|control|supervisor)|planner|planning (manager|officer|analyst|executive|lead)|lean|six sigma|continuous improvement|process (excellence|improvement|manager|analyst)|quality (manager|assurance|control|head|analyst)|business excellence|program(me)? delivery|delivery (manager|head|lead))\b`, OPS, "Operations / Supply Chain", 3),
  r(String.raw`\bproject (manager|management|coordinator|lead|officer|executive|controls)`, OPS, "Project Management", 1.5),
  r(String.raw`\b(programme?|pmo) (manager|management|lead|office)`, OPS, "Project Management", 1),
  r(String.raw`\bair traffic`, OPS, "Operations / Supply Chain", 4),

  // ---- Finance & Investment
  r(String.raw`\b(trader|trading|equity|equities|quant|quantitative (analy|research|trad|develop|strateg)|derivativ|portfolio|fund manager|hedge|asset manag|wealth|private equity|venture capital|vc\b|pe\b|investment|investor|invest|banker|banking|treasury|capital markets?|fixed income|forex|fx\b|commodit|credit|underwrit|lending|loan|mortgage|actuar|insurance|risk (analy|manag|associate|consult|officer|head)|market risk|financial|finance|fp&a|accountan|accounting|accounts|audit|taxation|\btax\b|ipo|m&a|mergers|valuation|fintech|cfa|chartered accountant|\bca\b|investor relations)`, FIN, "Finance / Investment", 4),
  r(String.raw`\b(financial (market|analy)|equity (research|trader|analyst|sales)|research analyst.*(equity|market|credit))`, FIN, "Finance / Investment", 6),
  r(String.raw`\bquantitative (researcher|research|analyst|developer|trader)\b|\bquant\b`, FIN, "Finance / Investment", 6),
  r(String.raw`\brisk\b`, FIN, "Finance / Investment", 3),
  r(String.raw`\b(cfo|chief financial)`, FIN, "Finance / Investment", 6),
  r(String.raw`\b(corporate finance|corporate banking|investment bank)`, FIN, "Finance / Investment", 6),
  r(String.raw`\b(family office|angel|startup investments?)\b`, FIN, "Finance / Investment", 4),

  // ---- Business & Consulting
  r(String.raw`\b(consult|strateg|advisory|advisor|adviser|management consult|business analyst|business (partner|operations|strategy|transformation|consult)|engagement (manager|lead)|transformation|case team|freelance)`, BIZ, "Consulting / Strategy", 4),
  r(String.raw`\b(recruit|talent|hr\b|human resources|people (operations|partner|team|and culture)|hiring|headhunt|staffing|campus hiring|learning and development|l&d|onboarding|employer brand)`, BIZ, "Recruiting / HR", 5),
  r(String.raw`\b(legal|advocate|lawyer|counsel|attorney|paralegal|compliance|company secretary|regulatory|policy|public policy)`, BIZ, "Legal / Policy", 4),
  r(String.raw`\b(executive (assistant|secretary)|personal assistant|office (manager|administrator)|administrative|receptionist)`, BIZ, "Admin / Business Support", 5),
  r(String.raw`\b(sustainability|esg|csr|impact|social enterprise|ngo|non[- ]?profit|philanthrop)`, BIZ, "Sustainability / Impact", 2),
  r(String.raw`\b(business (manager|associate|executive|lead|head|owner)|management associate|management trainee|business management)\b`, BIZ, "Business / Management", 2),

  // ---- Technology & Engineering
  r(String.raw`\b(software|sde|sde ?[1-3iI]+|swe|developer|programmer|full[- ]?stack|front[- ]?end|back[- ]?end|web develop|mobile develop|android|ios|devops|sre|cloud|cyber|security|devsecops|qa\b|sdet|test (engineer|automation)|site reliability|platform engineer|(it|cloud|network|digital|data center) infrastructure|infrastructure (engineer|architect|analyst)|network(ing)? (engineer|admin|architect)|sysadmin|it (manager|analyst|support|consult|specialist|services|infrastructure|engineer)|information technology|erp|sap\b|salesforce|technical (lead|architect|analyst|consultant|program|manager|staff|specialist|support|account)|member of technical staff|mts\b|solutions? (architect|engineer)|enterprise architect|technology|tech lead|tech\b|embedded|firmware|vlsi|rtl|asic|fpga|semiconductor|silicon|hardware|analog|digital design|verification|robotic|mechatronic|iot)`, TECH, "Software Engineering", 4),
  r(String.raw`\b(engineer|engineering|engg|engr)\b`, TECH, "Core Engineering", 2),
  r(String.raw`\b(mechanical|civil|electrical|electronics?|chemical|aerospace|aeronautic|automotive|powertrain|propulsion|reservoir|petroleum|drilling|subsea|offshore|maintenance|industrial engineer|production engineer|process engineer|quality engineer|systems? engineer|r&d engineer|design engineer|manufacturing engineer|structural|thermal|cfd|fea|cae|cad|hvac|metallurg|materials?|optical|photonic|battery|ev\b|vehicle|control(s)? (engineer|system)|instrumentation|reliability|geotechnical|geolog|mining|energy engineer|naval|marine|piping|commissioning|turbine|boiler|refinery|wireless|rf\b|antenna|signal processing|power (systems|electronics|engineer))`, TECH, "Core Engineering", 4),
  r(String.raw`\b(graduate|junior|assistant|probationary|apprentice|trainee)? ?engineer( officer)?\b`, TECH, "Core Engineering", 2),
  r(String.raw`\b(engineering apprentice|apprentice engineer|graduate engineer|engineer trainee|engineering trainee|\bget\b|dget|pget|gate)\b`, TECH, "Core Engineering", 3),
  r(String.raw`\b(cto|chief technology|vp (of )?engineering|head of engineering|engineering (manager|director|head|lead))\b`, TECH, "Engineering Leadership", 4),
  r(String.raw`\b(r&d engineer|research and development engineer|design engineer|product engineer|application engineer|applications engineer|implementation engineer|field engineer|service engineer|project engineer|site engineer|process engineer|quality engineer|test engineer|validation engineer|systems engineer|hardware engineer)\b`, TECH, "Core Engineering", 5),

  // ---- Education, Research & Science
  r(String.raw`\b(professor|lecturer|faculty|teaching|teacher|tutor|instructor|dean|academic|postdoc|post[- ]doctoral|phd|ph\.d|doctoral|scholar|fellow|research(er)?|scientist|r&d|laborator|lab (assistant|manager|technician)|principal investigator|curator|librarian|educator|coach)`, EDU, "Education / Research", 3),
  r(String.raw`\bresearch (scientist|engineer|analyst|associate|assistant|intern|fellow|project|programme|program|officer|lead|manager|executive|graduate|student|staff)`, EDU, "Education / Research", 5),
  r(String.raw`\b(phd|ph\.d|doctoral|doctorate)\b`, EDU, "Education / Research", 5),
  r(String.raw`\b(teaching assistant|ta\b|visiting|adjunct|guest faculty)`, EDU, "Education / Research", 6),
  r(String.raw`\bscientist\b`, EDU, "Education / Research", 3),
  r(String.raw`\b(chemist|physicist|biologist|biotech|pharma|clinical|geneticist|microbiolog|mathematic|statistic)\w*`, EDU, "Education / Research", 3),

  // ---- Student & Community
  r(String.raw`\b(student|secretary|member|volunteer|ambassador|mentor|captain|core team|core member|council|society|alumni|club|cell\b|contributor|organi[sz]er|convener|coordinator|treasurer|representative|rep\b|delegate|ismp|squad|buddy|campus|placement (coordinator|associate|team)|outreach|events?\b|committee|senator|cadet|scout|ncc|nss|fresher|graduate)`, STUD, "Student / Community", 2),
  r(String.raw`\b(undergraduate|undergrad|bachelors?|masters?|b\.?tech|m\.?tech|mba|pgdm|pursuing|btech|mtech)\b`, STUD, "Student / Community", 3),
  r(String.raw`\b(student|volunteer|ambassador|secretary|captain|treasurer|convener|senator|cadet|core member|executive member|club|committee|ismp)\b`, STUD, "Student / Community", 3),
];

/** V4's replacements, plus the extras V5 adds after its audit. */
const V4_RULES: TitleRule[] = [
  r(String.raw`\b(founder|co[- ]?founder|cofounder|founding (team|engineer|member|partner|team member)|entrepreneur|proprietor|self[- ]employed|owner|founders? office|venture builder)\b`, FOUND, "Founder / Entrepreneur", 5),
  r(String.raw`\b(ceo|chief executive|managing director|md\b|coo|chief operating|chairman|managing partner|cxo|president & ceo)\b`, FOUND, "Executive Leadership (C-suite)", 4),
  r(String.raw`\bchief of staff\b|\bcorporate development\b|\bcorp dev\b|\bbusiness unit (head|lead|leader)\b`, FOUND, "Executive Leadership (C-suite)", 5),
  r(String.raw`\b(cmo|chief marketing)\b`, SALES, "Sales / Marketing", 5),
  r(String.raw`\b(cpo|chief product)\b`, PROD, "Product Management", 5),
  r(String.raw`\b(cdo|chief data|chief ai|chief analytics)\b`, DATA, "Data Science & Analytics", 5),
  r(String.raw`\b(chief (people|human)|chro)\b`, BIZ, "Recruiting / HR", 5),
  r(String.raw`(?<!vice )(?<!vice-)(?<!associate )\bpresident\b`, FOUND, "Executive Leadership (C-suite)", 3),
  r(String.raw`\bpartner\b`, FOUND, "Executive Leadership (C-suite)", 1.5),

  r(String.raw`\b(trainer|facilitator|author|journal reviewer|reviewer|subject matter expert|sme|geoscientist|geophysic|educator|curriculum)\b`, EDU, "Education / Research", 3),
  r(String.raw`\b(ingenieur|ingeniero|ingénieur|ingegnere|qualit[aä]tsingenieur)\w*`, TECH, "Core Engineering", 5),
  r(String.raw`\brevenue (manager|analyst|management)\b`, SALES, "Sales / Marketing", 3),
  r(String.raw`\b(market analyst|market trainee|international market)\b`, FIN, "Finance / Investment", 1.5),

  // V5's own additions
  r(String.raw`\b(scientific|nurs(e|ing)|medical|doctor|physician|surgeon|dentist|pharmacist|therapist|psycholog\w*)\b`, EDU, "Education / Research", 3),
  r(String.raw`\b(civil engineer|structural engineer|site supervisor|supervisor|technician|electrician|machinist|operator)\b`, TECH, "Core Engineering", 3),
];

export const RULES: TitleRule[] = [...V3_RULES, ...V4_RULES];

// ---------------------------------------------------------------------------
// Company context, checked in order; the first match wins.

export interface CompanyRule {
  rx: RegExp;
  cat: string;
  name: string;
}

const c = (pattern: string, cat: string, name: string): CompanyRule => ({ rx: new RegExp(pattern, "i"), cat, name });

/** Types precise enough to be worth a full vote when a title says nothing. */
export const PRECISE = new Set(["consulting firm", "finance firm", "academic/research institution", "data/AI company"]);

export const COMPANY_RULES: CompanyRule[] = [
  // V4 inserts these two ahead of everything else.
  c(String.raw`\b(amarchand|mangaldas|wadia|khaitan|trilegal|shardul|azb\b|law firm|advocates|solicitors|llp\b)`, BIZ, "consulting firm"),
  c(String.raw`(j\.? ?p\.? ?morgan|chryscapital|templeton|futures first|nuvama|edelweiss|motilal|iifl|jio financial|okcredit|bharatpe|jupiter money|smallcase|upstox|dezerv|squarepoint|optiver|akuna|hudson river|de shaw)`, FIN, "finance firm"),

  c(String.raw`\b(mckinsey|boston consulting|\bbcg\b|\bbain\b|deloitte|\bey\b|ernst|ey-parthenon|pwc|pricewaterhouse|kpmg|accenture|\bzs\b|zs associates|kearney|oliver wyman|roland berger|strategy&|alvarez|fti consulting|grant thornton|l\.?e\.?k|mercer|aon\b|nielsen|gartner|forrester|arthur d\.? little|simon-kucher|dalberg|redseer|praxis|evalueserve|inductis|tiger analytics|fractal|mu sigma|latentview|bridgei2i|exl\b|wns\b|genpact|consult|advisory|advisors)`, BIZ, "consulting firm"),
  c(String.raw`\b(fractal|mu sigma|tiger analytics|latentview|bridgei2i|sigmoid|tredence|analytics vidhya|databricks|snowflake|palantir|datarobot|dataiku|sas institute)\b`, DATA, "data/AI company"),
  c(String.raw`\b(goldman|jp ?morgan|jpmorgan|morgan stanley|citi(group|bank)?|deutsche|wells fargo|american express|barclays|hsbc|\bubs\b|credit suisse|nomura|jefferies|blackrock|state street|bnp|standard chartered|icici|hdfc|axis bank|sbi\b|state bank|kotak|yes bank|idfc|indusind|bajaj (finance|finserv)|worldquant|citadel|jane street|two sigma|d\.? ?e\.? shaw|tower research|graviton|quadeye|optiver|imc\b|flow traders|millennium|point72|bank|capital|invest|asset manag|securities|equity|ventures|fund\b|insurance|assurance|financial|finance|finserv|wealth|broking|brokerage|nse\b|bse\b|sebi|rbi\b|nabard|sidbi|visa\b|mastercard|paypal|stripe|razorpay|phonepe|paytm|zerodha|groww|cred\b|fintech|lending|credit|trading|sequoia|accel\b|matrix partners|elevation|lightspeed|blume|peak xv|tiger global|softbank|kalaari)`, FIN, "finance firm"),
  c(String.raw`\b(indian institute|\biit\b|\bnit\b|\biim\b|iisc|\biiit\b|\bbits\b|insead|\bisb\b|university|college|school|institute of|academy|universit|nit warangal|national institute|nptel|coursera|byju|unacademy|physics wallah|vedantu|upgrad|great learning|edtech|research (institute|centre|center|lab)|cern|isro|drdo|csir|nasa|max planck|mit\b|stanford|harvard|oxford|cambridge|eth |epfl|nus\b|ntu\b)`, EDU, "academic/research institution"),
  c(String.raw`\b(bharat petroleum|bpcl|ioc\b|indian oil|hpcl|ongc|exxon|shell|bp\b|chevron|reliance|tata (steel|motors|power|chemicals)|l&t|larsen|mahindra|bosch|siemens|abb\b|schneider|honeywell|ge\b|general electric|maruti|hyundai|toyota|ford|gm\b|volvo|cummins|caterpillar|john deere|tvs|hero motocorp|bajaj auto|ashok leyland|eicher|hindalco|jsw|vedanta|adani|ultratech|ambuja|ntpc|bhel|hal\b|bel\b|drdo|schlumberger|halliburton|baker hughes|saint-gobain|3m\b|dow\b|basf|asian paints|pidilite|godrej|whirlpool|havells|crompton|jindal|jsp|steel|petroleum|oil and|natural gas|\bgas\b|gail|fertili[sz]er|petrochem|pharma|cipla|novartis|sun pharma|cement|textile|industries|refiner|chemicals|\bsteel|cables|refractor|power|energy|motors|automotive|aerospace|aviation|airlines?|indigo|air india|vistara|spicejet|railways?|shipping|maersk|dhl|fedex|blue dart|delhivery|ecom express|xpressbees|shadowfax|dp world|adani ports)`, TECH, "manufacturing/energy/industrial"),
  c(String.raw`\b(procter|p&g|hindustan unilever|hul\b|unilever|nestle|nestlé|itc\b|pepsico|coca[- ]cola|colgate|mondelez|l'?oréal|loreal|dabur|marico|britannia|reckitt|mars\b|kellogg|danone|diageo|pernod|godrej consumer|tata consumer|asian paints|nykaa|myntra|lenskart|mamaearth|boat\b|meesho|zomato|swiggy|blinkit|zepto|bigbasket|dmart|avenue supermarts|walmart|target\b|nike|adidas|puma|titan)`, SALES, "consumer/FMCG/retail"),
  c(String.raw`\b(google|alphabet|microsoft|amazon|aws\b|meta\b|facebook|apple\b|oracle|qualcomm|texas instruments|intel\b|nvidia|amd\b|adobe|salesforce|sap\b|ibm\b|cisco|samsung|uber|ola\b|flipkart|sprinklr|atlassian|tcs\b|tata consultancy|infosys|wipro|hcl|cognizant|tech mahindra|capgemini|lti|mindtree|zoho|freshworks|postman|browserstack|thoughtworks|epam|globant|cred\b|dream11|mpl\b|unacademy|servicenow|workday|vmware|dell|hp\b|lenovo|broadcom|marvell|micron|synopsys|cadence|mediatek|arm\b|tesla|rivian|openai|anthropic|deepmind|tech|software|systems|labs|semiconductor|micro|digital|cloud|computing|solutions|technolog|infotech|networks|robotics|ai\b|innovations)`, TECH, "technology company"),
];

/** Student societies, fests and campus bodies. A president here is a student. */
export const CLUB_RX = new RegExp(
  String.raw`\b(club|cell|society|chapter|council|committee|senate|fest|e-?cell|180 degrees|180dc|rotaract|rotary|aiesec|nss|ncc|gymkhana|student (mentor|body|program|chapter|association|council)|entrepreneurship|ieee|acm|sae|siam|iste|team [a-z]+|community|association|union|forum|students'?|ambassador program|mentorship program|placement|ccpd|career planning|opc|hult prize|enactus|mun\b|debating|literary|cultural|sports|nit[a-z ,]*warangal.*(cell|club|team)|technical (team|society)|robotics (team|club)|racing|baja|formula|aavhan|mood indigo|techfest|tech fest|spring fest|kshitij|devcom|trust lab|open source|community of|coders|developers? (student )?club)\b`,
  "i",
);

/** Words that describe a level, not a job. Stripped before the role is compared. */
export const SENIORITY = new Set(
  `senior sr jr junior associate assistant asst deputy principal staff lead head vice president vp avp svp evp
director manager mgr executive analyst specialist officer intern internship trainee graduate summer winter fresher apprentice
general chief global regional india apac emea the of and at for in to a an ii iii iv i 1 2 3 team member group new level
professional expert advanced additional overall key trainee gm dgm agm probationary`
    .split(/\s+/)
    .filter(Boolean),
);

/** What to call a title that names a level and nothing else. */
export const GENERIC_FAMILY: Array<[RegExp, string]> = [
  [/\bintern|internship|trainee|apprentice|fresher/i, "Generic Intern / Trainee"],
  [/\banalyst/i, "Generic Analyst"],
  [/\b(director|head|vp|vice president|avp|svp|evp|general manager|gm\b|chief)/i, "Leadership (function unspecified)"],
  [/\bmanager|mgr/i, "Generic Manager"],
  [/\bassociate/i, "Generic Associate"],
  [/\bexecutive|officer|specialist|coordinator|assistant/i, "Generic Executive / Officer"],
];

/** A campus role word, used when the employer is an institution but not a club. */
export const CAMPUS_ROLE_RX =
  /\b(member|secretary|mentor|ambassador|volunteer|captain|coordinator|student|intern|trainee|representative|contributor)\b/i;

export const ACADEMIC_STAFF_RX = /\b(professor|faculty|lecturer|research|scientist|phd|postdoc|teaching)\b/i;
