// What Pip says on each page, the first time you open it. Every line describes
// something the page genuinely does; none of it is marketing.

export interface GuideStep {
  title: string;
  body: string;
}

export interface Tour {
  /** Matches the route, and is what gets recorded once the tour is finished. */
  key: string;
  steps: GuideStep[];
}

export const TOURS: Tour[] = [
  {
    key: "/home",
    steps: [
      {
        title: "This is your morning read",
        body: "Today tells you what is waiting: follow-ups due, people worth reaching out to, profiles that need a quick check. Every number here is a link.",
      },
      {
        title: "People worth talking to",
        body: "Ranked against the goals you set in Settings, with the reason shown underneath. Use the arrows to flick through them.",
      },
      {
        title: "Worth noticing",
        body: "One observation worked out from your own connections, like the largest area in your network or how many founders you have never spoken to.",
      },
    ],
  },
  {
    key: "/find",
    steps: [
      {
        title: "Two ways to find someone",
        body: "Guided walks you through area, seniority, company and relationship, showing how many people are left at each step. Describe it lets you type what you want in plain words.",
      },
      {
        title: "Try asking properly",
        body: "“senior people in supply chain” or “founders I haven't contacted” both work. It shows you how it understood you before it searches.",
      },
    ],
  },
  {
    key: "/people",
    steps: [
      {
        title: "Everyone you know, filtered",
        body: "The filters group into Who, Role, Where, Relationship and Outreach. Counts next to each option reflect the filters you have already picked.",
      },
      {
        title: "Change a status without leaving",
        body: "The status pill on any row is a dropdown. Click a person to open their profile beside the list, so you keep your place.",
      },
    ],
  },
  {
    key: "/outreach",
    steps: [
      {
        title: "Your pipeline, as a table",
        body: "Everyone you have added, with status, next action and follow-up date editable straight in the row. It saves as you type.",
      },
      {
        title: "Work through them one at a time",
        body: "Start a session deals with people one by one, with a message ready and a follow-up scheduled the moment you mark one sent.",
      },
    ],
  },
  {
    key: "/follow-ups",
    steps: [
      {
        title: "Only what is due",
        body: "Grouped into overdue, today, this week and later. Done moves the person to the next step of your cadence automatically.",
      },
    ],
  },
  {
    key: "/analytics",
    steps: [
      {
        title: "The shape of your network",
        body: "Each bar splits into people in your pipeline, people you have spoken to, and people you have not contacted. Click any part of a bar to open exactly those people.",
      },
      {
        title: "Look at it four ways",
        body: "Area, Job, Level and Company all rebuild the same view, so you can find where the openings actually are.",
      },
    ],
  },
  {
    key: "/companies",
    steps: [
      {
        title: "Who you know, by employer",
        body: "Star a company to make it a target, which pushes its people up your priority list everywhere else.",
      },
    ],
  },
  {
    key: "/review",
    steps: [
      {
        title: "Fix a job title once",
        body: "These are the people whose title was hard to place. Correcting one can teach a rule that applies to everyone with the same title.",
      },
    ],
  },
];

export const TOUR_MAP = new Map(TOURS.map((t) => [t.key, t]));
