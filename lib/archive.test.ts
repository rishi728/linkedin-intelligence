import { describe, expect, it } from "vitest";
import { describeArchive, detectArchiveFile, parseArchive, profileKey } from "./archive";

const ME = "https://www.linkedin.com/in/me";
const ASHA = "https://www.linkedin.com/in/asharao";
const LI = "https://www.linkedin.com/in/liwei";
const PRIYA = "https://www.linkedin.com/in/priyanair";

const messages = `"CONVERSATION ID","CONVERSATION TITLE","FROM","SENDER PROFILE URL","TO","RECIPIENT PROFILE URLS","DATE","SUBJECT","CONTENT","FOLDER","ATTACHMENTS","IS MESSAGE DRAFT","IS CONVERSATION DRAFT"
"c1","","Me","${ME}","Asha Rao","${ASHA}","2026-02-01 10:00:00 UTC","","Hi Asha, quick question","INBOX","","false","false"
"c1","","Asha Rao","${ASHA}","Me","${ME}","2026-02-03 09:00:00 UTC","","Happy to help
(multi-line reply)","INBOX","","false","false"
"c2","","Me","${ME}","Li Wei","${LI}","2025-11-20 08:00:00 UTC","","Hello Li","INBOX","","false","false"
"c3","","Priya Nair","${PRIYA}","Me","${ME}","2026-03-05 12:00:00 UTC","","Are you looking for interns?","INBOX","","false","false"
"c4","","Me","${ME}","Asha Rao","${ASHA}","2026-04-01 12:00:00 UTC","","draft never sent","INBOX","","true","false"`;

const invitations = `From,To,Sent At,Message,Direction,inviterProfileUrl,inviteeProfileUrl
Me,Asha Rao,2024-01-10 10:00:00 UTC,,OUTGOING,${ME},${ASHA}
Priya Nair,Me,2025-06-02 10:00:00 UTC,Let's connect,INCOMING,${PRIYA},${ME}`;

const notes = `Connection First Name,Connection Last Name,Connection Profile URL,Note,Created On,Edited On
Li,Wei,${LI},Met at the supply chain summit,2025-11-01,2025-11-01`;

const education = `School Name,Start Date,End Date,Notes,Degree Name,Activities
National Institute of Technology Warangal,2022,2026,,B.Tech,Business Club`;

const positions = `Company Name,Title,Description,Location,Started On,Finished On
Blue Yonder,Supply Chain Intern,,Hyderabad,May 2025,Jul 2025`;

const profile = `First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary,Industry,Zip Code,Geo Location,Twitter Handles,Websites,Instant Messengers
Rishi,Agrawal,,,,Final-year B.Tech | Supply chain & product,,Higher Education,,"Hyderabad, India",,,`;

const FILES = [
  { name: "messages.csv", text: messages },
  { name: "Invitations.csv", text: invitations },
  { name: "Notes.csv", text: notes },
  { name: "Education.csv", text: education },
  { name: "Positions.csv", text: positions },
  { name: "Profile.csv", text: profile },
];

describe("detectArchiveFile", () => {
  it.each([
    [messages, "messages"],
    [invitations, "invitations"],
    [notes, "notes"],
    [education, "education"],
    [positions, "positions"],
    [profile, "profile"],
    ["First Name,Last Name,URL,Company,Position,Connected On\nA,B,,C,D,15 Jan 2024", "connections"],
    ["totally,unrelated\n1,2", "unknown"],
  ])("recognises the file from its header", (text, kind) => {
    expect(detectArchiveFile(text)).toBe(kind);
  });
});

describe("parseArchive", () => {
  const result = parseArchive(FILES);

  it("works out conversation history per person, in both directions", () => {
    const asha = result.history[profileKey(ASHA)];
    expect(asha).toMatchObject({
      messageCount: 2,
      youMessaged: true,
      theyReplied: true,
      lastOutgoingAt: "2026-02-01",
      lastIncomingAt: "2026-02-03",
      lastMessageAt: "2026-02-03",
    });

    const li = result.history[profileKey(LI)];
    expect(li).toMatchObject({ messageCount: 1, youMessaged: true, theyReplied: false, note: "Met at the supply chain summit" });

    const priya = result.history[profileKey(PRIYA)];
    expect(priya).toMatchObject({ messageCount: 1, youMessaged: false, theyReplied: true, invited: "them" });
  });

  it("never treats you as one of your own contacts", () => {
    expect(result.history[profileKey(ME)]).toBeUndefined();
  });

  it("ignores drafts", () => {
    expect(result.history[profileKey(ASHA)].messageCount).toBe(2);
  });

  it("records who invited whom", () => {
    expect(result.history[profileKey(ASHA)].invited).toBe("you");
    expect(result.history[profileKey(PRIYA)]).toMatchObject({ invited: "them", invitedAt: "2025-06-02" });
  });

  it("picks up your own profile, schools and roles", () => {
    expect(result.profile).toMatchObject({ name: "Rishi Agrawal", location: "Hyderabad, India" });
    expect(result.schools).toEqual(["National Institute of Technology Warangal"]);
    expect(result.positions[0]).toMatchObject({ company: "Blue Yonder", title: "Supply Chain Intern" });
  });

  it("summarises what it found and lists files it could not use", () => {
    expect(describeArchive(result)).toContain("messages");
    expect(parseArchive([{ name: "Receipts.csv", text: "order,amount\n1,2" }]).skipped).toEqual(["Receipts.csv"]);
  });

  it("normalises profile URLs so they match the connections file", () => {
    expect(profileKey("https://WWW.LinkedIn.com/in/AshaRao/?trk=x")).toBe("linkedin.com/in/asharao");
  });
});
