// Generates a fictional Connections.csv in LinkedIn's exact export format so
// people can try NetLens before requesting their own archive.

const FIRST = ["Aarav", "Priya", "Liam", "Sofia", "Noah", "Ananya", "Mateo", "Emma", "Kabir", "Olivia", "Rohan",
  "Isabella", "Arjun", "Mia", "Lucas", "Diya", "Ethan", "Zara", "Vihaan", "Chloe", "Aditya", "Maya", "Leo",
  "Ishita", "Omar", "Hannah", "Kenji", "Fatima", "Daniel", "Meera", "Samuel", "Aisha", "Nikhil", "Grace", "Yusuf",
  "Neha", "Carlos", "Ava", "Siddharth", "Lena", "Jonas", "Tara", "Ravi", "Elena", "Kwame", "Sara", "Hiro", "Nora"];
const LAST = ["Sharma", "Patel", "Smith", "Garcia", "Kim", "Iyer", "Müller", "Rossi", "Nguyen", "Khan", "Brown",
  "Reddy", "Silva", "Chen", "Mehta", "Johnson", "Das", "Lopez", "Singh", "Martin", "Gupta", "Okafor", "Tanaka",
  "Kapoor", "Wilson", "Nair", "Fernandes", "Rao", "Ali", "Taylor", "Bose", "Andersen", "Joshi", "Moreau", "Verma"];

// [position, company, relative frequency]
const PROFILES: Array<[string, string, number]> = [
  ["Software Engineer", "Google", 6], ["SDE II", "Amazon", 5], ["Senior Software Engineer", "Microsoft", 4],
  ["Frontend Developer", "Swiggy", 3], ["Backend Engineer", "Razorpay", 3], ["Full Stack Developer", "Freelance", 2],
  ["Engineering Manager", "Uber", 2], ["Systems Engineer", "Infosys", 4], ["QA Engineer", "Paytm", 2],
  ["Data Scientist", "Walmart Global Tech", 3], ["Machine Learning Engineer", "NVIDIA", 2], ["Data Analyst", "Zomato", 3],
  ["AI Engineer", "Sarvam AI", 1], ["Research Engineer", "OpenAI", 1], ["Member of Technical Staff", "Anthropic", 1],
  ["DevOps Engineer", "Tech Mahindra", 2], ["Site Reliability Engineer", "LinkedIn", 1], ["Cybersecurity Analyst", "Deloitte", 1],
  ["Product Manager", "Google", 3], ["Associate Product Manager", "Meesho", 2], ["Senior Product Manager", "Stripe", 1],
  ["Product Designer", "Figma", 2], ["UI/UX Designer", "Freelance", 2], ["Graphic Designer", "Ogilvy", 1],
  ["Founder & CEO", "Stealth Startup", 3], ["Co-Founder", "Nimbus Labs (YC W23)", 2], ["Founder", "Chai & Code", 1],
  ["Business Owner", "Sharma Traders", 1], ["CEO", "Acme Robotics", 1], ["CTO", "FinStack", 1], ["Managing Director", "Accenture", 1],
  ["Partner", "Sequoia Capital", 1], ["Angel Investor", "", 1], ["Principal", "Accel", 1], ["Investment Associate", "Blume Ventures", 1],
  ["Technical Recruiter", "Google", 2], ["Talent Acquisition Specialist", "Amazon", 2], ["Senior Recruiter", "Meta", 1],
  ["HR Business Partner", "Flipkart", 2], ["People Operations Manager", "Notion", 1],
  ["Account Executive", "Salesforce", 2], ["Business Development Manager", "Byju's", 2], ["Area Sales Manager", "Asian Paints", 1],
  ["Digital Marketing Manager", "Nykaa", 2], ["Product Marketing Manager", "Adobe", 1], ["Brand Manager", "Unilever", 1],
  ["Customer Success Manager", "Freshworks", 2], ["Customer Support Executive", "Teleperformance", 1],
  ["Consultant", "McKinsey & Company", 2], ["Associate", "Boston Consulting Group (BCG)", 1], ["Senior Consultant", "EY", 2],
  ["Investment Banking Analyst", "Goldman Sachs", 2], ["Chartered Accountant", "KPMG", 2], ["Relationship Manager", "HDFC Bank", 2],
  ["Quant Researcher", "Jane Street", 1], ["Financial Analyst", "JPMorgan Chase & Co.", 2],
  ["Project Manager", "Cognizant", 2], ["Technical Program Manager", "Microsoft", 1], ["Scrum Master", "Capgemini", 1],
  ["Operations Manager", "Delhivery", 2], ["Supply Chain Analyst", "Procter & Gamble", 1], ["Executive Assistant", "Tata Sons", 1],
  ["Legal Counsel", "Zomato", 1], ["Associate", "Cyril Amarchand Mangaldas", 1], ["Company Secretary", "Reliance Industries", 1],
  ["Doctor", "AIIMS", 1], ["Registered Nurse", "NHS", 1], ["Clinical Research Associate", "IQVIA", 1], ["Pharmacist", "Apollo Pharmacy", 1],
  ["Mechanical Engineer", "Tata Motors", 2], ["VLSI Design Engineer", "Qualcomm", 1], ["Civil Engineer", "Larsen & Toubro", 1],
  ["PhD Candidate", "Stanford University", 2], ["Research Scientist", "Google DeepMind", 1], ["Research Assistant", "IISc", 1],
  ["Assistant Professor", "IIT Bombay", 1], ["Teacher", "Delhi Public School", 1], ["Corporate Trainer", "NIIT", 1],
  ["Student", "IIT Delhi", 4], ["B.Tech CSE Undergrad", "VIT", 3], ["Software Engineering Intern", "Microsoft", 2],
  ["MBA Candidate", "Indian School of Business", 1], ["Summer Intern", "Deloitte", 1],
  ["Content Creator", "YouTube", 1], ["Journalist", "The Hindu", 1], ["Photographer", "Freelance", 1],
  ["Policy Analyst", "NITI Aayog", 1], ["Program Officer", "UNICEF", 1], ["Captain", "Indian Army", 1],
  ["Architect", "Studio Lotus", 1], ["Real Estate Consultant", "JLL", 1],
  ["Hotel Manager", "Marriott International", 1], ["Flight Attendant", "Emirates", 1], ["Store Manager", "Decathlon", 1],
  ["Engineering Manager | We're hiring!", "Postman", 1], ["Aspiring Data Analyst | Open to work", "", 1],
  ["", "", 3], ["", "Tata Consultancy Services", 1],
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function generateSampleCsv(count = 640, seed = 7): string {
  const rand = rng(seed);
  const weighted = PROFILES.flatMap((p) => Array(p[2]).fill(p) as Array<[string, string, number]>);
  const start = new Date(2015, 8, 1).getTime();
  const end = new Date(2026, 7, 31).getTime();
  const rows: string[] = [];

  for (let i = 0; i < count; i++) {
    const [position, company] = weighted[Math.floor(rand() * weighted.length)];
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    // Skew dates toward recent years, like real networks.
    const d = new Date(start + (end - start) * Math.sqrt(rand()));
    const date = `${String(d.getDate()).padStart(2, "0")} ${MON[d.getMonth()]} ${d.getFullYear()}`;
    const slug = `${first}-${last}-${i}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]/g, "");
    rows.push([first, last, `https://www.linkedin.com/in/${slug}`, "", company, position, date].map(csvCell).join(","));
  }

  return [
    "Notes:",
    '"When exporting your connection data, you may notice that some of the email addresses are missing. You will only see email addresses for connections who have allowed their connections to see or download their email address using this setting https://www.linkedin.com/psettings/privacy/email. You can learn more here https://www.linkedin.com/help/linkedin/answer/261"',
    "",
    "First Name,Last Name,URL,Email Address,Company,Position,Connected On",
    ...rows,
  ].join("\n");
}
