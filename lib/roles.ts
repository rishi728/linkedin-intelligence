// Domain → Function → Role hierarchy.
//
// Each role is written as "Role label = phrase | phrase | ~phrase".
// The label itself is always a phrase too. Phrases go through the same
// tokenizer as job titles (abbreviations, plurals, stopwords), and the longest
// phrase in a title wins, so "AI Product Manager" beats "Product Manager".
//
// "~phrase" marks an ambiguous abbreviation or campus/government title
// (PM, TA, AM, GET, "Joint Secretary"...). It only counts when the rest of the
// title or the employer already points at the same domain.

import type { CategoryId } from "./taxonomy";

export interface FunctionSpec {
  id: string;
  label: string;
  /** Role label used when the title names this function but no specific role. */
  generalist: string;
  roles: string[];
}

export interface DomainSpec {
  id: string;
  label: string;
  functions: FunctionSpec[];
}

export const DOMAINS: DomainSpec[] = [
  {
    id: "leadership", label: "Leadership & Founders",
    functions: [
      { id: "founders", label: "Founders & Entrepreneurship", generalist: "Entrepreneur", roles: [
        "Founder = founder | founding partner | fundador | fondateur | grunder",
        "Co-Founder = co founder | co fundador | cofundadora",
        "Founder & CEO = founder ceo | co founder ceo | founder chief executive officer | founder managing director",
        "Founder & CTO = founder cto | co founder cto | technical co founder | technical founder",
        "Founder & COO = founder coo | co founder coo | co founder chief operating officer",
        "Entrepreneur = entrepreneur | serial entrepreneur | solopreneur | indie hacker | self employed | freelancer | agripreneur | edupreneur | technopreneur",
        "Business Owner = business owner | owner | co owner | proprietor | shop owner | franchise owner | promoter",
        "Founding Team Member = founding member | founding team | founding team member | early employee",
        "Building in Stealth = stealth | stealth startup | building stealth | building",
      ] },
      { id: "executive-leadership", label: "Executive Leadership", generalist: "Executive", roles: [
        "Chief Executive Officer = ceo | chief executive officer | managing director | md | president | whole time director | country head | country manager | business head | general manager | gm | director general | pdg | geschaftsfuhrer",
        "Chief Technology Officer = cto | chief technology officer | chief technical officer",
        "Chief Operating Officer = coo | chief operating officer",
        "Chief Financial Officer = cfo | chief financial officer",
        "Chief Marketing Officer = cmo | chief marketing officer | chief growth officer | cgo",
        "Chief Product Officer = cpo | chief product officer",
        "Chief Revenue / Business Officer = cro | chief revenue officer | cbo | chief business officer | chief commercial officer | cco",
        "Chief People Officer = chro | chief people officer | chief human resources officer | chief human resource officer",
        "Chief Information / Data Officer = cio | chief information officer | cdo | chief data officer | chief digital officer | ciso | chief information security officer",
        "Chief Strategy Officer = cso | chief strategy officer",
        "Chairperson = chairman | chairperson | chairwoman | vice chairman",
        "Executive Director = executive director | non executive director",
        "CXO = cxo",
      ] },
      { id: "board-advisory", label: "Board & Advisory", generalist: "Advisor", roles: [
        "Board Member = board member | board director | independent director | member board directors | board observer",
        "Advisor = advisor | adviser | strategic advisor | startup advisor | board advisor | advisory board member | senior advisor",
      ] },
    ],
  },
  {
    id: "strategy", label: "Strategy & Consulting",
    functions: [
      { id: "management-consulting", label: "Management Consulting", generalist: "Consultant", roles: [
        "Management Consultant = management consultant | strategy consultant | business consultant | strategy consulting | consultant strategy",
        "Consulting Analyst = consulting analyst | management consulting analyst | business analyst consulting | strategy consulting analyst",
        "Associate Consultant = associate consultant | consulting associate | management consulting associate | associate strategy",
        "Senior Consultant = senior consultant | senior associate consultant | lead consultant | managing consultant",
        "Engagement Manager = engagement manager | project leader consulting | case team leader | case leader",
        "Principal / Partner = associate partner | principal consultant | consulting partner | partner consulting | managing principal",
        "Consultant = consultant | consulting | consultor | berater | independent consultant | freelance consultant",
        "Research Consultant = research consultant",
      ] },
      { id: "corporate-strategy", label: "Corporate Strategy & Development", generalist: "Strategy Professional", roles: [
        "Strategy Manager = strategy manager | strategy lead | head strategy | corporate strategy manager | strategy director | director strategy",
        "Strategy Analyst = strategy analyst | strategy associate | corporate strategy | strategic initiatives | strategic planning analyst | strategy intern",
        "Corporate Development = corporate development | corp dev | corporate development associate | corporate development manager",
        "Transformation Lead = transformation lead | transformation manager | digital transformation | change management",
      ] },
      { id: "business-operations", label: "Business Operations & Founder's Office", generalist: "Business Operations", roles: [
        "Chief of Staff = chief staff | chief staff ceo",
        "Founder's Office = founder office | founders office | office founder | ceo office | office ceo | founder office associate | founder office intern | founder staff",
        "Business Operations = bizops | business operation | strategy operation | strategy and operation | biz ops | business operations associate | business operations manager",
        "Business Analyst = business analyst | senior business analyst | lead business analyst | ~ba | business analysis",
        "Business Manager = business manager | associate business manager | business associate | senior business associate",
      ] },
    ],
  },
  {
    id: "product", label: "Product",
    functions: [
      { id: "product-management", label: "Product Management", generalist: "Product Manager", roles: [
        "Product Manager = product manager | product mgr | product manager ii | product manager 2 | ~pm | ~product",
        "Associate Product Manager = associate product manager | apm | rotational product manager | rpm",
        "Senior Product Manager = senior product manager | senior pm",
        "Lead Product Manager = lead product manager | principal product manager | staff product manager | group product manager | gpm | product lead | head product | director product | vp product | product leader | product head",
        "AI Product Manager = ai product manager | ml product manager | genai product manager | ai pm | product manager ai | product manager machine learning | ai product lead | ai product",
        "Technical Product Manager = technical product manager | platform product manager | data product manager | api product manager",
        "Growth Product Manager = growth product manager | product manager growth",
        "Product Owner = product owner",
        "Product Management Intern = product management intern | product intern | apm intern | pm intern | product manager intern",
      ] },
      { id: "product-operations", label: "Product Operations & Specialists", generalist: "Product Specialist", roles: [
        "Product Operations = product operation | product ops | product operations manager",
        "Product Specialist = product specialist | product consultant | product expert | product associate | product executive",
      ] },
    ],
  },
  {
    id: "design", label: "Design",
    functions: [
      { id: "product-design", label: "Product & UX Design", generalist: "Designer", roles: [
        "Product Designer = product designer | senior product designer | product design",
        "UX / UI Designer = ux designer | ui designer | ui ux designer | ux ui designer | interaction designer | experience designer | user experience designer | user interface designer | web designer",
        "UX Researcher = ux researcher | user researcher | design researcher | user research",
        "Design Lead = design lead | head design | design manager | design director | director design | principal designer",
        "UX Writer = ux writer | content designer",
      ] },
      { id: "visual-design", label: "Visual & Brand Design", generalist: "Designer", roles: [
        "Graphic Designer = graphic designer | visual designer | brand designer | communication designer | visualizer | visualiser | graphic design | packaging designer",
        "Motion Designer = motion designer | motion graphics designer | motion graphic designer",
        "Art / Creative Director = art director | creative director | associate creative director",
        "Illustrator = illustrator | concept artist",
      ] },
      { id: "industrial-design", label: "Industrial, Fashion & Interior Design", generalist: "Designer", roles: [
        "Industrial Designer = industrial designer | product design engineer industrial",
        "Fashion Designer = fashion designer | textile designer | apparel designer",
        "Interior Designer = interior designer | interior design",
        "Jewellery Designer = jewellery designer | jewelry designer",
      ] },
    ],
  },
  {
    id: "engineering", label: "Engineering",
    functions: [
      { id: "software-engineering", label: "Software Engineering", generalist: "Software Engineer", roles: [
        "Software Engineer = software engineer | swe | sde | software development engineer | software developer | developer | programmer | coder | member technical staff | mts | software engineer ii | sde ii | software engineering | application developer | sse | senior software engineer | software engineer 1 | software engineer 2 | software engineer iii",
        "Backend Engineer = backend engineer | back end engineer | back end developer | server side engineer | java developer | golang developer | python developer | nodejs developer | node developer | api developer | php developer | dotnet developer | ruby rails developer | django developer",
        "Frontend Engineer = frontend engineer | front end engineer | front end developer | ui engineer | ui developer | react developer | angular developer | javascript developer | web developer | web engineer | vue developer",
        "Full Stack Engineer = full stack engineer | full stack developer | mern stack developer | mean stack developer | full stack",
        "Mobile Engineer = mobile engineer | mobile developer | ios engineer | ios developer | android engineer | android developer | flutter developer | react native developer | app developer | mobile application developer",
        "Embedded Software Engineer = embedded software engineer | firmware engineer | firmware developer | embedded software developer",
        "Game Developer = game developer | game engineer | unity developer | unreal developer | gameplay programmer | game programmer",
        "Blockchain Engineer = blockchain developer | blockchain engineer | smart contract developer | solidity developer | web3 developer | web3 engineer | smart contract engineer",
        "Founding Engineer = founding engineer | founding software engineer",
        "Staff / Principal Engineer = staff engineer | principal engineer | staff software engineer | principal software engineer | distinguished engineer | senior staff engineer | architect engineer",
        "Engineering Manager = engineering manager | software engineering manager | head engineering | director engineering | vp engineering | engineering leader | engineering head | development manager | software development manager | sdm",
        "Tech Lead = tech lead | technical lead | lead engineer | lead software engineer | lead developer | engineering lead | team lead engineering",
        "Associate Software Engineer = associate software engineer | associate developer | junior software engineer | graduate software engineer | trainee software engineer | junior developer | software engineer trainee | associate engineer software",
        "Software Engineering Intern = software engineer intern | software engineering intern | sde intern | swe intern | software developer intern | developer intern | software development intern",
        "Product Engineer = product engineer | forward deployed engineer | fde | solutions developer",
        "Software Consultant = software consultant | technology consultant software | application consultant",
        "Technology Analyst = technology analyst | systems engineer | system engineer | digital specialist engineer | power programmer | engineering analyst | advanced app engineering analyst | app engineering analyst | application development analyst | system development engineer | systems development engineer",
        "Application Engineer = application engineer | applications engineer | associate application engineer | senior application engineer",
        "Software Trainee = software trainee | trainee software developer | developer trainee",
      ] },
      { id: "quality-testing", label: "Quality & Testing", generalist: "QA Engineer", roles: [
        "QA Engineer = qa engineer | quality assurance engineer | test engineer | software tester | tester | manual tester | qa analyst | quality analyst software | qa",
        "SDET / Automation Engineer = sdet | software development engineer test | automation test engineer | test automation engineer | automation tester | qa automation engineer",
        "QA Lead = qa lead | test lead | qa manager | test manager | quality assurance lead",
      ] },
      { id: "hardware-semiconductors", label: "Hardware, Embedded & Semiconductors", generalist: "Hardware Engineer", roles: [
        "Hardware Engineer = hardware engineer | hardware design engineer | electronics hardware engineer | board design engineer | pcb design engineer",
        "Embedded Systems Engineer = embedded engineer | embedded systems engineer | embedded system engineer | iot engineer",
        "VLSI / Digital Design Engineer = vlsi engineer | vlsi design engineer | asic design engineer | rtl design engineer | digital design engineer | soc design engineer | chip design engineer | asic engineer",
        "Analog / Mixed-Signal Engineer = analog design engineer | analog engineer | mixed signal design engineer | analog layout engineer | layout engineer | analog circuit design",
        "Verification / Validation Engineer = verification engineer | design verification engineer | dv engineer | validation engineer | post silicon validation | silicon validation engineer",
        "Physical Design Engineer = physical design engineer | pd engineer | dft engineer | sta engineer | cad engineer semiconductor",
        "FPGA Engineer = fpga engineer | fpga design engineer | fpga developer",
        "RF Engineer = rf engineer | rf design engineer | antenna engineer | wireless engineer",
        "Robotics Engineer = robotics engineer | robotics software engineer | mechatronics engineer | autonomy engineer | robotic engineer",
      ] },
      { id: "core-engineering", label: "Core Engineering", generalist: "Engineer", roles: [
        "Mechanical Engineer = mechanical engineer | mechanical design engineer | ingeniero mecanico",
        "Design Engineer = design engineer | product design engineer | cae engineer | simulation engineer | cfd engineer | fea engineer | analysis engineer",
        "Electrical Engineer = electrical engineer | electrical design engineer | power systems engineer",
        "Electronics Engineer = electronics engineer | electronic engineer | ece engineer",
        "Civil / Structural Engineer = civil engineer | structural engineer | geotechnical engineer | highway engineer",
        "Chemical / Process Engineer = chemical engineer | process engineer | process design engineer | process development engineer",
        "Energy & Petroleum Engineer = petroleum engineer | reservoir engineer | drilling engineer | energy engineer | power engineer | renewable energy engineer | solar engineer | wind engineer | pipeline engineer | piping engineer",
        "Aerospace Engineer = aerospace engineer | aeronautical engineer | avionics engineer | propulsion engineer | flight test engineer",
        "Automotive Engineer = automotive engineer | vehicle dynamics engineer | powertrain engineer | chassis engineer | ev engineer | battery engineer | homologation engineer",
        "Instrumentation & Controls Engineer = instrumentation engineer | control engineer | controls engineer | automation engineer | plc engineer | scada engineer | control systems engineer",
        "Materials & Metallurgy Engineer = metallurgical engineer | materials engineer | metallurgist | welding engineer | corrosion engineer",
        "Biomedical Engineer = biomedical engineer | medical device engineer | bioengineer",
        "Environmental Engineer = environmental engineer | water resources engineer",
        "Telecom Engineer = telecom engineer | telecommunication engineer | communication engineer | network planning engineer",
        "Project Engineer = project engineer | projects engineer",
        "Graduate Engineer Trainee = graduate engineer trainee | graduate engineering trainee | ~get | engineer trainee | engineering trainee | trainee engineer | probationary engineer | graduate apprentice engineer",
        "Junior / Assistant Engineer = junior engineer | deputy engineer | assistant engineer | jre | assistant executive engineer | executive engineer",
        "Field Service Engineer = field engineer | field service engineer | service engineer | field application engineer | commissioning engineer",
        "Mechanical Integrity / Rotating Equipment Engineer = mechanical integrity engineer | rotating equipment engineer | static equipment engineer | reliability integrity engineer | inspection engineer",
        "Optics & Photonics Engineer = optics engineer | optical engineer | photonics engineer | optical design engineer",
        "R&D Engineer = r and d engineer | rnd engineer | rnd manager | research development engineer | research and development engineer | r and d manager",
        "Facilities / Utilities Engineer = facilities engineer | utility engineer | utilities engineer | hvac engineer",
        "Silicon Engineer = silicon engineer | silicon design engineer",
      ] },
      { id: "manufacturing", label: "Manufacturing & Production", generalist: "Manufacturing Professional", roles: [
        "Production Engineer = production engineer | production executive | shop floor engineer | manufacturing engineer | production supervisor | production manager",
        "Plant Manager = plant manager | plant head | works manager | factory manager | unit head manufacturing",
        "Quality Engineer = quality engineer | quality control engineer | qc engineer | quality control | quality inspector | supplier quality engineer | sqe | quality assurance manufacturing | quality manager",
        "Maintenance & Reliability Engineer = maintenance engineer | maintenance manager | reliability engineer | asset integrity engineer",
        "Industrial Engineer = industrial engineer | lean manager | continuous improvement engineer | process improvement engineer | manufacturing excellence",
        "New Product Introduction = npi engineer | new product introduction | new product industrialization | npd engineer | new product development | npd manager",
        "Technician = technician | engineering technician | electrical technician | service technician | lab technician engineering",
        "HSE / Safety Engineer = hse engineer | safety engineer | safety officer | ehs manager | ehs engineer | hse manager | fire safety officer",
      ] },
    ],
  },
  {
    id: "technology", label: "Technology & IT",
    functions: [
      { id: "cloud-devops", label: "Cloud, DevOps & SRE", generalist: "Cloud / DevOps Engineer", roles: [
        "DevOps Engineer = devops engineer | devops | devsecops engineer | build release engineer | ci cd engineer",
        "Site Reliability Engineer = sre | site reliability engineer | reliability engineer software",
        "Cloud Engineer = cloud engineer | aws engineer | azure engineer | gcp engineer | cloud developer | cloud consultant | cloud support engineer",
        "Solutions / Cloud Architect = cloud architect | solutions architect | solution architect | enterprise architect | technical architect | software architect | system architect | data center architect",
        "Platform / Infrastructure Engineer = platform engineer | infrastructure engineer | kubernetes engineer | systems reliability engineer | infra engineer",
      ] },
      { id: "it-infrastructure", label: "IT & Infrastructure", generalist: "IT Professional", roles: [
        "IT Support Engineer = it support | it support engineer | desktop support engineer | helpdesk | help desk | service desk | technical support engineer | it technician | it support specialist",
        "System Administrator = system administrator | systems administrator | sysadmin | linux administrator | windows administrator | it administrator",
        "Network Engineer = network engineer | network administrator | noc engineer | network architect | network security engineer",
        "Database Administrator = dba | database administrator | database engineer | database developer",
        "IT Manager = it manager | it head | head it | it lead | it director | director it",
        "IT Analyst / Consultant = it analyst | it consultant | it specialist | it executive | systems analyst | system analyst | it project coordinator | information technology",
      ] },
      { id: "cybersecurity", label: "Cybersecurity", generalist: "Security Professional", roles: [
        "Security Engineer = security engineer | application security engineer | appsec engineer | cloud security engineer | product security engineer | security software engineer",
        "Security Analyst = security analyst | soc analyst | cyber security analyst | information security analyst | threat analyst | incident response analyst | cyber security",
        "Penetration Tester = penetration tester | pentester | ethical hacker | red team | offensive security | vapt | security researcher",
        "Security Architect / GRC = security architect | security consultant | grc analyst | grc consultant | iam engineer | identity access management | information security manager",
      ] },
      { id: "enterprise-apps", label: "Enterprise Applications (SAP, Salesforce, ERP)", generalist: "Enterprise Applications Consultant", roles: [
        "SAP Consultant = sap consultant | sap fico consultant | sap mm consultant | sap sd consultant | sap abap developer | sap basis | sap functional consultant | sap technical consultant | sap analyst | sap abap consultant | sap hana consultant",
        "Salesforce Developer / Admin = salesforce developer | salesforce administrator | salesforce consultant | salesforce admin",
        "ServiceNow Developer = servicenow developer | servicenow administrator | servicenow consultant",
        "ERP / CRM Consultant = oracle consultant | erp consultant | oracle fusion consultant | workday consultant | dynamics 365 consultant | crm consultant | functional consultant | techno functional consultant",
      ] },
      { id: "developer-relations", label: "Developer Relations & Docs", generalist: "Developer Relations", roles: [
        "Developer Advocate = developer advocate | developer evangelist | technical evangelist | developer relation | devrel | developer relations engineer | community engineer | developer experience",
        "Technical Writer = technical writer | documentation engineer | technical content writer | api documentation | technical documentation",
      ] },
    ],
  },
  {
    id: "data-ai", label: "Data & AI",
    functions: [
      { id: "data-science", label: "Data Science", generalist: "Data Scientist", roles: [
        "Data Scientist = data scientist | senior data scientist | lead data scientist | decision scientist | applied scientist | data science",
        "Associate Data Scientist = associate data scientist | junior data scientist | data science associate",
        "Data Science Intern = data science intern | data scientist intern",
        "Statistician = statistician | biostatistician",
      ] },
      { id: "machine-learning", label: "Machine Learning & AI", generalist: "AI / ML Engineer", roles: [
        "Machine Learning Engineer = machine learning engineer | ml engineer | mle | ai ml engineer | aiml engineer | machine learning developer",
        "AI Engineer = ai engineer | artificial intelligence engineer | genai engineer | generative ai engineer | llm engineer | applied ai engineer | ai developer | prompt engineer | ai specialist | ai solutions engineer",
        "Computer Vision Engineer = computer vision engineer | perception engineer | image processing engineer | ~cv engineer",
        "NLP / Speech Engineer = nlp engineer | nlp scientist | conversational ai engineer | speech engineer | speech scientist",
        "AI / ML Researcher = ml researcher | ai researcher | machine learning researcher | research scientist ai | ai research scientist | deep learning researcher | research engineer ai | ai research engineer",
        "MLOps Engineer = mlops engineer | ml ops engineer | ml platform engineer | ml infrastructure engineer | mlops",
        "AI / ML Intern = machine learning intern | ai intern | ml intern | ai ml intern | deep learning intern | nlp intern | computer vision intern | generative ai intern",
      ] },
      { id: "data-engineering", label: "Data Engineering", generalist: "Data Engineer", roles: [
        "Data Engineer = data engineer | big data engineer | etl developer | etl engineer | data platform engineer | data pipeline engineer | spark developer | hadoop developer | data warehouse engineer | snowflake developer | databricks engineer | senior data engineer",
        "Analytics Engineer = analytics engineer",
        "Data Architect = data architect | data modeler | data modeller",
      ] },
      { id: "analytics", label: "Analytics & BI", generalist: "Analyst", roles: [
        "Data Analyst = data analyst | associate data analyst | junior data analyst | reporting analyst | mis analyst | mis executive | data analytics | senior data analyst",
        "Business Intelligence Analyst = bi analyst | business intelligence analyst | bi developer | bi engineer | power bi developer | tableau developer | business intelligence developer | bi consultant | business intelligence",
        "Product Analyst = product analyst | product analytics | senior product analyst",
        "Analytics Manager = analytics manager | analytics lead | head analytics | analytics consultant | decision analytics associate | decision analytics | analytics associate | analytics specialist | insights manager | insights analyst | consumer insights",
        "Analytics Professional = analytics | data analytics team",
      ] },
    ],
  },
  {
    id: "finance", label: "Finance",
    functions: [
      { id: "accounting", label: "Accounting, Audit & Tax", generalist: "Finance Professional", roles: [
        "Chartered Accountant = chartered accountant | cpa | acca | ca final | ca inter | semi qualified ca | ca articleship | articled assistant | article trainee | article assistant | ~ca | ca intern",
        "Accountant = accountant | accounting executive | accounting manager | accounting officer | accounting analyst | bookkeeper | accounting payable | accounting receivable | ap specialist | ar specialist | billing executive | gl accountant | fund accountant | cost accountant",
        "Auditor = auditor | internal auditor | audit associate | audit senior | audit manager | statutory auditor | external auditor | it auditor | assurance associate | risk assurance | audit analyst",
        "Tax Consultant = tax consultant | tax analyst | tax associate | tax manager | indirect tax | direct tax | gst consultant | transfer pricing | tax senior",
        "Financial Controller = controller | financial controller | comptroller | finance controller | cost controller",
      ] },
      { id: "corporate-finance", label: "Corporate Finance & FP&A", generalist: "Finance Professional", roles: [
        "Financial Analyst = financial analyst | finance analyst | fpa analyst | fpa | finance associate | finance executive | finance business partner | commercial finance | business finance | finance intern",
        "Finance Manager = finance manager | head finance | vp finance | finance director | director finance | finance head | finance lead",
        "Treasury = treasury analyst | treasury manager | treasurer | cash management | treasury",
      ] },
      { id: "banking", label: "Banking", generalist: "Banker", roles: [
        "Relationship Manager = relationship manager | wealth relationship manager | priority banking | client relationship manager banking | personal banker | private banker | corporate banker | banker",
        "Credit Analyst = credit analyst | credit manager | credit officer | credit risk analyst | underwriter | loan officer | credit underwriter | lending analyst | credit",
        "Branch Banking = branch manager | teller | bank officer | probationary officer | deputy branch manager | branch operations | assistant branch manager",
        "Banking Operations = banking operations | trade finance | payments operations | transaction banking | cash operations",
        "Bank Manager = chief manager | senior branch manager | assistant general manager bank | agm | dgm | deputy general manager",
      ] },
      { id: "investment-banking", label: "Investment Banking & Markets", generalist: "Markets Professional", roles: [
        "Investment Banking Analyst = investment banking analyst | ib analyst | investment banking associate | investment banker | ecm analyst | dcm analyst | mna analyst | merger acquisition analyst | investment banking",
        "Equity Research Analyst = equity research analyst | equity research associate | research analyst equity | sell side analyst | buy side analyst | equity research",
        "Sales & Trading = trader | trading analyst | sales trader | derivatives trader | equity trader | fixed income analyst | markets analyst | global markets analyst | commodity trader | futures trader | options trader | trading",
        "Investment Analyst = investment analyst | investment associate | portfolio analyst | investment specialist | asset management analyst | investment professional",
        "Portfolio / Wealth Manager = portfolio manager | fund manager | asset manager | wealth manager | investment manager | chief investment officer | wealth management",
      ] },
      { id: "quant", label: "Quantitative Finance", generalist: "Quant", roles: [
        "Quantitative Researcher = quantitative researcher | quant researcher | quantitative research | quantitative research analyst",
        "Quantitative Analyst = quantitative analyst | quant analyst | quant",
        "Quantitative Developer = quantitative developer | quant developer | quantitative engineer | algo developer | algorithmic trader | quant trader | quantitative trader",
        "Quantitative Strategist = quantitative strategist | quant strategist | strat",
      ] },
      { id: "investing", label: "Venture Capital & Private Equity", generalist: "Investor", roles: [
        "Venture Capital Investor = venture capitalist | vc | venture capital | vc analyst | vc associate | venture capital analyst | venture capital associate | vc investor | venture investor",
        "General / Venture Partner = general partner | venture partner | limited partner | ~managing partner | founding partner fund",
        "Investment Team = investment team | investments team | strategy investment | investment committee",
        "Private Equity = private equity analyst | private equity associate | pe analyst | pe associate | growth equity | private equity",
        "Angel Investor = angel investor | angel | seed investor | startup investor | syndicate lead | investor | impact investor",
        "Entrepreneur in Residence = entrepreneur residence | eir | founder residence",
        "VC Scout = venture scout | scout",
      ] },
      { id: "risk-insurance", label: "Risk, Insurance & Actuarial", generalist: "Risk Professional", roles: [
        "Risk Analyst = risk analyst | risk manager | market risk | operational risk | credit risk manager | enterprise risk | risk management | risk associate",
        "Actuary = actuary | actuarial analyst | actuarial associate | actuarial",
        "Insurance Professional = insurance advisor | insurance agent | claims analyst | claims associate | insurance underwriter | underwriting analyst | insurance",
        "Fraud Analyst = fraud analyst | fraud investigator | fraud risk analyst | fraud",
      ] },
    ],
  },
  {
    id: "sales", label: "Sales & Business Development",
    functions: [
      { id: "sales", label: "Sales", generalist: "Sales Professional", roles: [
        "Account Executive = account executive | enterprise account executive | sales executive | sales officer | sales representative | sales associate | field sales executive | territory sales officer | sales specialist | ~ae",
        "Sales Professional = sale | sales",
        "Sales Development Representative = sdr | bdr | sales development representative | business development representative | inside sales representative | inside sales | telesales | telecaller | lead generation executive",
        "Sales Manager = sales manager | area sales manager | regional sales manager | zonal sales manager | territory manager | sales lead | head sales | sales head | vp sales | director sales | national sales manager | sales director",
        "Key Account Manager = key account manager | key accounting manager | strategic account manager | enterprise account manager | global account manager | strategic accounting",
        "Channel Sales Manager = channel sales manager | channel manager | channel partner manager | distributor sales | dealer manager | trade sales",
        "Medical Representative = medical representative | medical sales representative | territory business manager",
        "Sales Intern = sales intern | sales trainee",
      ] },
      { id: "business-development", label: "Business Development & Partnerships", generalist: "Business Development", roles: [
        "Business Development Executive = business development executive | bde | business development associate | business development analyst | bda | business development intern",
        "Business Development Manager = business development manager | bdm | head business development | business development lead | business developer | bizdev | business development | ~bd",
        "Partnerships Manager = partnership manager | partnerships lead | partner manager | alliances manager | strategic partnership | partnership associate | partner development manager | alliance manager | partnership",
      ] },
      { id: "account-management", label: "Account Management", generalist: "Account Manager", roles: [
        "Account Manager = account manager | client account manager | client partner | account director | client servicing | ~am",
      ] },
      { id: "presales", label: "Pre-sales & Solutions", generalist: "Solutions Consultant", roles: [
        "Solutions Engineer = solutions engineer | sales engineer | presales engineer | pre sale consultant | presales consultant | solutions consultant | solution consultant | customer engineer | presales",
      ] },
      { id: "revops-gtm", label: "Revenue Operations & GTM", generalist: "GTM Professional", roles: [
        "Revenue Operations = revops | revenue operation | sale operation | sales ops | gtm operation | go market operation",
        "GTM Strategy = gtm manager | gtm strategy | go market | gtm lead | gtm | go market manager",
      ] },
    ],
  },
  {
    id: "marketing", label: "Marketing",
    functions: [
      { id: "growth", label: "Growth", generalist: "Growth Marketer", roles: [
        "Growth Manager = growth manager | growth lead | head growth | growth marketer | growth hacker | growth associate | growth marketing manager | growth marketing | growth hacking | organic growth",
        "Performance Marketing = performance marketing manager | performance marketer | performance marketing | paid media | paid marketing | ppc specialist | sem specialist | google ads specialist | media buyer | user acquisition | user acquisition manager",
        "Lifecycle / CRM Marketing = lifecycle marketing | lifecycle manager | crm manager | retention manager | retention marketing | email marketing | marketing automation",
        "Growth Analyst = growth analyst | marketing analyst | marketing analytics",
      ] },
      { id: "brand-marketing", label: "Brand Marketing", generalist: "Brand Marketer", roles: [
        "Brand Manager = brand manager | assistant brand manager | associate brand manager | brand lead | head brand | brand strategist | brand marketing manager | brand marketing",
      ] },
      { id: "digital-content", label: "Digital, SEO & Social", generalist: "Digital Marketer", roles: [
        "Digital Marketing Specialist = digital marketing executive | digital marketing manager | digital marketer | digital marketing specialist | digital marketing intern | online marketing | digital marketing",
        "SEO Specialist = seo specialist | seo executive | seo analyst | seo manager | seo",
        "Content Marketer = content marketing manager | content marketer | content strategist | content marketing | copywriter | content strategy",
        "Social Media & Community Manager = social media manager | social media executive | social media marketing | community manager | community lead | influencer marketing manager | social media",
      ] },
      { id: "product-marketing", label: "Product Marketing", generalist: "Product Marketer", roles: [
        "Product Marketing Manager = product marketing manager | product marketing | product marketing lead | product marketing associate",
      ] },
      { id: "communications", label: "Communications & PR", generalist: "Communications Professional", roles: [
        "Communications Manager = communications manager | corporate communication | internal communication | pr manager | public relation | pr executive | media relation | press officer | spokesperson | communications specialist | communication",
      ] },
      { id: "marketing-general", label: "Marketing Management", generalist: "Marketer", roles: [
        "Marketing Manager = marketing manager | marketing lead | head marketing | marketing head | vp marketing | marketing director | director marketing | marketing executive | marketing associate | marketing specialist",
        "Marketer = marketing | marketeer",
        "Marketing Intern = marketing intern",
        "Event Manager = event manager | events manager | event management | event coordinator | manager events",
        "Market Research Analyst = market research analyst | market analyst | market researcher | consumer insights analyst | market intelligence analyst | market research",
        "Trade / Category Marketing = trade marketing manager | shopper marketing | trade marketing",
      ] },
    ],
  },
  {
    id: "customer", label: "Customer Success & Support",
    functions: [
      { id: "customer-success", label: "Customer Success", generalist: "Customer Success", roles: [
        "Customer Success Manager = customer success manager | csm | customer success associate | customer success lead | client success manager | customer success specialist | head customer success | customer success",
        "Implementation & Onboarding = implementation manager | implementation specialist | implementation engineer | implementation consultant | onboarding specialist | onboarding manager | head onboarding | activation manager",
        "Technical Account Manager = technical account manager | tam",
      ] },
      { id: "customer-support", label: "Customer Support & Experience", generalist: "Customer Support", roles: [
        "Customer Support Associate = customer support executive | customer support associate | customer service representative | customer support specialist | support executive | support agent | customer care executive | call center executive | process associate | voice process | chat support | customer support | customer service",
        "Support Engineer = support engineer | technical support associate | application support engineer | production support engineer | l2 support | l1 support",
        "Customer Experience Manager = customer experience manager | cx manager | cx lead | customer experience lead | customer experience associate | customer experience | global support manager | manager global support | head aftersales | aftersales",
        "Trust & Safety = content moderator | trust safety | community moderator | ~moderator | trust and safety analyst",
      ] },
    ],
  },
  {
    id: "people", label: "People & Talent",
    functions: [
      { id: "talent-acquisition", label: "Talent Acquisition", generalist: "Recruiter", roles: [
        "Recruiter = recruiter | technical recruiter | senior recruiter | recruitment consultant | recruiting coordinator | recruitment executive | talent acquisition specialist | talent acquisition executive | talent acquisition partner | talent partner | sourcer | talent sourcer | headhunter | executive search consultant | campus recruiter | university recruiter | talent acquisition | recruitment | ~ta",
        "Talent Acquisition Lead = talent acquisition lead | talent acquisition manager | head talent acquisition | recruiting manager | head talent | recruitment manager | recruitment lead",
      ] },
      { id: "hr", label: "HR & People Operations", generalist: "HR Professional", roles: [
        "HR Business Partner = hrbp | hr business partner | people partner",
        "HR Generalist = hr generalist | hr executive | hr associate | hr manager | human resource manager | hr specialist | hr officer | hr intern | people operation | people ops | hr operation",
        "HR Professional = hr | human resource",
        "Compensation & Benefits = compensation benefit | total reward | payroll specialist | payroll executive | compensation analyst | payroll",
        "Employee Experience & DEI = employee engagement | employee experience | culture manager | dei lead | diversity inclusion | diversity equity inclusion",
        "HR Leader = head hr | hr head | vp hr | hr director | head people | director hr | head human resource",
      ] },
      { id: "learning-development", label: "Learning & Development", generalist: "L&D Professional", roles: [
        "L&D Specialist = learning development | lnd | training manager | learning specialist | learning experience designer | training specialist | talent development | organizational development",
      ] },
    ],
  },
  {
    id: "operations", label: "Operations",
    functions: [
      { id: "supply-chain", label: "Supply Chain", generalist: "Supply Chain Professional", roles: [
        "Supply Chain Manager = supply chain manager | supply chain lead | head supply chain | supply chain director | scm manager | supply chain head | director supply chain",
        "Supply Chain Analyst = supply chain analyst | supply chain associate | supply chain executive | supply chain consultant | scm analyst | supply chain specialist | supply chain intern",
        "Supply Chain Professional = supply chain | scm | supply chain finance",
        "Demand & Supply Planner = demand planner | supply planner | s op planner | s op manager | planning manager | supply planning | demand planning | inventory planner | material planner | production planner | master scheduler | mrp planner | supply chain planner",
        "Product Supply Manager = product supply manager | product supply | strategic supply manager | manager strategic supply",
      ] },
      { id: "procurement", label: "Procurement & Sourcing", generalist: "Procurement Professional", roles: [
        "Procurement Analyst = procurement analyst | procurement associate | procurement executive | purchase executive | purchasing executive | buyer | sourcing analyst | sourcing specialist | strategic sourcing | category buyer | procurement specialist | purchase officer",
        "Procurement Manager = procurement manager | purchase manager | sourcing manager | head procurement | vendor manager | vendor management | supplier development | supplier manager | procurement lead",
        "Procurement Professional = procurement | purchasing | sourcing",
      ] },
      { id: "logistics", label: "Logistics & Fulfillment", generalist: "Logistics Professional", roles: [
        "Logistics Manager = logistics manager | logistics executive | logistics coordinator | logistics analyst | transportation manager | transport manager | fleet manager | dispatch manager | last mile manager | last mile | first mile | mid mile | shipping coordinator | exim executive | import export | customs",
        "Logistics Professional = logistics | logistic",
        "Warehouse & Inventory Manager = warehouse manager | warehouse supervisor | warehouse executive | fulfillment center manager | fc manager | inventory manager | inventory control | store keeper | dark store manager | hub manager | inventory",
      ] },
      { id: "business-ops", label: "General Operations", generalist: "Operations Professional", roles: [
        "Operations Manager = operations manager | operation manager | ops manager | operations lead | head operations | operations head | operations director | vp operations | director operations",
        "Operations Associate = operations associate | operations executive | operations analyst | operations specialist | ops associate | ops executive | operations intern",
        "Operations Professional = operation | operations",
        "City / Cluster Manager = city manager | city head | cluster manager | area manager | zonal manager | regional manager | zonal head | city lead",
        "Process Excellence = process excellence | operational excellence | business excellence | continuous improvement | six sigma | lean six sigma | process improvement | value stream manager",
      ] },
      { id: "category-marketplace", label: "Category & Marketplace", generalist: "Category Professional", roles: [
        "Category Manager = category manager | category lead | category management | category associate | category head | associate category manager | marketplace manager | ecommerce manager | e commerce manager | merchandising manager | senior category manager | manager category | ~category | category pnl",
        "Expansion / New Initiatives = expansion manager | manager expansion | new initiative | new categories | business expansion | growth expansion | ev expansion",
      ] },
      { id: "project-program", label: "Project & Program Management", generalist: "Project Manager", roles: [
        "Project Manager = project manager | project lead | project leader | project coordinator | project associate | project executive | project management | project analyst | project intern | project officer | pmo analyst | ~pm",
        "Program Manager = program manager | program lead | program coordinator | program management",
        "Technical Program Manager = technical program manager | ~tpm",
        "PMO Lead = pmo | pmo lead | program management office | project management office | pmo manager",
        "Scrum Master / Agile Coach = scrum master | agile coach | agile delivery lead | iteration manager",
        "Delivery Manager = delivery manager | delivery lead | delivery head | service delivery manager | client delivery | delivery director | senior delivery director",
      ] },
      { id: "administration", label: "Administration & Facilities", generalist: "Administration Professional", roles: [
        "Executive Assistant = executive assistant | personal assistant | administrative assistant | office assistant | virtual assistant | ~secretary",
        "Office & Facilities Manager = office manager | office administrator | admin executive | admin manager | administration manager | facilities manager | facility manager | front office executive | receptionist | data entry operator | back office executive | administration",
      ] },
    ],
  },
  {
    id: "legal", label: "Legal & Compliance",
    functions: [
      { id: "legal", label: "Legal", generalist: "Legal Professional", roles: [
        "Lawyer = lawyer | advocate | attorney | legal associate | corporate lawyer | solicitor | barrister | litigation associate | associate advocate | abogado | avocat",
        "Legal Professional = legal",
        "Legal Counsel = counsel | legal counsel | general counsel | in house counsel | legal manager | legal head | head legal | senior counsel",
        "Legal Analyst / Intern = legal analyst | legal intern | law clerk | paralegal | legal officer | legal executive | legal researcher",
        "Judge = judge | magistrate | arbitrator | mediator",
      ] },
      { id: "compliance", label: "Compliance, Secretarial & IP", generalist: "Compliance Professional", roles: [
        "Compliance Officer = compliance officer | compliance analyst | compliance manager | compliance associate | regulatory compliance | aml analyst | kyc analyst | anti money laundering | compliance",
        "Company Secretary = company secretary | cs executive | secretarial | assistant company secretary",
        "IP & Patents = patent analyst | patent agent | patent attorney | ip analyst | intellectual property | trademark attorney | patent",
      ] },
    ],
  },
  {
    id: "healthcare", label: "Healthcare & Life Sciences",
    functions: [
      { id: "clinical", label: "Clinical Care", generalist: "Healthcare Professional", roles: [
        "Doctor = doctor | physician | surgeon | medical officer | resident doctor | junior resident | senior resident | consultant physician | mbbs | general practitioner | cardiologist | dermatologist | pediatrician | gynecologist | oncologist | neurologist | orthopedic surgeon | anesthesiologist | radiologist | psychiatrist | ophthalmologist | medico",
        "Nurse = nurse | registered nurse | staff nurse | nursing officer | nurse practitioner",
        "Dentist = dentist | dental surgeon | bds | orthodontist",
        "Pharmacist = pharmacist | clinical pharmacist",
        "Therapist & Psychologist = physiotherapist | physical therapist | occupational therapist | speech therapist | psychologist | counselling psychologist | counseling psychologist | clinical psychologist | psychotherapist | therapist",
        "Allied Health = dietitian | dietician | nutritionist | optometrist | radiographer | medical lab technician | lab technician | phlebotomist | paramedic | emt | veterinarian",
      ] },
      { id: "pharma-biotech", label: "Pharma & Biotech", generalist: "Life Sciences Professional", roles: [
        "Clinical Research = clinical research associate | clinical research coordinator | clinical data manager | clinical trial associate | cra | clinical research | clinical operations",
        "Regulatory Affairs = regulatory affairs specialist | regulatory affairs associate | regulatory affairs manager | regulatory affair",
        "Medical Affairs = medical affairs | medical science liaison | msl | medical advisor | medical writer",
        "Pharmacovigilance = pharmacovigilance | drug safety associate | drug safety",
        "Biotech / Pharma Scientist = formulation scientist | biotechnologist | process development scientist | bioprocess engineer | analytical scientist | qc chemist | pharmaceutical scientist",
      ] },
      { id: "healthcare-management", label: "Healthcare Management", generalist: "Healthcare Manager", roles: [
        "Hospital Administrator = hospital administrator | healthcare administrator | healthcare manager | hospital manager | medical coder | medical coding | healthcare operations",
      ] },
    ],
  },
  {
    id: "research", label: "Research & Science",
    functions: [
      { id: "academic-research", label: "Academic Research", generalist: "Researcher", roles: [
        "PhD Researcher = phd | phd student | phd candidate | phd scholar | doctoral student | doctoral candidate | doctoral researcher | research scholar | doctoral fellow | ph d",
        "Postdoctoral Researcher = postdoc | postdoctoral researcher | postdoctoral fellow | post doctoral fellow | postdoctoral research associate | research fellow | visiting researcher | visiting scholar",
        "Research Assistant / Associate = research assistant | graduate research assistant | research associate | junior research fellow | jrf | srf | senior research fellow | project assistant research | research staff",
        "Research Intern = research intern | summer research intern | undergraduate researcher | research trainee | student researcher | undergraduate research assistant | research internship | summer research fellow",
        "Researcher / Scientist = researcher | research scientist | scientist | principal investigator | research engineer | lead researcher | senior scientist | staff scientist | research lead | research manager | scientific officer",
      ] },
      { id: "sciences", label: "Natural & Social Sciences", generalist: "Scientist", roles: [
        "Geoscientist = geoscientist | geologist | geophysicist | seismologist | hydrologist | geosolutions geophysicist",
        "Physicist / Chemist / Biologist = physicist | chemist | biologist | microbiologist | biochemist | astrophysicist | astronomer | neuroscientist | mathematician | bioinformatician | computational biologist",
        "Economist = economist | research economist | policy economist",
        "Environmental Scientist = environmental scientist | climate scientist | ecologist | sustainability scientist",
      ] },
    ],
  },
  {
    id: "education", label: "Education & Mentoring",
    functions: [
      { id: "faculty", label: "Faculty & Teaching", generalist: "Educator", roles: [
        "Professor = professor | full professor | chair professor | distinguished professor",
        "Assistant Professor = assistant professor",
        "Associate Professor = associate professor",
        "Lecturer / Faculty = lecturer | guest lecturer | visiting faculty | adjunct professor | adjunct faculty | faculty | instructor | course instructor | visiting professor",
        "School Teacher = teacher | school teacher | pgt | tgt | prt | primary teacher | math teacher | educator | tutor | online tutor | home tutor",
        "Teaching Assistant = teaching assistant | graduate teaching assistant | ~ta | teaching fellow | course assistant",
        "Academic Leader = dean | hod | head department | school principal | vice principal | vice chancellor | registrar | provost | director institute",
      ] },
      { id: "mentoring", label: "Mentoring & Coaching", generalist: "Mentor", roles: [
        "Mentor = mentor | startup mentor | industry mentor | mentor advisor",
        "Career Coach / Counselor = career coach | coach | life coach | executive coach | career counselor | admissions counselor | academic counselor | counselor",
      ] },
      { id: "training", label: "Training & EdTech", generalist: "Trainer", roles: [
        "Trainer = trainer | corporate trainer | soft skill trainer | language trainer | technical trainer | bootcamp instructor | facilitator",
        "Curriculum & Instructional Design = curriculum developer | curriculum designer | instructional designer | content developer education | subject matter expert",
      ] },
    ],
  },
  {
    id: "students", label: "Students & Early Career",
    functions: [
      { id: "students", label: "Students", generalist: "Student", roles: [
        "Undergraduate Student = student | undergraduate | undergraduate student | btech student | b tech | btech | be student | bsc student | engineering student | college student | final year student | sophomore | freshman | undergrad | dual degree student | university student",
        "Graduate Student = graduate student | master student | masters student | ms student | mtech student | mtech | m tech | msc student | graduate school",
        "MBA Student = mba student | mba candidate | pgdm | pgp participant | mba | pgp student | executive mba | pgdm student",
        "Law / Medical Student = law student | medical student | llb student | mbbs student",
      ] },
      { id: "internships", label: "Internships", generalist: "Intern", roles: [
        "Intern = intern | summer intern | internship | winter intern | interns | trainee intern",
        "Summer Analyst / Associate = summer analyst | summer associate | summer consultant",
        "Co-op / Apprentice = co op | apprentice | werkstudent | apprenticeship",
      ] },
      { id: "campus", label: "Campus Leadership & Clubs", generalist: "Campus Leader", roles: [
        "Campus Ambassador = campus ambassador | student ambassador | campus representative | student representative | class representative | hostel representative | ~representative",
        "Placement & Alumni Team = placement committee | placement preparation committee | ~placement manager | ~placement associate | alumni council | ~relations associate | ~database manager | corporate relation",
        "Event Organizer = ~event organizer | ~event organiser | ~organizer | ~organiser | ~web nominee | ~nominee",
        "Club Secretary = ~joint secretary | ~general secretary | ~additional secretary | ~secretary | ~president | ~vice president",
        "Club Coordinator = overall coordinator | ~coordinator | core coordinator | core team member | core member | placement coordinator | training placement associate | training placement coordinator | ~head | ~lead",
        "Club / Team Member = executive member | ~member | ~team member | associate member | subcom member | committee member | co organiser | co organizer | ~volunteer | club member",
        "Student Mentor = student mentor | department academic mentor | institute student mentor | peer mentor | academic mentor",
      ] },
      { id: "early-career", label: "Early Career Programs", generalist: "Early Career Professional", roles: [
        "Management Trainee = management trainee | ~mt | executive trainee | graduate trainee | leadership development program | ldp | rotational program | young leader program | leadership trainee | emerging leadership program | engineering leadership program | leadership program | ~trainee",
        "Graduate Analyst = graduate analyst | analyst graduate program | graduate programme",
        "Fresher / New Grad = fresher | recent graduate | new grad | fresh graduate",
      ] },
    ],
  },
  {
    id: "media", label: "Media & Creative",
    functions: [
      { id: "journalism", label: "Journalism & Publishing", generalist: "Media Professional", roles: [
        "Journalist / Editor = journalist | reporter | correspondent | editor | sub editor | news editor | columnist | anchor | news anchor | copy editor | publisher | editorial",
      ] },
      { id: "creators", label: "Content & Creators", generalist: "Content Creator", roles: [
        "Content Creator = content creator | creator | youtuber | influencer | blogger | podcaster | streamer | digital creator | ugc creator",
        "Writer = writer | author | content writer | creative writer | ghostwriter | screenwriter | scriptwriter | poet | novelist",
      ] },
      { id: "arts-entertainment", label: "Film, Music & Arts", generalist: "Creative Professional", roles: [
        "Filmmaker & Video = filmmaker | film maker | film director | assistant director | cinematographer | producer | film producer | video editor | videographer | photographer | animator | vfx artist | 3d artist",
        "Musician = musician | singer | composer | music producer | dj | rapper",
        "Artist & Performer = artist | painter | sculptor | actor | actress | dancer | comedian | performer | theatre artist | tarot reader",
      ] },
      { id: "sports", label: "Sports & Gaming", generalist: "Sports Professional", roles: [
        "Athlete & Coach = athlete | cricketer | footballer | sportsperson | esports player | gamer | sports coach | football coach | cricket coach | speedcuber | chess player | professional athlete",
      ] },
    ],
  },
  {
    id: "public", label: "Government, Policy & Impact",
    functions: [
      { id: "government", label: "Government & Civil Services", generalist: "Public Servant", roles: [
        "Civil Servant = ias | ips | ifs | irs | ias officer | ips officer | civil servant | ~joint secretary | ~additional secretary | deputy secretary | under secretary | section officer | deputy commissioner | commissioner | district collector | block development officer | government official | gazetted officer | public servant | government",
        "Diplomat = diplomat | consul | ambassador | foreign service officer",
        "Elected Representative = mla | member parliament | senator | councillor | mayor | politician",
      ] },
      { id: "defence", label: "Military, Police & Defence", generalist: "Defence Professional", roles: [
        "Armed Forces Officer = army officer | navy officer | air force officer | lieutenant | colonel | commander | flying officer | squadron leader | sub lieutenant | soldier | cadet | veteran | defence officer | ~captain | ~major | indian army",
        "Police Officer = police officer | sub inspector | inspector police | constable | superintendent police",
      ] },
      { id: "policy", label: "Public Policy & Think Tanks", generalist: "Policy Professional", roles: [
        "Policy Analyst = policy analyst | policy associate | policy researcher | public policy consultant | policy advisor | policy manager | public affair | government affair | public policy | ~young professional",
        "Fellow = gandhi fellow | teach india fellow | sbi youth india fellow | policy fellow | ~fellow | fellowship",
      ] },
      { id: "nonprofit", label: "Nonprofit & Social Impact", generalist: "Social Impact Professional", roles: [
        "Program Officer (Nonprofit) = program officer | ~program associate | field coordinator | community mobilizer | development professional",
        "Social Worker = social worker | social impact | csr manager | csr lead | fundraising manager | fundraiser | grant writer | ~volunteer | activist | missionary",
        "Sustainability & ESG = sustainability manager | sustainability analyst | esg analyst | esg consultant | climate analyst | sustainability consultant | sustainability",
      ] },
    ],
  },
  {
    id: "real-estate", label: "Real Estate & Construction",
    functions: [
      { id: "real-estate", label: "Real Estate", generalist: "Real Estate Professional", roles: [
        "Real Estate Consultant = real estate agent | realtor | real estate consultant | property consultant | real estate broker | leasing manager | leasing consultant | property manager | land acquisition | real estate",
      ] },
      { id: "construction", label: "Construction & Architecture", generalist: "Construction Professional", roles: [
        "Site / Construction Engineer = site engineer | civil site engineer | site supervisor | construction manager | construction engineer | planning engineer | billing engineer | quantity surveyor | estimation engineer | estimator | surveyor | contractor | construction",
        "Architect = architect | architectural assistant | urban planner | urban designer | landscape architect | interior architect",
      ] },
    ],
  },
  {
    id: "services", label: "Hospitality, Retail & Services",
    functions: [
      { id: "hospitality", label: "Hospitality & Food", generalist: "Hospitality Professional", roles: [
        "Hotel & Restaurant = hotel manager | restaurant manager | chef | sous chef | commis chef | cook | barista | bartender | front office | guest relation | housekeeping | fnb manager | food beverage | hospitality",
      ] },
      { id: "aviation-travel", label: "Aviation & Travel", generalist: "Aviation / Travel Professional", roles: [
        "Pilot & Cabin Crew = pilot | first officer | commercial pilot | cabin crew | flight attendant | air hostess | ground staff",
        "Travel Consultant = travel consultant | tour manager | travel agent | tour guide",
      ] },
      { id: "retail", label: "Retail", generalist: "Retail Professional", roles: [
        "Store Manager & Associate = store manager | shop manager | retail manager | store associate | retail associate | cashier | visual merchandiser | floor manager | outlet manager",
      ] },
      { id: "wellness-trades", label: "Wellness & Skilled Trades", generalist: "Service Professional", roles: [
        "Fitness & Wellness = fitness trainer | personal trainer | yoga instructor | yoga trainer | fitness coach | gym trainer | beautician | makeup artist | hairstylist | salon manager | spa therapist",
        "Skilled Trades = electrician | plumber | carpenter | mechanic | welder | driver | delivery partner | delivery executive | farmer",
      ] },
    ],
  },
  {
    id: "unclassified", label: "Area not stated",
    functions: [
      { id: "unclassified", label: "Role not shared", generalist: "Role not shared", roles: [] },
      // A title that is only a rung on the ladder: "Assistant Manager", "Senior
      // Associate". We know how senior they are and nothing about what they do.
      { id: "unspecified", label: "Area not stated", generalist: "Not specified", roles: [] },
    ],
  },
];

/** Where a legacy category lands when no specific role phrase matched. */
export const CATEGORY_DEFAULTS: Record<CategoryId, [domain: string, fn: string]> = {
  founders: ["leadership", "founders"],
  executives: ["leadership", "executive-leadership"],
  investors: ["finance", "investing"],
  recruiting: ["people", "talent-acquisition"],
  software: ["engineering", "software-engineering"],
  data_ai: ["data-ai", "analytics"],
  it_security: ["technology", "it-infrastructure"],
  product: ["product", "product-management"],
  design: ["design", "product-design"],
  engineering: ["engineering", "core-engineering"],
  research: ["research", "academic-research"],
  healthcare: ["healthcare", "clinical"],
  legal: ["legal", "legal"],
  finance: ["finance", "corporate-finance"],
  consulting: ["strategy", "management-consulting"],
  sales: ["sales", "sales"],
  marketing: ["marketing", "marketing-general"],
  customer: ["customer", "customer-success"],
  hr: ["people", "hr"],
  project: ["operations", "project-program"],
  operations: ["operations", "business-ops"],
  education: ["education", "faculty"],
  students: ["students", "students"],
  media: ["media", "creators"],
  public: ["public", "government"],
  real_estate: ["real-estate", "real-estate"],
  services: ["services", "hospitality"],
  unspecified: ["unclassified", "unclassified"],
};

/** Industry inferred from the employer (never from the person's title). */
export const INDUSTRY_BY_COMPANY_CATEGORY: Partial<Record<CategoryId, string>> = {
  software: "Technology",
  data_ai: "Technology",
  it_security: "Technology",
  product: "Technology",
  design: "Design & Creative Services",
  founders: "Startups",
  investors: "Venture Capital & Private Equity",
  finance: "Financial Services",
  consulting: "Consulting & Professional Services",
  healthcare: "Healthcare & Pharma",
  education: "Education",
  students: "Education",
  research: "Research & Academia",
  public: "Government & Nonprofit",
  media: "Media & Entertainment",
  real_estate: "Real Estate & Construction",
  services: "Hospitality & Retail",
  engineering: "Manufacturing, Energy & Industrial",
  operations: "Logistics & Supply Chain",
  legal: "Legal Services",
  recruiting: "Staffing & HR Services",
  hr: "Staffing & HR Services",
  marketing: "Advertising & Marketing",
  customer: "BPO & Customer Services",
  sales: "Distribution & Trading",
};

export const INDUSTRIES = [...new Set(Object.values(INDUSTRY_BY_COMPANY_CATEGORY))].sort().concat("Unknown");
