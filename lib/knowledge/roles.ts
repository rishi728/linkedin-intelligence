// The role side of the knowledge repository: seventeen buckets, six sections in
// each, and the detailed roles underneath them.
//
// This file is data, not logic. It is the single place role knowledge lives, so
// filters, search, discovery, Data Health and the import pipeline all read the
// same tree rather than keeping their own copies of it.
//
// Aliases are part of a role, not a separate dimension: abbreviations, spelling
// variants and common wordings all hang off the canonical role they mean.

export interface DetailedRole {
  id: string;
  label: string;
  /** Lower-case phrases that mean this role. The label itself is always one. */
  aliases: string[];
  /**
   * True for titles that name a field without naming the job inside it, like a
   * bare "Engineer". They classify, but never with high confidence.
   */
  broad?: boolean;
}

export interface RoleSection {
  id: string;
  label: string;
  roles: DetailedRole[];
}

export interface RoleBucket {
  id: string;
  label: string;
  /** Exactly six, always. */
  sections: RoleSection[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[‘’ʼ'`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** A detailed role. `extra` is a pipe-separated list of other ways people write it. */
const r = (label: string, extra = ""): DetailedRole => ({
  id: slug(label),
  label,
  aliases: [label.toLowerCase().replace(/[‘’ʼ'`]/g, ""), ...extra.split("|").filter(Boolean)],
});

/** A role whose title names the field but not the job. */
const rb = (label: string, extra = ""): DetailedRole => ({ ...r(label, extra), broad: true });

const s = (label: string, roles: DetailedRole[]): RoleSection => ({ id: slug(label), label, roles });
const b = (label: string, sections: RoleSection[]): RoleBucket => ({ id: slug(label), label, sections });

export const ROLE_BUCKETS: RoleBucket[] = [
  b("Technology & Engineering", [
    s("Software & Application", [
      r("Software Engineer", "sde|sde i|sde ii|sde iii|sde 1|sde 2|sde 3|software developer|software development engineer|sw engineer|software engineering|programmer|software programmer|member of technical staff|mts|software craftsman|developer|developer associate"),
      r("Backend Engineer", "backend developer|back end engineer|back end developer|server side engineer|api engineer|java developer|python developer|golang developer|node developer|dotnet developer|.net developer|php developer|ruby developer"),
      r("Frontend Engineer", "frontend developer|front end engineer|front end developer|ui engineer|ui developer|react developer|angular developer|javascript developer|web ui developer"),
      r("Full Stack Engineer", "full stack developer|fullstack engineer|fullstack developer|full-stack developer|mern developer|mean stack developer"),
      r("Web Developer", "website developer|web programmer|wordpress developer|web designer developer"),
      r("Mobile Developer", "mobile engineer|mobile application developer|mobile app developer|app developer|flutter developer|react native developer"),
      r("Android Developer", "android engineer|android application developer|kotlin developer"),
      r("iOS Developer", "ios engineer|swift developer|iphone developer"),
      r("Application Engineer", "applications engineer|application support engineer|application specialist|application developer|applications developer|application programmer"),
      r("Platform Engineer", "platform developer|developer platform engineer|internal platform engineer"),
      r("Systems Engineer", "system engineer|systems software engineer|systems programmer"),
      r("QA Engineer", "quality assurance engineer|qa analyst|quality analyst|qa tester|software tester|quality assurance analyst"),
      r("Test Engineer", "testing engineer|sdet|software development engineer in test|manual test engineer"),
      r("Automation Test Engineer", "test automation engineer|automation engineer|automation qa|selenium engineer"),
      r("Release Engineer", "release manager|release management engineer"),
      r("Build Engineer", "build and release engineer|ci cd engineer"),
      r("Developer Advocate", "developer relations|devrel|developer evangelist|developer experience engineer|community engineer"),
      r("Technical Writer", "documentation engineer|technical author|technical documentation specialist|content engineer"),
    ]),
    s("Infrastructure & Cloud", [
      r("Infrastructure Engineer", "infra engineer|infrastructure developer|systems infrastructure engineer"),
      r("DevOps Engineer", "devops|dev ops engineer|devsecops engineer|platform reliability engineer"),
      r("Site Reliability Engineer", "sre|site reliability engineering|production engineer software"),
      r("Cloud Engineer", "aws engineer|azure engineer|gcp engineer|cloud operations engineer|cloud developer|cloud specialist"),
      r("Network Engineer", "networking engineer|network administrator|network specialist|noc engineer"),
      r("Database Administrator", "dba|database admin|oracle dba|sql dba"),
      r("Database Engineer", "database developer|sql developer|database specialist"),
    ]),
    s("Cybersecurity & IT", [
      r("Security Engineer", "information security engineer|infosec engineer|cyber security engineer"),
      r("Cybersecurity Engineer", "cyber security specialist|cybersecurity specialist|cyber engineer"),
      r("Security Analyst", "information security analyst|infosec analyst|cyber security analyst|threat analyst"),
      r("Security Architect", "cyber security architect|information security architect"),
      r("Application Security Engineer", "appsec engineer|product security engineer|application security analyst"),
      r("Cloud Security Engineer", "cloud security specialist|cloud security analyst"),
      r("SOC Analyst", "security operations centre analyst|security operations center analyst|soc engineer"),
      r("Penetration Tester", "pentester|pen tester|offensive security engineer|red team engineer"),
      r("Ethical Hacker", "certified ethical hacker|bug bounty hunter"),
      r("Security Consultant", "cyber security consultant|information security consultant"),
      r("GRC Security", "grc analyst|security grc|governance risk and compliance security|it grc"),
      r("CISO", "chief information security officer|head of information security|head of security"),
      r("IT Engineer", "information technology engineer|it systems engineer|it specialist|it analyst|it executive technology"),
      r("IT Administrator", "it admin|system administrator|systems administrator|sysadmin|windows administrator|linux administrator"),
      r("IT Support", "it support engineer|it helpdesk|help desk|service desk|desktop support|it executive"),
      r("Technical Support Engineer", "technical support specialist|product support engineer|support engineer"),
    ]),
    s("Core Engineering", [
      r("Mechanical Engineer", "mechanical engineering|mech engineer|design engineer mechanical"),
      r("Electrical Engineer", "electrical engineering|electrical design engineer"),
      r("Electronics Engineer", "electronics engineering|electronics and communication engineer|ece engineer"),
      r("Civil Engineer", "civil engineering|site engineer|construction engineer"),
      r("Chemical Engineer", "chemical engineering|chemical process engineer"),
      r("Mechatronics Engineer", "mechatronics engineering"),
      r("Industrial Engineer", "industrial engineering|ie engineer"),
      r("Manufacturing Engineer", "manufacturing engineering|production support engineer"),
      r("Production Engineer", "production engineering|production executive|shop floor engineer"),
      r("Process Engineer", "process engineering|process improvement engineer"),
      r("Plant Engineer", "plant engineering|plant head engineer"),
      r("Maintenance Engineer", "maintenance engineering|maintenance executive"),
      r("Reliability Engineer", "reliability engineering|asset reliability engineer"),
      r("Quality Engineer", "quality engineering|quality control engineer|qc engineer|quality assurance engineer manufacturing|supplier quality engineer"),
      r("Automotive Engineer", "automobile engineer|vehicle engineer"),
      r("Aerospace Engineer", "aeronautical engineer|avionics engineer"),
      r("Robotics Engineer", "robotics engineering|automation robotics engineer"),
      r("Controls Engineer", "control systems engineer|control engineer|plc engineer"),
      r("Instrumentation Engineer", "instrumentation and control engineer|c and i engineer"),
      r("Structural Engineer", "structural engineering|structural design engineer"),
      r("Environmental Engineer", "environmental engineering|ehs engineer|hse engineer"),
      r("Energy Engineer", "energy engineering|renewable energy engineer|solar engineer"),
      r("Petroleum Engineer", "oil and gas engineer|drilling engineer|reservoir engineer"),
      r("Marine Engineer", "marine engineering|naval engineer"),
      r("Biomedical Engineer", "biomedical engineering|medical device engineer"),
      r("CAD Engineer", "cad designer|catia engineer|solidworks engineer"),
      r("Design Engineer", "design engineering|product design engineer mechanical|tool design engineer"),
      r("Graduate Engineer Trainee", "graduate engineering trainee|get trainee|graduate engineer|engineer trainee|trainee engineer|apprentice engineer|engineering trainee"),
      rb("Engineer", "associate engineer|deputy engineer|assistant engineer|junior engineer|site engineer general"),
    ]),
    s("Hardware & Electronics", [
      r("Embedded Engineer", "embedded systems engineer|embedded software engineer|embedded developer"),
      r("Firmware Engineer", "firmware developer|firmware design engineer"),
      r("FPGA Engineer", "fpga design engineer|rtl design engineer"),
      r("VLSI Engineer", "vlsi design engineer|physical design engineer|asic engineer|semiconductor engineer"),
      r("Hardware Engineer", "hardware design engineer|pcb design engineer|board design engineer"),
      r("Analog Design Engineer", "analog engineer|analogue design engineer|mixed signal engineer"),
      r("Hardware Architect", "hardware systems architect|silicon architect"),
    ]),
    s("Engineering Leadership & Architecture", [
      r("Engineering Manager", "software engineering manager|development manager|technical manager|em|technical lead|tech lead|team lead engineering|module lead"),
      r("Director of Engineering", "engineering director|head of engineering"),
      r("VP Engineering", "vice president engineering|vp of engineering|svp engineering"),
      r("CTO", "chief technology officer|chief technical officer"),
      r("Software Architect", "application architect|principal architect"),
      r("Technical Architect", "tech architect|technology architect|integration architect"),
      r("Systems Architect", "system architect|infrastructure architect"),
      r("Solutions Architect", "solution architect|presales architect technical"),
      r("Enterprise Architect", "enterprise solutions architect"),
      r("Cloud Architect", "aws architect|azure architect|gcp architect|cloud solutions architect"),
    ]),
  ]),

  b("Data & AI", [
    s("Data & Analytics", [
      r("Data Analyst", "data analytics|analytics analyst|reporting analyst|mis analyst|mis executive|insights analyst"),
      r("Analytics Manager", "head of analytics|analytics lead|data analytics manager"),
      r("Data Manager", "head of data|data lead|director of data"),
      r("Quantitative Analyst", "quant analyst|quant researcher|quantitative researcher"),
      r("Decision Scientist", "decision science analyst"),
      r("Operations Research Analyst", "operations research scientist|or analyst"),
      r("Statistician", "biostatistician|statistical analyst"),
      r("Data Governance Analyst", "data governance specialist|data governance manager"),
      r("Data Quality Analyst", "data quality specialist|data quality engineer"),
      r("Data Steward", "data stewardship analyst"),
      r("Data Product Analyst", "product data analyst"),
    ]),
    s("Business Intelligence", [
      r("Business Intelligence Analyst", "bi analyst|business intelligence developer|bi developer|business intelligence engineer|bi engineer"),
      r("BI Manager", "business intelligence manager|head of business intelligence"),
      r("Power BI Developer", "powerbi developer|power bi analyst"),
      r("Tableau Developer", "tableau analyst|tableau consultant"),
      r("Reporting Analyst", "reporting specialist|reporting manager"),
      r("Data Visualisation Specialist", "data visualization specialist|dashboard developer"),
    ]),
    s("Data Engineering", [
      r("Data Engineer", "big data engineer|data engineering|spark engineer|hadoop engineer"),
      r("Analytics Engineer", "dbt engineer|analytics engineering"),
      r("Data Architect", "data solutions architect|enterprise data architect"),
      r("Data Warehouse Engineer", "data warehouse developer|dwh engineer|etl developer|etl engineer"),
      r("Data Platform Engineer", "data infrastructure engineer|data platform developer"),
      r("Data Operations Engineer", "dataops engineer|data operations analyst"),
    ]),
    s("Machine Learning", [
      r("Machine Learning Engineer", "ml engineer|mle|machine learning developer|ml developer|machine learning"),
      r("Machine Learning Scientist", "ml scientist"),
      r("Deep Learning Engineer", "deep learning scientist|neural network engineer"),
      r("NLP Engineer", "natural language processing engineer|nlp scientist"),
      r("Computer Vision Engineer", "computer vision scientist|cv engineer|image processing engineer"),
      r("MLOps Engineer", "ml ops engineer|ml platform engineer|ml infrastructure engineer"),
      r("Robotics AI Engineer", "robotics machine learning engineer|perception engineer"),
    ]),
    s("Generative AI", [
      r("Generative AI Engineer", "genai engineer|gen ai engineer|generative ai developer|genai developer|generative ai|gen ai|genai"),
      r("LLM Engineer", "large language model engineer|llm developer"),
      r("Prompt Engineer", "prompt engineering specialist"),
      r("AI Engineer", "artificial intelligence engineer|ai developer|ai ml engineer|ai ml developer"),
      r("AI Solutions Architect", "ai architect|ai solution architect"),
      r("AI Consultant", "artificial intelligence consultant|ai specialist|ai strategist"),
    ]),
    s("AI Research & Applied Science", [
      r("AI Researcher", "artificial intelligence researcher|ai research engineer|ml researcher|machine learning researcher"),
      r("Applied Scientist", "applied research scientist|applied ml scientist"),
      r("Research Scientist AI", "research scientist machine learning|ai research scientist"),
      r("AI Safety Researcher", "ai alignment researcher|responsible ai researcher"),
      r("Data Scientist", "data science|senior data scientist lead|data scientist analytics"),
      r("AI Infrastructure Engineer", "ai platform engineer|gpu infrastructure engineer"),
    ]),
  ]),

  b("Product & Design", [
    s("Product Management", [
      r("Product Manager", "pm product|product management|technical product manager|tpm product|platform product manager|b2b product manager|b2c product manager"),
      r("Associate Product Manager", "apm|assistant product manager|junior product manager"),
      r("Group Product Manager", "gpm"),
      r("Principal Product Manager", "staff product manager"),
      r("Product Owner", "po product|scrum product owner"),
      r("Growth Product Manager", "product manager growth"),
      r("AI Product Manager", "product manager ai|ml product manager|product manager machine learning|data product manager"),
    ]),
    s("Product Strategy & Operations", [
      r("Product Lead", "lead product manager|head of product"),
      r("Product Director", "director of product|director product management"),
      r("VP Product", "vice president product|vp of product"),
      r("Chief Product Officer", "cpo"),
      r("Product Strategist", "product strategy manager|product strategy"),
      r("Product Operations", "product operations manager|product ops|product operations analyst"),
      r("Product Analyst", "product insights analyst"),
    ]),
    s("UX / UI", [
      r("UX Designer", "user experience designer|ux ui designer|ui ux designer"),
      r("UI Designer", "user interface designer|visual ui designer"),
      r("Interaction Designer", "ixd designer|interactive designer"),
      r("Experience Designer", "xd designer|digital experience designer"),
      r("Service Designer", "service design lead"),
      r("Information Architect", "information architecture specialist"),
    ]),
    s("Product Design", [
      r("Product Designer", "senior product designer lead|digital product designer"),
      r("Visual Designer", "visual design specialist"),
      r("Design Systems Designer", "design system designer|design systems lead"),
      r("Creative Designer", "creative design specialist"),
      r("Industrial Designer", "product industrial designer"),
      r("Graphic Designer Product", "graphic designer digital product"),
    ]),
    s("User Research", [
      r("UX Researcher", "user experience researcher|ux research lead"),
      r("User Researcher", "user research specialist"),
      r("Design Researcher", "design research lead"),
      r("Usability Analyst", "usability researcher|usability specialist"),
      r("Research Operations", "research ops|researchops specialist"),
      r("Behavioural Researcher", "behavioral researcher|behavioural design researcher"),
    ]),
    s("Design Leadership", [
      r("Design Lead", "lead designer|principal designer"),
      r("Design Manager", "manager of design|design team manager"),
      r("Design Director", "director of design|head of design"),
      r("VP Design", "vice president design|vp of design"),
      r("Chief Design Officer", "cdo design"),
      r("Creative Director Product", "creative director digital"),
    ]),
  ]),

  b("Business & Consulting", [
    s("Management Consulting", [
      r("Management Consultant", "management consulting|consultant management"),
      r("Strategy Consultant", "strategy consulting|consultant strategy"),
      r("Business Consultant", "business consulting|business advisor"),
      r("Technology Consultant", "it consultant|digital consultant|technical consultant|technology consulting|erp consultant|sap consultant|salesforce consultant"),
      r("Operations Consultant", "operations consulting|process consultant"),
      r("Associate Consultant", "consultant associate|analyst consultant|business analyst consulting"),
      r("Senior Consultant", "consultant senior|principal consultant|lead consultant"),
      r("Engagement Manager", "project leader consulting|case team leader"),
      r("Partner", "managing partner|senior partner|associate partner|consulting partner"),
      r("Consultant", "advisory consultant|independent consultant|freelance consultant"),
    ]),
    s("Strategy & Corporate Development", [
      r("Strategy Analyst", "analyst strategy|strategic analyst"),
      r("Strategy Associate", "associate strategy"),
      r("Strategy Manager", "manager strategy|head of strategy|strategy lead"),
      r("Corporate Strategy", "corporate strategy manager|corporate strategy analyst|strategic planning"),
      r("Business Strategy", "business strategy manager|commercial strategy|growth strategy|revenue strategy"),
      r("Corporate Development", "corp dev|corporate development manager|corporate development associate"),
    ]),
    s("Business Analysis & Advisory", [
      r("Business Analyst", "ba business analyst|senior business analyst|functional analyst|business systems analyst"),
      r("Business Advisor", "business advisory|advisory manager"),
      r("Risk Consultant", "risk advisory consultant|risk advisory"),
      r("Financial Consultant", "finance consultant|financial advisory consultant"),
      r("Process Analyst", "business process analyst|process excellence analyst"),
      r("Requirements Analyst", "functional consultant|systems analyst business"),
    ]),
    s("Founder's Office & Chief of Staff", [
      r("Founder's Office", "founders office|founder office|office of the founder|founders office associate"),
      r("Founder's Associate", "founder associate|founders associate|associate to the founder|associate to founder"),
      r("Chief of Staff", "chief of staff to founder|chief of staff to ceo|chief of staff to the ceo|cos"),
      r("Office of the CEO", "ceo office|office of ceo|executive office|ceos office"),
      r("Executive Associate", "associate to the ceo|executive business partner|business associate to founder"),
    ]),
    s("Transformation & Special Projects", [
      r("Transformation Consultant", "business transformation consultant|digital transformation consultant"),
      r("Transformation Manager", "business transformation manager|transformation lead|digital transformation manager"),
      r("Special Projects", "special projects manager|special projects lead"),
      r("Strategic Initiatives", "strategic initiatives manager|strategic initiatives lead"),
      r("Executive Projects", "executive projects manager"),
      r("Change Manager", "change management consultant|organisational change manager|organizational change manager"),
    ]),
    s("Business Leadership", [
      r("Chief Executive Officer", "ceo|managing director|president|country head|country manager|business head|general manager|gm"),
      r("Chief Operating Officer", "coo"),
      r("Chief Strategy Officer", "cso strategy"),
      r("Executive Director", "non executive director"),
      r("Board Member", "board director|independent director|board observer|chairman|chairperson"),
      r("Advisor", "adviser|strategic advisor|board advisor|advisory board member|startup advisor"),
    ]),
  ]),

  b("Sales & Business Development", [
    s("Sales", [
      r("Sales Executive", "sales officer|sales representative|sales rep|sales associate|sales professional"),
      r("Account Executive", "ae sales|enterprise account executive|corporate account executive"),
      r("Inside Sales", "inside sales executive|inside sales representative|inside sales manager"),
      r("Field Sales", "field sales executive|field sales officer|direct sales|territory sales|area sales"),
      r("Enterprise Sales", "b2b sales|enterprise sales manager|corporate sales|institutional sales"),
      r("Retail Sales", "b2c sales|showroom sales|counter sales"),
      r("Channel Sales", "channel sales manager|distribution sales|dealer sales"),
      r("Sales Manager", "regional sales manager|national sales manager|zonal sales manager|area sales manager|branch sales manager"),
      r("Head of Sales", "sales head|sales director|director of sales|vp sales|vice president sales|chief revenue officer|cro"),
    ]),
    s("Account Management", [
      r("Account Manager", "client account manager|account management"),
      r("Key Account Manager", "kam|major account manager"),
      r("Strategic Account Manager", "strategic account executive|global account manager"),
      r("National Account Manager", "regional account manager"),
      r("Account Director", "group account director|account lead"),
      r("Commercial Manager", "commercial executive|commercial lead"),
    ]),
    s("Business Development", [
      r("Business Development Manager", "bdm|business development lead|bd manager"),
      r("Business Development Executive", "bde|business development officer|business development associate"),
      r("Business Development Representative", "bdr|sales development representative|sdr"),
      r("Head of Business Development", "business development director|vp business development|director of business development"),
      r("Growth Manager Sales", "growth executive sales"),
      r("Market Development Manager", "new market development"),
    ]),
    s("Partnerships & Alliances", [
      r("Partnerships Manager", "partnership manager|partner manager|partnerships lead"),
      r("Strategic Partnerships", "strategic partnerships manager|head of partnerships"),
      r("Alliances Manager", "alliance manager|strategic alliances"),
      r("Channel Partnerships", "channel partner manager|partner development manager"),
      r("Partner Success Manager", "partner account manager"),
      r("Ecosystem Manager", "ecosystem partnerships"),
    ]),
    s("Solutions / Pre-Sales", [
      r("Sales Engineer", "technical sales engineer|sales engineering"),
      r("Pre-Sales Engineer", "presales engineer|pre sales engineer|presales specialist"),
      r("Solutions Consultant", "solution consultant|presales consultant|pre sales consultant"),
      r("Solutions Engineer", "solution engineer|customer engineer presales"),
      r("Technical Account Executive", "technical sales manager"),
      r("Bid Manager", "proposal manager|tender manager"),
    ]),
    s("Revenue Operations", [
      r("Revenue Operations", "revops|revenue operations manager|revenue ops"),
      r("Sales Operations", "sales ops|sales operations manager|sales operations analyst"),
      r("Sales Enablement", "sales enablement manager|sales trainer"),
      r("Deal Desk Analyst", "deal desk manager|pricing analyst sales"),
      r("CRM Manager Sales", "salesforce administrator sales"),
      r("Sales Analyst", "sales mis analyst|sales performance analyst"),
    ]),
  ]),

  b("Marketing & Growth", [
    s("Brand & Marketing", [
      r("Marketing Manager", "marketing lead|marketing management"),
      r("Marketing Executive", "marketing officer|marketing associate|marketing coordinator"),
      r("Marketing Analyst", "marketing insights analyst|market research analyst"),
      r("Brand Manager", "assistant brand manager|senior brand manager"),
      r("Brand Strategist", "brand strategy|brand planner"),
      r("Head of Marketing", "marketing director|director of marketing|vp marketing|vice president marketing|cmo|chief marketing officer"),
    ]),
    s("Product Marketing", [
      r("Product Marketing Manager", "pmm|product marketing lead"),
      r("Product Marketing", "product marketing specialist|product marketing associate"),
      r("Go To Market Manager", "gtm manager|go-to-market lead"),
      r("Competitive Intelligence Analyst", "market intelligence analyst"),
      r("Category Marketing Manager", "category manager marketing"),
      r("Solutions Marketing Manager", "industry marketing manager"),
    ]),
    s("Growth & Performance", [
      r("Growth Manager", "growth lead|head of growth"),
      r("Growth Marketer", "growth marketing|growth marketing manager|growth hacker"),
      r("Performance Marketing", "performance marketing manager|paid media|paid marketing|ppc specialist|sem specialist"),
      r("Digital Marketing", "digital marketing manager|digital marketing executive|digital marketer|online marketing"),
      r("Demand Generation", "demand gen manager|demand generation manager|lead generation manager"),
      r("Lifecycle Marketing", "crm marketing|email marketing|retention marketing|marketing automation"),
    ]),
    s("Content & SEO", [
      r("Content Marketing", "content marketing manager|content marketer"),
      r("Content Strategist", "content strategy lead|content lead"),
      r("SEO Specialist", "seo executive|seo analyst|search engine optimisation specialist|search engine optimization specialist"),
      r("SEO Manager", "head of seo|organic growth manager"),
      r("Copywriter Marketing", "marketing copywriter|content writer marketing"),
      r("Editorial Marketing Manager", "blog manager"),
    ]),
    s("Community & Social", [
      r("Social Media Manager", "social media executive|social media specialist"),
      r("Social Media Strategist", "social media lead|head of social"),
      r("Community Manager", "community lead|head of community|community growth"),
      r("Influencer Marketing", "influencer marketing manager|creator partnerships"),
      r("Affiliate Marketing", "affiliate manager|partnership marketing"),
      r("Events Marketing", "event marketing manager|field marketing manager"),
    ]),
    s("Communications / PR", [
      r("Communications Manager", "communications lead|marketing communications|marcom manager"),
      r("Corporate Communications", "corporate communications manager|internal communications"),
      r("Public Relations", "pr manager|pr executive|public relations manager|publicist"),
      r("Media Relations", "media relations manager|press relations"),
      r("Head of Communications", "communications director|vp communications|chief communications officer"),
      r("Content Communications Specialist", "communications specialist|communications associate"),
    ]),
  ]),

  b("Finance & Investment", [
    s("Corporate Finance", [
      r("Financial Analyst", "finance analyst|financial analysis|business finance analyst"),
      r("Finance Manager", "manager finance|finance lead"),
      r("FP&A Analyst", "fpanda analyst|financial planning and analysis analyst|fp and a analyst"),
      r("FP&A Manager", "financial planning and analysis manager|fp and a manager|financial planning manager"),
      r("Corporate Finance", "corporate finance manager|corporate finance analyst"),
      r("Finance Director", "head of finance|director of finance|cfo|chief financial officer|finance head|vp finance"),
    ]),
    s("Accounting / Audit / Tax", [
      r("Accountant", "senior accountant|junior accountant|accounts executive|accounts officer|staff accountant|chartered accountant"),
      r("Financial Controller", "controller|finance controller|group controller"),
      r("Auditor", "internal auditor|external auditor|audit associate|audit assistant|statutory auditor"),
      r("Audit Manager", "internal audit manager|audit senior"),
      r("Tax Analyst", "tax associate|tax consultant|tax executive"),
      r("Tax Manager", "head of tax|direct tax manager|indirect tax manager|gst manager"),
    ]),
    s("Banking", [
      r("Investment Banker", "investment banking|ib analyst|investment banking analyst|investment banking associate"),
      r("Relationship Manager Banking", "bank relationship manager|branch relationship manager"),
      r("Credit Analyst", "credit risk analyst|credit appraisal"),
      r("Credit Manager", "head of credit|credit officer"),
      r("Treasury", "treasury analyst|treasury manager|treasury operations"),
      r("Retail Banking Officer", "branch manager banking|personal banker|bank officer"),
    ]),
    s("Investment & Markets", [
      r("Equity Research Analyst", "equity research associate|research analyst equity|sell side analyst"),
      r("Portfolio Manager", "fund manager|asset manager|investment manager"),
      r("Wealth Manager", "wealth management|private banker|financial advisor|financial planner"),
      r("Investment Analyst", "buy side analyst|investment associate"),
      r("Trader", "equity trader|derivatives trader|proprietary trader|dealer markets"),
      r("Investor Relations", "investor relations manager|ir manager"),
    ]),
    s("Private Equity / Venture Capital", [
      r("Private Equity Associate", "pe associate|private equity analyst|private equity investor"),
      r("Venture Capital Associate", "vc associate|venture capital analyst|venture capital investor"),
      r("Angel Investor", "seed investor|individual investor"),
      r("Investment Principal", "principal venture capital|principal private equity"),
      r("Venture Partner Investing", "general partner|limited partner|managing director investments"),
      r("M&A", "mergers and acquisitions|m and a analyst|m and a associate|corporate development finance"),
    ]),
    s("Risk / Insurance / Financial Services", [
      r("Risk Analyst", "risk management analyst|market risk analyst|operational risk analyst"),
      r("Risk Manager", "head of risk|risk management manager|chief risk officer"),
      r("Actuary", "actuarial analyst|actuarial consultant"),
      r("Insurance Analyst", "insurance executive|insurance advisor|claims analyst"),
      r("Underwriter", "underwriting manager|insurance underwriter"),
      r("Financial Operations", "finance operations|accounts payable|accounts receivable|payroll specialist|billing specialist"),
    ]),
  ]),

  b("Operations & Supply Chain", [
    s("Business Operations", [
      r("Business Operations", "business operations manager|biz ops|bizops|business ops"),
      r("Business Operations Analyst", "business operations associate|operations analyst"),
      r("Strategy & Operations", "strategy and operations manager|strategy and operations associate|s and o manager"),
      r("Revenue Operations Ops", "growth operations manager"),
      r("Operations Associate", "operations executive|operations officer|operations coordinator"),
      r("Chief of Operations", "head of business operations|director of business operations"),
    ]),
    s("Operations Management", [
      r("Operations Manager", "manager operations|ops manager|operations lead"),
      r("Head of Operations", "operations director|director of operations|vp operations|coo operations"),
      r("Process Manager", "process excellence manager|continuous improvement manager|operational excellence manager|six sigma black belt"),
      r("Service Operations", "service operations manager|support operations manager"),
      r("Facilities Manager", "facility manager|admin manager|administration manager"),
      r("Executive Assistant", "executive secretary|personal assistant|ea to director"),
      r("Workforce Manager", "workforce management|capacity planner"),
    ]),
    s("Program / Project Management", [
      r("Project Manager", "project management|project lead|it project manager|construction project manager"),
      r("Program Manager", "programme manager|program management|technical program manager|program associate|programme associate|program officer corporate"),
      r("PMO", "pmo manager|pmo analyst|project management office|pmo lead"),
      r("Delivery Manager", "service delivery manager|delivery lead|engagement delivery manager"),
      r("Implementation Manager", "implementation lead|deployment manager"),
      r("Scrum Master", "agile coach|agile delivery lead"),
    ]),
    s("Supply Chain", [
      r("Supply Chain Manager", "supply chain lead|scm manager|head of supply chain"),
      r("Supply Chain Analyst", "supply chain executive|supply chain associate"),
      r("Supply Chain Planner", "supply planner|demand planner|production planner|sandop planner"),
      r("Supply Chain Director", "vp supply chain|director supply chain"),
      r("Materials Manager", "materials planning manager|stores manager|store keeper"),
      r("Inventory Manager", "inventory analyst|inventory control manager"),
    ]),
    s("Procurement / Sourcing", [
      r("Procurement Manager", "purchase manager|purchasing manager|head of procurement"),
      r("Procurement Analyst", "procurement executive|purchase executive|buyer"),
      r("Strategic Sourcing", "sourcing manager|sourcing specialist|global sourcing"),
      r("Vendor Manager", "vendor management|supplier relationship manager|supplier manager|supplier development"),
      r("Category Manager", "category buyer|category sourcing manager"),
      r("Contracts Procurement", "contract sourcing specialist"),
    ]),
    s("Logistics / Planning", [
      r("Logistics Manager", "logistics lead|head of logistics"),
      r("Logistics Analyst", "logistics executive|logistics coordinator"),
      r("Transportation Manager", "transport manager|fleet manager"),
      r("Warehouse Manager", "warehouse executive|warehouse supervisor"),
      r("Distribution Manager", "distribution executive|dispatch manager"),
      r("Fulfillment Manager", "fulfilment manager|last mile manager|order management"),
    ]),
  ]),

  b("People & Talent", [
    s("Human Resources", [
      r("HR Manager", "human resources manager|hr lead|manager human resources"),
      r("HR Executive", "human resources executive|hr officer|hr associate|hr generalist|hr assistant|human resources professional|hr professional"),
      r("HR Business Partner", "hrbp|people partner|human resources business partner"),
      r("HR Operations", "human resources operations|hr shared services|hr ops"),
      r("Chief People Officer", "chro|head of hr|hr director|director human resources|vp human resources|vp people"),
      r("HR Analyst", "people analytics|hr analytics|workforce planning analyst"),
    ]),
    s("People Operations", [
      r("People Operations", "people ops|people operations manager|people operations associate"),
      r("Employee Experience", "employee experience manager|culture manager|engagement manager people"),
      r("Employee Relations", "employee relations manager|industrial relations|ir manager people"),
      r("HR Systems Analyst", "hris analyst|workday analyst|hr technology"),
      r("Onboarding Specialist People", "employee onboarding specialist"),
      r("Workplace Manager", "office manager|workplace experience"),
    ]),
    s("Talent Management", [
      r("Talent Manager", "talent management|talent management specialist"),
      r("Talent Development", "talent development manager|career development manager"),
      r("Organizational Development", "organisational development|od specialist|od manager"),
      r("Performance Manager People", "performance management specialist"),
      r("Succession Planning Specialist", "talent planning specialist"),
      r("Head of Talent", "talent director|vp talent"),
    ]),
    s("Learning & Development", [
      r("Learning & Development", "l and d|learning and development manager|lnd manager|learning and development specialist"),
      r("Training Manager", "corporate trainer|training and development manager"),
      r("Instructional Designer Corporate", "learning designer|learning experience designer"),
      r("Capability Manager", "capability building manager"),
      r("Leadership Coach", "executive coach|leadership development manager"),
      r("Learning Consultant", "learning advisor"),
    ]),
    s("Compensation / Employee Experience", [
      r("Compensation & Benefits", "comp and ben|compensation and benefits manager|compensation analyst"),
      r("Total Rewards", "total rewards manager|rewards specialist"),
      r("Payroll Manager", "payroll specialist people|payroll executive"),
      r("Benefits Administrator", "benefits specialist"),
      r("HR Compliance Specialist", "labour compliance specialist|labor compliance specialist"),
      r("Wellbeing Manager", "wellness manager|employee wellbeing"),
    ]),
    s("Recruitment", [
      r("Recruiter", "recruitment executive|recruitment officer|recruitment specialist|hiring specialist"),
      r("Technical Recruiter", "tech recruiter|it recruiter|technology recruiter|technical recruitment specialist"),
      r("Corporate Recruiter", "in house recruiter|internal recruiter"),
      r("Campus Recruiter", "university recruiter|graduate recruiter"),
      r("Talent Acquisition Specialist", "talent acquisition|ta specialist|talent acquisition partner|talent acquisition executive|talent acquisition associate"),
      r("Talent Acquisition Manager", "head of talent acquisition|ta manager|recruitment manager|recruitment lead|talent acquisition lead"),
      r("Talent Sourcer", "sourcing specialist recruitment|sourcer"),
      r("Executive Recruiter", "executive search consultant|headhunter|search consultant"),
      r("Recruitment Consultant", "staffing consultant|staffing specialist|placement consultant"),
    ]),
  ]),

  b("Founders & Entrepreneurship", [
    s("Startup Founders", [
      r("Founder", "founder and ceo|founder ceo|startup founder|fundador|fondateur"),
      r("Founder & CTO", "founder cto|technical founder|technical co founder"),
      r("Founder & COO", "founder coo"),
      r("Founding Partner", "founding director"),
      r("Founding Member", "founding team|founding team member"),
      r("Building in Stealth", "stealth|stealth startup|building stealth|stealth mode"),
    ]),
    s("Co-Founders", [
      r("Co-Founder", "cofounder|co founder|co-founder and ceo|co founder ceo|co fundador"),
      r("Co-Founder & CTO", "co founder cto"),
      r("Co-Founder & COO", "co founder coo"),
      r("Co-Founder & CPO", "co founder cpo"),
      r("Co-Founder & CMO", "co founder cmo"),
      r("Co-Founder & Director", "co founder and director"),
    ]),
    s("Entrepreneurship", [
      r("Entrepreneur", "serial entrepreneur|solopreneur|indie hacker|technopreneur|agripreneur|edupreneur"),
      r("Self Employed", "self-employed|freelancer|independent professional|independent contractor"),
      r("Entrepreneur in Residence", "eir|entrepreneur-in-residence"),
      r("Startup Advisor", "startup mentor"),
      r("Solo Founder", "one person startup"),
      r("Side Project Builder", "maker|creator of"),
    ]),
    s("Startup Operators", [
      r("Startup Operator", "operator startup|early stage operator"),
      r("Founding Engineer", "first engineer|founding software engineer"),
      r("Early Employee", "first employee|employee number one"),
      r("Startup Generalist", "generalist startup"),
      r("Head of Everything", "jack of all trades startup"),
      r("Startup Partner", "startup collaborator"),
    ]),
    s("Venture Building", [
      r("Venture Builder", "startup builder|venture studio|company builder"),
      r("Venture Partner", "venture advisor"),
      r("Incubator Manager", "accelerator manager|incubation manager"),
      r("Startup Community Builder", "ecosystem builder startup"),
      r("Venture Analyst", "venture scout"),
      r("Portfolio Support", "platform partner venture"),
    ]),
    s("Business Owners / Promoters", [
      r("Business Owner", "owner|co owner|company owner|small business owner|family business owner|shop owner"),
      r("Proprietor", "sole proprietor|proprietorship"),
      r("Promoter", "promoter director"),
      r("Franchise Owner", "franchisee"),
      r("Director Owner", "managing proprietor"),
      r("Partner Firm Owner", "partner in firm"),
    ]),
  ]),

  b("Research & Science", [
    s("Academic Research", [
      r("Research Assistant", "research intern|student researcher"),
      r("Research Associate", "senior research associate"),
      r("Research Fellow", "senior research fellow|junior research fellow|jrf|srf"),
      r("Postdoctoral Researcher", "postdoc|post doctoral researcher|post doc"),
      r("PhD Researcher", "doctoral researcher|phd student|phd scholar|research scholar|doctoral candidate"),
      r("Research Professor", "professor of research"),
    ]),
    s("Scientific Research", [
      r("Scientist", "senior scientist|principal scientist|staff scientist|scientist b|scientist c"),
      r("Research Scientist", "research scientist laboratory"),
      r("Computational Scientist", "scientific computing|computational researcher"),
      r("Laboratory Researcher", "lab researcher|lab scientist|laboratory scientist"),
      r("Materials Scientist", "chemist researcher|physicist researcher"),
      r("Scientific Researcher", "researcher science"),
    ]),
    s("Research Engineering", [
      r("Research Engineer", "research and development engineer"),
      r("Simulation Engineer", "modelling engineer|modeling engineer|cae engineer"),
      r("Prototype Engineer", "experimental engineer"),
      r("Instrumentation Researcher", "test and research engineer"),
      r("Research Software Engineer", "scientific software engineer"),
      r("Innovation Engineer", "advanced engineering researcher"),
    ]),
    s("R&D", [
      r("R&D Engineer", "rand d engineer|research and development"),
      r("R&D Scientist", "rand d scientist"),
      r("R&D Manager", "rand d manager|head of rand d|research and development manager"),
      r("Product Development Researcher", "new product development researcher"),
      r("Innovation Manager", "innovation lead|head of innovation"),
      r("Technology Scout", "technology research analyst"),
    ]),
    s("Research Management", [
      r("Research Manager", "research lead|head of research"),
      r("Research Director", "director of research|vp research"),
      r("Principal Investigator", "pi research"),
      r("Research Program Manager", "research programme manager"),
      r("Grants Manager", "research grants officer"),
      r("Research Operations Manager", "lab manager"),
    ]),
    s("Applied Research", [
      r("Applied Researcher", "applied research engineer"),
      r("Research Analyst", "research associate analyst|secondary research analyst"),
      r("Market Researcher", "market research executive|consumer researcher|market analyst|market research analyst"),
      r("Policy Researcher", "research consultant policy"),
      r("Clinical Researcher", "clinical research coordinator"),
      rb("Researcher", "research professional"),
    ]),
  ]),

  b("Education & Academia", [
    s("Teaching", [
      r("Teacher", "school teacher|primary teacher|secondary teacher|pgt|tgt|prt|subject teacher"),
      r("Instructor", "course instructor|technical instructor"),
      r("Tutor", "private tutor|home tutor|online tutor"),
      r("Teaching Assistant", "ta teaching|graduate teaching assistant"),
      r("Subject Matter Expert Education", "academic expert|content expert education"),
      r("Educator", "education professional"),
    ]),
    s("University / Faculty", [
      r("Professor", "full professor|senior professor"),
      r("Assistant Professor", "asst professor|assistant prof"),
      r("Associate Professor", "assoc professor"),
      r("Lecturer", "senior lecturer|guest lecturer"),
      r("Visiting Professor", "adjunct professor|visiting faculty|adjunct faculty"),
      r("Faculty", "faculty member|teaching faculty"),
    ]),
    s("Academic Leadership", [
      r("Dean", "associate dean|dean of students|academic dean"),
      r("Principal", "school principal|college principal|vice principal"),
      r("Head of Department", "hod|department head academic"),
      r("Academic Director", "director of academics|academic head"),
      r("Vice Chancellor", "pro vice chancellor|registrar university"),
      r("Director of Studies", "programme director academic|program director academic"),
    ]),
    s("Academic Administration", [
      r("Academic Administrator", "academic administration|education administrator"),
      r("Academic Coordinator", "academic counsellor|academic counselor|academic advisor"),
      r("Admissions Officer", "admissions counsellor|admissions counselor|admissions manager"),
      r("Student Affairs", "student services|student success manager"),
      r("Education Manager", "education operations manager"),
      r("Placement Officer", "training and placement officer|career services|placement coordinator|placement associate|training and placement associate|training and placement"),
    ]),
    s("Curriculum / Instruction", [
      r("Curriculum Designer", "curriculum developer|curriculum specialist"),
      r("Instructional Designer", "instructional design specialist|learning content designer"),
      r("Content Developer Education", "academic content developer|educational content writer"),
      r("Assessment Specialist", "examination officer|evaluation specialist"),
      r("EdTech Educator", "edtech specialist|education technologist"),
      r("Programme Coordinator Education", "program coordinator education"),
    ]),
    s("Training / Coaching", [
      r("Trainer", "soft skills trainer|technical trainer|faculty trainer"),
      r("Coach", "life coach|career coach|performance coach"),
      r("Career Counsellor", "career counselor|career advisor|career guidance"),
      r("Education Consultant", "education advisor|admissions consultant"),
      r("Mentor", "student mentor|industry mentor"),
      r("Workshop Facilitator", "facilitator training"),
    ]),
  ]),

  b("Healthcare & Life Sciences", [
    s("Medicine", [
      r("Doctor", "physician|medical doctor|md doctor|mbbs|general practitioner|resident doctor|junior resident|senior resident"),
      r("Surgeon", "consultant surgeon|orthopaedic surgeon|orthopedic surgeon|neurosurgeon|cardiac surgeon"),
      r("Dentist", "dental surgeon|bds"),
      r("Consultant Physician", "specialist doctor|medical consultant|cardiologist|radiologist|paediatrician|pediatrician|dermatologist|psychiatrist"),
      r("Medical Officer", "chief medical officer|duty medical officer|cmo medical"),
      r("Veterinarian", "veterinary doctor|vet"),
    ]),
    s("Nursing / Allied Health", [
      r("Nurse", "staff nurse|registered nurse|nursing officer|icu nurse"),
      r("Nursing Manager", "nursing superintendent|head nurse|matron"),
      r("Physiotherapist", "physical therapist|physiotherapy"),
      r("Occupational Therapist", "occupational therapy|speech therapist"),
      r("Psychologist", "clinical psychologist|counselling psychologist|counseling psychologist|therapist"),
      r("Dietitian", "nutritionist|clinical nutritionist|dietician"),
    ]),
    s("Healthcare Management", [
      r("Healthcare Administrator", "hospital administrator|healthcare administration"),
      r("Hospital Manager", "hospital operations manager|healthcare operations"),
      r("Healthcare Consultant", "health consultant|healthcare advisory"),
      r("Clinic Manager", "practice manager"),
      r("Health Programme Manager", "health program manager|public health manager"),
      r("Medical Records Manager", "health information manager"),
    ]),
    s("Pharmaceuticals", [
      r("Pharmacist", "clinical pharmacist|hospital pharmacist|registered pharmacist"),
      r("Pharmaceutical Scientist", "formulation scientist|pharma scientist"),
      r("Medical Affairs", "medical advisor|medical science liaison|msl"),
      r("Pharmacovigilance", "drug safety associate|drug safety officer|pv associate"),
      r("Regulatory Affairs Pharma", "regulatory affairs associate pharma|regulatory affairs executive"),
      r("Medical Representative", "pharma sales representative|medical sales representative"),
    ]),
    s("Biotechnology / Life Sciences", [
      r("Biotechnologist", "biotechnology associate|biotech scientist"),
      r("Biologist", "molecular biologist|cell biologist"),
      r("Biochemist", "biochemistry researcher"),
      r("Microbiologist", "microbiology analyst"),
      r("Geneticist", "genomics scientist|genetic analyst"),
      r("Bioinformatician", "bioinformatics analyst|computational biologist"),
    ]),
    s("Clinical / Medical Research", [
      r("Clinical Research Associate", "cra clinical|clinical research executive"),
      r("Clinical Research Scientist", "clinical scientist"),
      r("Clinical Trial Manager", "clinical operations manager|clinical project manager"),
      r("Clinical Data Manager", "clinical data analyst|cdm"),
      r("Biomedical Researcher", "biomedical scientist"),
      r("Epidemiologist", "public health researcher"),
    ]),
  ]),

  b("Legal & Compliance", [
    s("Legal Practice", [
      r("Lawyer", "advocate|attorney|litigator|barrister|solicitor"),
      r("Legal Associate", "associate advocate|junior associate legal|litigation associate"),
      r("Senior Legal Associate", "senior associate legal|principal associate legal"),
      r("Legal Partner", "partner law firm|managing partner law"),
      r("Paralegal", "legal assistant|legal executive"),
      r("Legal Intern", "law intern|legal trainee"),
    ]),
    s("Corporate Legal", [
      r("Legal Counsel", "corporate counsel|in house counsel|assistant general counsel"),
      r("General Counsel", "chief legal officer|head of legal|group general counsel"),
      r("Legal Advisor", "legal consultant|legal advisory"),
      r("Legal Manager", "manager legal|legal lead"),
      r("Legal Director", "director legal|vp legal"),
      r("Company Secretary", "cs company secretary|assistant company secretary"),
    ]),
    s("Contracts", [
      r("Contract Manager", "contracts manager|contract management"),
      r("Contracts Specialist", "contract specialist|contract analyst"),
      r("Contract Administrator", "contracts administrator"),
      r("Commercial Contracts Counsel", "contract counsel"),
      r("Procurement Legal Specialist", "vendor contracts specialist"),
      r("Legal Operations", "legal ops|legal operations manager"),
    ]),
    s("Compliance", [
      r("Compliance Analyst", "compliance associate|compliance executive"),
      r("Compliance Officer", "compliance specialist"),
      r("Compliance Manager", "head of compliance|compliance lead|chief compliance officer"),
      r("AML Analyst", "anti money laundering analyst|aml kyc analyst"),
      r("KYC Analyst", "know your customer analyst|kyc associate|onboarding kyc"),
      r("Ethics & Compliance", "ethics officer|business conduct"),
    ]),
    s("Risk / Regulatory", [
      r("Regulatory Affairs", "regulatory affairs manager|regulatory specialist"),
      r("Regulatory Manager", "head of regulatory|regulatory lead"),
      r("Risk & Compliance", "risk and compliance manager|risk compliance analyst"),
      r("Regulatory Reporting Analyst", "regulatory reporting specialist"),
      r("Licensing Specialist", "permits and licensing"),
      r("Audit Compliance Specialist", "compliance audit specialist"),
    ]),
    s("Privacy / Governance", [
      r("Privacy Specialist", "data privacy specialist|privacy analyst"),
      r("Data Privacy Officer", "dpo|data protection officer"),
      r("Governance Specialist", "governance analyst|governance manager"),
      r("Corporate Governance", "corporate governance manager"),
      r("Information Governance", "records governance specialist"),
      r("Policy Compliance Analyst", "internal policy analyst"),
    ]),
  ]),

  b("Media & Creative", [
    s("Journalism / Editorial", [
      r("Journalist", "senior journalist|multimedia journalist"),
      r("Reporter", "news reporter|field reporter"),
      r("Correspondent", "special correspondent|foreign correspondent"),
      r("Editor", "managing editor|news editor|assistant editor|sub editor|copy editor"),
      r("Editor in Chief", "chief editor|executive editor"),
      r("Columnist", "opinion writer"),
    ]),
    s("Publishing", [
      r("Publisher", "publishing director"),
      r("Publishing Manager", "publishing executive|acquisitions editor"),
      r("Production Editor", "editorial production manager"),
      r("Proofreader", "copy checker"),
      r("Translator", "localisation specialist|localization specialist"),
      r("Literary Agent", "rights manager publishing"),
    ]),
    s("Content", [
      r("Content Creator", "creator|digital creator|youtuber|podcaster"),
      r("Content Writer", "writer|blogger|article writer|seo content writer"),
      r("Copywriter", "senior copywriter|advertising copywriter"),
      r("Scriptwriter", "screenwriter|script writer"),
      r("Author", "book author|published author"),
      r("Newsletter Writer", "newsletter editor"),
    ]),
    s("Advertising", [
      r("Advertising Manager", "advertising executive|ad operations manager"),
      r("Media Planner", "media buyer|media planning manager"),
      r("Account Planner Advertising", "strategic planner advertising"),
      r("Client Servicing Advertising", "account servicing advertising"),
      r("Creative Strategist", "advertising strategist"),
      r("Brand Activation Manager", "below the line manager"),
    ]),
    s("Design / Visual", [
      r("Graphic Designer", "graphics designer|senior graphic designer"),
      r("Illustrator", "digital illustrator"),
      r("Animator", "2d animator|3d animator|motion graphics artist"),
      r("Motion Designer", "motion graphics designer"),
      r("Art Director", "associate art director"),
      r("Creative Director", "executive creative director|chief creative officer"),
    ]),
    s("Film / Music / Creative Arts", [
      r("Producer", "executive producer|film producer|line producer|content producer"),
      r("Director Film", "film director|assistant director film"),
      r("Filmmaker", "cinematographer|director of photography"),
      r("Photographer", "videographer|photo editor"),
      r("Musician", "composer|music producer|singer|instrumentalist"),
      r("Artist", "visual artist|performing artist|fine artist"),
    ]),
  ]),

  b("Public Sector & Social Impact", [
    s("Government", [
      r("Government Officer", "government official|govt officer"),
      r("Civil Servant", "ias officer|ips officer|irs officer|civil services"),
      r("Administrative Officer", "district officer|block officer|section officer"),
      r("Revenue Officer", "tax officer government|excise officer"),
      r("Government Advisor", "government consultant|advisor to government"),
      r("Elected Representative", "councillor|member of parliament|mla"),
    ]),
    s("Public Administration", [
      r("Public Administration", "public administrator|public sector administrator"),
      r("Municipal Officer", "urban local body officer|city administrator"),
      r("Public Sector Executive", "psu executive|public sector manager"),
      r("Programme Officer Government", "program officer government|scheme officer"),
      r("Public Works Officer", "public works engineer"),
      r("Statistical Officer", "government statistician"),
    ]),
    s("Defence / Foreign Service", [
      r("Defence Personnel", "defense personnel|armed forces|indian army|indian navy|indian air force"),
      r("Military Officer", "army officer|naval officer|air force officer|commissioned officer"),
      r("Diplomat", "foreign service officer|ambassador|consular officer"),
      r("Veteran", "ex servicemen|retired defence officer"),
      r("Security Forces Officer", "paramilitary officer|police officer"),
      r("Defence Analyst", "strategic affairs analyst"),
    ]),
    s("Public Policy", [
      r("Policy Analyst", "public policy analyst|policy researcher government"),
      r("Policy Advisor", "policy consultant|policy specialist"),
      r("Public Policy", "public policy manager|public policy associate|government relations"),
      r("Legislative Analyst", "parliamentary affairs"),
      r("Regulatory Policy Specialist", "policy and advocacy"),
      r("Think Tank Fellow", "policy fellow"),
    ]),
    s("NGO / Nonprofit", [
      r("NGO Professional", "ngo worker|nonprofit professional|non profit professional"),
      r("NGO Manager", "nonprofit manager|ngo programme manager|ngo program manager"),
      r("Nonprofit Executive", "executive director nonprofit|ngo director"),
      r("Foundation Manager", "grants manager nonprofit|philanthropy manager"),
      r("Fundraising Manager", "donor relations manager|resource mobilisation"),
      r("Volunteer Coordinator", "volunteer manager"),
    ]),
    s("Social Impact / Development", [
      r("Social Impact Manager", "impact manager|social impact lead"),
      r("Social Impact Consultant", "development consultant|impact consultant"),
      r("Development Professional", "development sector specialist|rural development professional"),
      r("Programme Director Impact", "program director impact|programme director development"),
      r("CSR Manager", "csr specialist|corporate social responsibility manager"),
      r("Sustainability Manager", "esg specialist|esg analyst|sustainability consultant|climate specialist"),
    ]),
  ]),

  b("Customer & Client Services", [
    s("Customer Success", [
      r("Customer Success Manager", "csm|customer success lead|client success manager"),
      r("Customer Success Executive", "customer success associate|customer success specialist"),
      r("Head of Customer Success", "director of customer success|vp customer success"),
      r("Customer Onboarding", "onboarding specialist|onboarding manager|customer onboarding manager"),
      r("Customer Advocacy", "customer marketing advocacy"),
      r("Customer Retention", "retention manager|churn manager"),
    ]),
    s("Client Services", [
      r("Client Services Manager", "client servicing manager|client service manager"),
      r("Client Relationship Manager", "relationship manager client|client partner"),
      r("Client Solutions", "client solutions manager|client solutions associate"),
      r("Client Engagement Manager", "engagement manager client"),
      r("Account Coordinator Client", "client coordinator"),
      r("Client Delivery Manager", "client delivery lead"),
    ]),
    s("Customer Experience", [
      r("Customer Experience Manager", "cx manager|customer experience lead"),
      r("Customer Experience Specialist", "cx specialist|customer experience associate"),
      r("Voice of Customer Analyst", "customer insights analyst"),
      r("Customer Operations", "customer ops|customer operations manager"),
      r("Customer Engagement", "customer engagement manager"),
      r("Service Quality Analyst", "quality analyst customer service"),
    ]),
    s("Customer Support", [
      r("Customer Support", "customer support executive|customer service executive|customer care executive|customer support associate"),
      r("Customer Support Manager", "customer service manager|support manager|customer care manager"),
      r("Customer Support Specialist", "customer service representative|csr support|helpdesk executive"),
      r("Team Lead Support", "customer support team lead|support supervisor"),
      r("Escalations Manager", "complaints manager"),
      r("Contact Centre Manager", "contact center manager|call centre manager|call center manager"),
    ]),
    s("Technical Account Management", [
      r("Technical Account Manager", "tam|technical account management"),
      r("Technical Customer Success Manager", "technical csm"),
      r("Implementation Specialist", "implementation consultant|implementation analyst"),
      r("Solutions Delivery Consultant", "technical delivery consultant"),
      r("Integration Specialist", "customer integration engineer"),
      r("Technical Success Engineer", "customer success engineer"),
    ]),
    s("Professional / Client Services", [
      r("Professional Services", "professional services manager|professional services consultant"),
      r("Service Manager", "service lead|service operations lead"),
      r("Service Delivery", "service delivery lead|service delivery executive"),
      r("Customer Education", "customer training specialist|customer enablement"),
      r("Managed Services Manager", "managed services lead"),
      r("Consulting Services Manager", "client consulting manager"),
    ]),
  ]),
];

export const BUCKET_MAP = new Map(ROLE_BUCKETS.map((x) => [x.id, x]));

export interface RolePath {
  bucketId: string;
  bucketLabel: string;
  sectionId: string;
  sectionLabel: string;
  roleId: string;
  roleLabel: string;
}

/** Every detailed role, flattened, with the path that leads to it. */
export const ROLE_INDEX: RolePath[] = ROLE_BUCKETS.flatMap((bucket) =>
  bucket.sections.flatMap((section) =>
    section.roles.map((role) => ({
      bucketId: bucket.id,
      bucketLabel: bucket.label,
      sectionId: section.id,
      sectionLabel: section.label,
      roleId: role.id,
      roleLabel: role.label,
    })),
  ),
);

export const ROLE_PATH = new Map(ROLE_INDEX.map((p) => [p.roleId, p]));

export function bucketLabel(id: string): string {
  return BUCKET_MAP.get(id)?.label ?? "Role not stated";
}

export function sectionLabel(bucketId: string, sectionId: string): string {
  return BUCKET_MAP.get(bucketId)?.sections.find((x) => x.id === sectionId)?.label ?? "";
}

export function roleLabel(id: string): string {
  return ROLE_PATH.get(id)?.roleLabel ?? "";
}
