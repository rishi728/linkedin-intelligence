import { describe, expect, it } from "vitest";
import { classify } from "./classifier";
import type { CategoryId, Seniority, TagId } from "./taxonomy";

type Case = [position: string, company: string, expected: CategoryId];

const CASES: Case[] = [
  // Founders
  ["Founder & CEO", "Acme", "founders"],
  ["Co-Founder", "Stealth Startup", "founders"],
  ["Cofounder | Building in public", "", "founders"],
  ["Business Owner", "Sharma Traders", "founders"],
  ["Entrepreneur", "", "founders"],
  ["Founder @ Nimbus (YC W23) | Ex-Google", "", "founders"],
  ["Self-employed", "", "founders"],
  ["Freelancer", "Self Employed", "founders"],
  ["Fundador", "Tienda Online", "founders"],
  // Executives
  ["CEO", "Infosys", "executives"],
  ["Chief Technology Officer", "Fintech Co", "executives"],
  ["Chief Medical Officer", "Apollo Hospitals", "executives"],
  ["Managing Director", "Accenture", "executives"],
  ["President", "Rotary Club", "executives"],
  ["Chairman", "Tata Sons", "executives"],
  ["Chief of Staff to CEO", "Razorpay", "executives"],
  ["Board Member", "Acme Foundation", "executives"],
  ["CXO", "", "executives"],
  // Investors
  ["Partner", "Sequoia Capital", "investors"],
  ["General Partner", "Blume Ventures", "investors"],
  ["Angel Investor", "", "investors"],
  ["Principal", "Accel", "investors"],
  ["Venture Capital Associate", "Lightspeed", "investors"],
  ["Associate", "Peak XV Partners", "investors"],
  ["Investor", "Self", "investors"],
  ["Entrepreneur in Residence", "Antler", "investors"],
  // Recruiting
  ["Technical Recruiter", "Google", "recruiting"],
  ["Talent Acquisition Specialist", "Amazon", "recruiting"],
  ["Senior Talent Partner", "Stripe", "recruiting"],
  ["Headhunter", "Korn Ferry", "recruiting"],
  ["HR Recruiter", "TeamLease", "recruiting"],
  ["Sourcer", "Meta", "recruiting"],
  ["Recruitment Consultant", "Michael Page", "recruiting"],
  ["Campus Recruiter", "Deloitte", "recruiting"],
  // Software
  ["Software Engineer", "Google", "software"],
  ["SDE II", "Amazon", "software"],
  ["Sr. Software Developer", "TCS", "software"],
  ["Full-Stack Developer", "Freelance", "software"],
  ["Frontend Engineer", "Swiggy", "software"],
  ["iOS Developer", "Zomato", "software"],
  ["Engineering Manager", "Uber", "software"],
  ["Staff Engineer", "Atlassian", "software"],
  ["Member of Technical Staff", "Oracle", "software"],
  ["Systems Engineer", "Infosys", "software"],
  ["QA Engineer", "Paytm", "software"],
  ["SDET", "Microsoft", "software"],
  ["Engineer", "Google", "software"],
  ["Associate Software Engineer", "Accenture", "software"],
  ["Java Developer", "Wipro", "software"],
  ["Tech Lead", "Flipkart", "software"],
  ["Founding Engineer", "Stealth", "software"],
  ["Desarrollador Web", "Globant", "software"],
  ["Softwareentwickler", "SAP", "software"],
  ["Software Enginner", "Cognizant", "software"],
  // Data & AI
  ["Data Scientist", "Walmart Global Tech", "data_ai"],
  ["Machine Learning Engineer", "NVIDIA", "data_ai"],
  ["Senior Data Analyst", "Swiggy", "data_ai"],
  ["Data Engineer", "Databricks", "data_ai"],
  ["AI Engineer", "OpenAI", "data_ai"],
  ["Business Intelligence Developer", "Microsoft", "data_ai"],
  ["Analytics Manager", "Myntra", "data_ai"],
  ["Applied Scientist", "Amazon", "data_ai"],
  ["NLP Engineer", "Sarvam AI", "data_ai"],
  ["Product Analyst", "CRED", "data_ai"],
  ["Analyst", "Mu Sigma", "data_ai"],
  ["MLOps Engineer", "", "data_ai"],
  // IT & Security
  ["DevOps Engineer", "Tech Mahindra", "it_security"],
  ["Site Reliability Engineer", "LinkedIn", "it_security"],
  ["Cloud Architect", "AWS", "it_security"],
  ["Cybersecurity Analyst", "Deloitte", "it_security"],
  ["Network Engineer", "Cisco", "it_security"],
  ["IT Support Specialist", "Wipro", "it_security"],
  ["System Administrator", "HCL", "it_security"],
  ["Solutions Architect", "Amazon Web Services (AWS)", "it_security"],
  ["SAP FICO Consultant", "Capgemini", "it_security"],
  ["Penetration Tester", "", "it_security"],
  ["Platform Engineer", "Postman", "it_security"],
  // Product
  ["Product Manager", "Google", "product"],
  ["Senior Product Manager", "Razorpay", "product"],
  ["Associate Product Manager", "Meesho", "product"],
  ["Product Owner", "Barclays", "product"],
  ["Group Product Manager", "PhonePe", "product"],
  ["APM", "Microsoft", "product"],
  ["Director of Product", "Freshworks", "product"],
  ["VP Product", "Zepto", "product"],
  ["Product Management Intern", "Swiggy", "product"],
  // Design
  ["Product Designer", "Figma", "design"],
  ["UI/UX Designer", "Freelance", "design"],
  ["Graphic Designer", "", "design"],
  ["UX Researcher", "Google", "design"],
  ["Creative Director", "Ogilvy", "design"],
  ["Interior Designer", "Livspace", "design"],
  ["Fashion Designer", "Sabyasachi", "design"],
  ["Visual Designer", "Adobe", "design"],
  // Core engineering
  ["Mechanical Engineer", "Tata Motors", "engineering"],
  ["Electrical Design Engineer", "Siemens", "engineering"],
  ["VLSI Design Engineer", "Qualcomm", "engineering"],
  ["Civil Engineer", "L&T", "engineering"],
  ["Process Engineer", "Reliance Industries", "engineering"],
  ["Hardware Engineer", "Apple", "engineering"],
  ["Embedded Systems Engineer", "Bosch", "engineering"],
  ["Graduate Engineer Trainee", "Tata Steel", "engineering"],
  ["Production Engineer", "Maruti Suzuki", "engineering"],
  ["Aerospace Engineer", "Boeing", "engineering"],
  ["Engineer", "Tata Steel", "engineering"],
  ["Robotics Engineer", "", "engineering"],
  ["Plant Manager", "Asian Paints", "engineering"],
  // Research
  ["PhD Candidate", "Stanford University", "research"],
  ["Research Scientist", "Google DeepMind", "research"],
  ["Postdoctoral Researcher", "MIT", "research"],
  ["Research Assistant", "IIT Bombay", "research"],
  ["Junior Research Fellow", "CSIR", "research"],
  ["Scientist", "ISRO", "research"],
  ["Economist", "World Bank", "research"],
  ["Research Associate", "", "research"],
  // Healthcare
  ["Doctor", "AIIMS", "healthcare"],
  ["Registered Nurse", "NHS", "healthcare"],
  ["Physiotherapist", "", "healthcare"],
  ["Clinical Research Associate", "IQVIA", "healthcare"],
  ["Pharmacist", "Apollo Pharmacy", "healthcare"],
  ["MBBS", "", "healthcare"],
  ["Resident Doctor", "Fortis", "healthcare"],
  ["Psychologist", "Private Practice", "healthcare"],
  ["Dentist", "Smile Dental Clinic", "healthcare"],
  ["Medical Officer", "Government Hospital", "healthcare"],
  // Legal
  ["Associate", "Cyril Amarchand Mangaldas", "legal"],
  ["Advocate", "High Court of Delhi", "legal"],
  ["Legal Counsel", "Zomato", "legal"],
  ["Corporate Lawyer", "Khaitan & Co", "legal"],
  ["Company Secretary", "HDFC", "legal"],
  ["Compliance Officer", "Kotak", "legal"],
  ["Paralegal", "", "legal"],
  ["General Counsel", "Stripe", "legal"],
  // Finance
  ["Chartered Accountant", "", "finance"],
  ["Investment Banking Analyst", "Goldman Sachs", "finance"],
  ["Analyst", "JPMorgan Chase & Co.", "finance"],
  ["Financial Analyst", "Deloitte", "finance"],
  ["Relationship Manager", "HDFC Bank", "finance"],
  ["Auditor", "EY", "finance"],
  ["Quant Researcher", "Jane Street", "finance"],
  ["Trader", "Optiver", "finance"],
  ["Accountant", "", "finance"],
  ["Tax Consultant", "KPMG", "finance"],
  ["Wealth Manager", "ICICI Bank", "finance"],
  ["Credit Analyst", "Bajaj Finance", "finance"],
  ["Actuarial Analyst", "Swiss Re", "finance"],
  ["Branch Manager", "State Bank of India", "finance"],
  ["Contador", "", "finance"],
  ["Associate", "Morgan Stanley", "finance"],
  // Consulting
  ["Consultant", "McKinsey & Company", "consulting"],
  ["Associate", "Boston Consulting Group (BCG)", "consulting"],
  ["Management Consultant", "", "consulting"],
  ["Senior Consultant", "EY", "consulting"],
  ["Strategy Analyst", "Accenture", "consulting"],
  ["Business Analyst", "McKinsey & Company", "consulting"],
  ["Engagement Manager", "Bain & Company", "consulting"],
  ["Advisor", "", "consulting"],
  // Sales
  ["Account Executive", "Salesforce", "sales"],
  ["Business Development Executive", "Byju's", "sales"],
  ["SDR", "HubSpot", "sales"],
  ["Sales Manager", "Hindustan Unilever", "sales"],
  ["Area Sales Manager", "Asian Paints", "sales"],
  ["Key Account Manager", "Nestle", "sales"],
  ["Sales Engineer", "Siemens", "sales"],
  ["Partnerships Manager", "Swiggy", "sales"],
  ["Software Sales Executive", "Oracle", "sales"],
  ["Medical Representative", "Sun Pharma", "sales"],
  ["BDE", "Unacademy", "sales"],
  ["Pre-Sales Consultant", "Infosys", "sales"],
  // Marketing
  ["Digital Marketing Manager", "", "marketing"],
  ["Product Marketing Manager", "Google", "marketing"],
  ["Brand Manager", "P&G", "marketing"],
  ["SEO Specialist", "Freelance", "marketing"],
  ["Social Media Manager", "Nykaa", "marketing"],
  ["Growth Marketer", "CRED", "marketing"],
  ["Content Marketing Lead", "Zoho", "marketing"],
  ["Corporate Communications Manager", "Tata", "marketing"],
  ["PR Executive", "Adfactors PR", "marketing"],
  ["Community Manager", "Discord", "marketing"],
  ["Copywriter", "Ogilvy", "marketing"],
  // Customer
  ["Customer Success Manager", "Freshworks", "customer"],
  ["Customer Support Executive", "Amazon", "customer"],
  ["Customer Service Representative", "Teleperformance", "customer"],
  ["Customer Experience Lead", "Zomato", "customer"],
  ["Implementation Specialist", "Darwinbox", "customer"],
  ["Process Associate", "Genpact", "customer"],
  // HR
  ["HR Business Partner", "Flipkart", "hr"],
  ["Human Resources Manager", "Infosys", "hr"],
  ["People Operations Specialist", "Stripe", "hr"],
  ["HR Executive", "", "hr"],
  ["Learning & Development Manager", "Wipro", "hr"],
  ["Compensation & Benefits Analyst", "Google", "hr"],
  ["HRBP", "Meesho", "hr"],
  ["Payroll Specialist", "ADP", "hr"],
  // Project
  ["Project Manager", "Cognizant", "project"],
  ["Program Manager", "Microsoft", "project"],
  ["Technical Program Manager", "Amazon", "project"],
  ["Scrum Master", "Capgemini", "project"],
  ["Delivery Manager", "TCS", "project"],
  ["PMO Analyst", "Accenture", "project"],
  ["Project Coordinator", "", "project"],
  // Operations
  ["Operations Manager", "Delhivery", "operations"],
  ["Supply Chain Analyst", "Unilever", "operations"],
  ["Procurement Specialist", "Tata Motors", "operations"],
  ["Logistics Coordinator", "DHL", "operations"],
  ["Executive Assistant", "", "operations"],
  ["Office Manager", "Acme Corp", "operations"],
  ["Warehouse Supervisor", "Amazon", "operations"],
  ["Business Operations Associate", "Uber", "operations"],
  ["Receptionist", "", "operations"],
  ["Manager", "Blue Dart", "operations"],
  ["Management Trainee", "ITC", "operations"],
  // Education
  ["Assistant Professor", "Delhi University", "education"],
  ["Teacher", "Delhi Public School", "education"],
  ["Lecturer", "", "education"],
  ["Math Tutor", "Vedantu", "education"],
  ["Corporate Trainer", "", "education"],
  ["Teaching Assistant", "IIT Madras", "education"],
  ["Principal", "Kendriya Vidyalaya", "education"],
  ["Career Coach", "", "education"],
  ["Profesora", "Colegio San José", "education"],
  // Students
  ["Student", "IIT Delhi", "students"],
  ["B.Tech CSE Undergrad", "VIT", "students"],
  ["MBA Candidate", "Harvard Business School", "students"],
  ["Intern", "Google", "students"],
  ["Summer Intern", "Goldman Sachs", "students"],
  ["Final Year Student", "", "students"],
  ["Campus Ambassador", "Unstop", "students"],
  ["Estudiante", "Universidad de Chile", "students"],
  ["", "Stanford University", "students"],
  ["Aspiring Software Developer | CSE Student", "", "students"],
  ["Fresher", "", "students"],
  ["Google Developer Student Club Lead", "GDSC", "students"],
  // Media & arts
  ["Journalist", "The Hindu", "media"],
  ["Content Creator", "YouTube", "media"],
  ["Photographer", "", "media"],
  ["Author", "", "media"],
  ["Video Editor", "Freelance", "media"],
  ["Actor", "", "media"],
  ["Music Producer", "T-Series", "media"],
  ["Editor", "India Today", "media"],
  ["Professional Cricketer", "BCCI", "media"],
  ["Content Writer", "", "media"],
  ["Technical Writer", "Atlassian", "media"],
  ["Animator", "Technicolor", "media"],
  // Public sector
  ["IAS Officer", "Government of India", "public"],
  ["Indian Army Officer", "Indian Army", "public"],
  ["Policy Analyst", "NITI Aayog", "public"],
  ["Program Officer", "UNICEF", "public"],
  ["Social Worker", "", "public"],
  ["Volunteer", "Red Cross", "public"],
  ["Police Officer", "", "public"],
  ["Lieutenant", "Indian Navy", "public"],
  ["Sustainability Manager", "", "public"],
  ["", "Ministry of External Affairs", "public"],
  // Real estate
  ["Real Estate Agent", "Keller Williams", "real_estate"],
  ["Architect", "Studio Lotus", "real_estate"],
  ["Site Engineer", "Shapoorji Pallonji", "real_estate"],
  ["Property Manager", "", "real_estate"],
  ["Quantity Surveyor", "", "real_estate"],
  ["Realtor", "", "real_estate"],
  ["Construction Manager", "DLF", "real_estate"],
  // Hospitality, retail & trades
  ["Chef", "Taj Hotels", "services"],
  ["Flight Attendant", "Emirates", "services"],
  ["Store Manager", "Decathlon", "services"],
  ["Pilot", "IndiGo", "services"],
  ["Personal Trainer", "Cult.fit", "services"],
  ["Hotel Manager", "Marriott", "services"],
  ["Barista", "Starbucks", "services"],
  ["Electrician", "", "services"],
  ["Farmer", "", "services"],
  ["Driver", "Uber", "services"],
  ["Cashier", "DMart", "services"],
  ["Makeup Artist", "", "services"],
  ["", "Marriott International", "services"],
  // Company-only inference for blank titles
  ["", "Goldman Sachs", "finance"],
  ["", "Apollo Hospitals", "healthcare"],
  ["", "Sequoia Capital", "investors"],
  ["", "Khaitan & Co", "legal"],
  ["", "Teleperformance", "customer"],
  // Typos and abbreviations
  ["Sr Mgr - Mktg", "", "marketing"],
  ["Recuiter", "", "recruiting"],
  ["Accountent", "", "finance"],
  ["Developper", "", "software"],
  ["Enginner", "Siemens", "engineering"],
];

describe("classify: category", () => {
  it.each(CASES)("%s @ %s → %s", (position, company, expected) => {
    const result = classify(position, company);
    expect(result.category, `reasons: ${result.reasons.join(", ")} | alt: ${result.alternative}`).toBe(expected);
  });
});

describe("classify: blank and placeholder titles", () => {
  it.each([
    ["", ""],
    ["--", ""],
    ["N/A", ""],
    ["...", "."],
    ["   ", "  "],
  ])("'%s' @ '%s' has no role information", (position, company) => {
    expect(classify(position, company).category).toBe("unspecified");
  });
});

describe("classify: seniority", () => {
  const cases: Array<[string, Seniority]> = [
    ["Founder & CEO", "Founder"],
    ["CEO", "C-Level"],
    ["Chief Marketing Officer", "C-Level"],
    ["VP Engineering", "VP"],
    ["Senior Vice President, Sales", "VP"],
    ["Director of Product", "Director / Head"],
    ["Head of Growth", "Director / Head"],
    ["Senior Manager", "Manager / Lead"],
    ["Assistant Manager", "Manager / Lead"],
    ["Senior Software Engineer", "Senior"],
    ["SDE2", "Mid-level"],
    ["Founder's Office", "Mid-level"],
    ["Software Engineer", "Mid-level"],
    ["Junior Developer", "Entry-level"],
    ["Product Manager Intern", "Intern"],
    ["Student at IIT Delhi", "Student"],
    ["HR Business Partner", "Mid-level"],
    ["Headhunter", "Mid-level"],
    ["", "Unknown"],
  ];
  it.each(cases)("%s → %s", (position, expected) => {
    expect(classify(position, "").seniority).toBe(expected);
  });
});

describe("classify: tags", () => {
  const cases: Array<[string, string, TagId, boolean]> = [
    ["Software Engineer", "Google", "faang", true],
    ["Recruiter", "Meta", "faang", true],
    ["SDE", "Amazon Web Services (AWS)", "faang", true],
    ["Lead", "Google Developer Student Clubs", "faang", false],
    ["Student Ambassador", "Microsoft Learn Student Ambassadors", "faang", false],
    ["Engineer", "Metamorphosis Labs", "faang", false],
    ["Founder", "Nimbus (YC W23)", "yc", true],
    ["Founder @ Acme (YC S21)", "", "yc", true],
    ["Consultant", "Deloitte USI", "big4", true],
    ["Auditor", "Ernst & Young", "big4", true],
    ["Associate", "Bain & Company", "mbb", true],
    ["Associate", "Bain Capital", "mbb", false],
    ["Analyst", "J.P. Morgan", "top_finance", true],
    ["Research Engineer", "Anthropic", "ai_lab", true],
    ["Principal", "Sequoia Capital India", "top_vc", true],
    ["Engineering Manager | We're hiring!", "Stripe", "hiring", true],
    ["Aspiring Data Analyst | Open to work", "", "open_to_work", true],
  ];
  it.each(cases)("%s @ %s has %s = %s", (position, company, tag, expected) => {
    expect(classify(position, company).tags.includes(tag)).toBe(expected);
  });
});

describe("classify: confidence", () => {
  it("is high for unambiguous titles", () => {
    expect(classify("Technical Recruiter", "Google").confidence).toBe("high");
  });
  it("is low when only the company was informative", () => {
    const r = classify("", "Goldman Sachs");
    expect(r.basis).toBe("company");
    expect(r.confidence).toBe("low");
  });
  it("is low for typo matches", () => {
    expect(classify("Recuiter", "").basis).toBe("fuzzy");
  });
});
