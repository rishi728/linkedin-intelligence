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
        title: "Three numbers, and they all go somewhere",
        body: "Everyone you know, the people worth contacting given what you said you are after, and everyone who has written back. Click any of them.",
      },
      {
        title: "Network overview",
        body: "The whole shape of your network as plain facts, every one of which opens the people behind it.",
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
        title: "Lists, then conversations",
        body: "Group people into lists you name yourself, then work each one as a table: company, status, follow-up date and a link straight to their profile.",
      },
      {
        title: "Follow-ups live on the row",
        body: "Changing a status schedules the next follow-up three days out. When one goes past, the whole row turns red until you act on it.",
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
