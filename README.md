# NetLens

A local-first **network intelligence and outreach workspace** built on your LinkedIn data export.
Drop in the export `.zip` LinkedIn emails you and NetLens becomes the place you find the right people,
understand why they matter, prepare personalised outreach, track conversations and never miss a follow-up.

Everything runs in the browser. No backend, no API keys, no data leaves the device.

```bash
npm install
npm run dev      # http://localhost:3000 — "Explore with sample data" if you have no export yet
npm test         # classifier, workspace, zip, CSV-format and Excel-export tests
npm run build    # static production build (deploy to Vercel with zero config)
```

## Uploading your export

Drag the **whole `.zip`** onto the start screen. Nothing needs unzipping and no files need picking: NetLens
finds `Connections.csv` wherever it sits in the archive, and reads the rest of the export in the same pass, so
your conversation history is there from the first screen. A bare `Connections.csv` still works if that is all
you have.

Add more whenever you like — the **Add data** button sits at the bottom of the sidebar on every page:

- **Another export** merges with what you already have. Somebody in two files is counted once, and
  re-importing after a fresh download just updates the people whose jobs changed.
- **Start fresh** instead replaces the connections while keeping every status, note and correction.
- Either way **everyone is classified again from scratch**, so a new import is a new analysis.

The parser is deliberately forgiving, and `lib/csv-formats.test.ts` covers each of these:

- LinkedIn's "Notes:" preamble, or a file that starts straight at the header
- CRLF line endings, a UTF-8 BOM, trailing blank lines
- Columns in any order, extra columns, odd casing or padded headers
- Quoted values containing commas, semicolon-delimited European exports
- A missing email column, missing titles, missing companies, missing dates
- A single `Name` column instead of first/last (generic contact exports)
- Accented and non-English names and job titles
- 10,000 rows in well under a second

If a file has no recognisable header, the app says so instead of failing silently. Re-importing keeps every
note, status, follow-up and classification, matched by LinkedIn profile URL.

## The workspace

Five places in the sidebar, in the order you use them:

| Page | What it's for |
| --- | --- |
| **Home** | What to do today: follow-ups due, suggested next conversations, goals, pipeline |
| **Find people** | Guided search (area → who → where → relationship, with a live count at each step) or plain language: "senior supply chain people at target companies I haven't contacted" |
| **People** | Filterable, virtualised explorer (table / cards / compact) with bulk actions |
| **Outreach** | Your pipeline as an editable table: status dropdown, next action and follow-up date typed straight into the row |
| **Intelligence** | What kind of people you actually know — by area, job, level or company, every row clickable |

Supporting screens live inside those pages rather than competing with them in the sidebar: **Companies**
(`/companies`), **Follow-ups** (`/follow-ups`), **Outreach session** (`/session`), **Review & improve**
(`/review`), **Data health** (`/health`) and **Settings**.

The "What are you looking for?" cards on **Find people** are built from your own connections, so a network
full of doctors offers Healthcare and one full of engineers does not. Cards with nobody behind them are
hidden, and the number on a card is exactly what you get when you click it.

## Your work is saved as you go

Statuses, notes, follow-ups, classifications, goals and segments are written to this browser's local database
the moment you change them — the sidebar shows when it last saved. A snapshot is kept once a day (last five),
so a bad bulk edit can be rolled back from `Settings → Data`. The Excel export is for **sharing a list with
someone else**, never a requirement for keeping your work safe.

Because storage is per-browser and per-origin, a deployed copy of NetLens gives every visitor their own
private workspace. Nobody can see anyone else's data, and none of it reaches the server.

## The rest of your LinkedIn export

Dropping the `.zip` brings these in automatically. If you only have loose files, **Add data → Choose archive
files** takes them too:

| File | What NetLens does with it |
| --- | --- |
| `messages.csv` | Marks who you have already contacted, who replied, and when you last spoke |
| `Invitations.csv` | Records who invited whom |
| `Notes.csv` | Imports notes you saved on LinkedIn |
| `Education.csv` | Fills in your schools, so alumni are detected automatically |
| `Positions.csv`, `Profile.csv` | Fills in your name and background for message templates |

Only dates, directions and counts are stored. Message text is read to work out who sent what, then discarded.
Nothing is uploaded, and your own status edits are never overwritten by an import.

## Working through people quickly

- **Review** (`/review`) — a keyboard queue for every weak classification: `1`–`9` to pick, `S` to skip,
  `U` when there is nothing to classify. Each fix can become a rule for everyone with that job title.
- **Outreach session** (`/session`) — walks a shortlist one person at a time with the message ready:
  `C` copy, `O` open LinkedIn, `S` sent, `K` skip, `N` not a fit. Marking sent schedules the next follow-up.
- **⌘K / Ctrl-K** — jump to any page, person, company or saved segment.
- **Status pills are editable everywhere** — in every table, card, list and follow-up, with undo. The menu is
  rendered above the page, so it is never clipped by a scrolling list.
- **Follow-up cadence** — set the day gaps in `Settings → Outreach`; completing one schedules the next.
  `Follow-ups → Add to calendar` exports them as an `.ics` file.

## Classification: Domain → Function → Role → Seniority

`lib/roles.ts` holds 22 domains, 84 functions and 357 roles; `lib/taxonomy.ts` holds the underlying
category rules, employer dictionary and tags. For every connection NetLens produces a hierarchy plus an
industry (from the employer only), a confidence score and the evidence behind it.

1. **Manual edits win.** Anything you set by hand is never overwritten, including after a re-import.
2. **Your rules come next.** Correct a classification and NetLens offers to remember it for everyone with
   that job title (`Settings → Rules`, exportable as `custom_rules.json`).
3. **Automatic matching.** Longest-phrase-first role matching over the title, in context:
   - "AI Product Manager" beats "Product Manager"; "Product Manager" ≠ "Project Manager"
   - Ambiguous abbreviations (PM, TA, AM, BA, GET, MT) only count when the rest of the title or the
     employer agrees
   - "Manager - Category" and "Executive, Production" are read in both word orders
   - Campus organisations are detected, so a club "Joint Secretary" is a student and a ministry
     "Joint Secretary" is a civil servant. A college employer never implies corporate seniority: "Marketing
     Lead" at a college fest is Student, "Marketing Lead" at a company is not
   - Founders are a first-class flag, so "Founding Engineer", "Founder's Office" and "Ex-Founder" are
     correctly left out of founder searches
   - Typo-tolerant fallback ("Recuiter" → Recruiter), then employer-only inference

Confidence below 60% is flagged **Needs review**. Only people with no title *and* no recognisable employer
stay unclassified.

## Priority is a rule, not a guess

`lib/workspace/priority.ts` scores each person against the goals you set: target function, target domain,
target company, matching seniority, recruiter when you are job hunting, a hiring signal, a shared school,
whether they have replied to you before, who invited whom, and whether you have an email address — minus a
penalty when the role is uncertain. Every weight is adjustable in `Settings → Outreach`, every person's panel
lists the exact reasons, and you can override the level by hand.

## Excel export

Pick the rows (any filter or selection) and the columns, then export a real tracker: frozen header row,
auto-filter, sensible widths, formatted dates, dropdown validation for Status / Priority / Channel /
Opportunity type, overdue follow-ups highlighted, and an optional summary sheet.

## Where things live

```
lib/
  text.ts           normalisation: abbreviations, plurals, accents, headline splitting
  taxonomy.ts       category rules, employer dictionary, tags, seniority
  classifier.ts     phrase matching and scoring
  roles.ts          Domain → Function → Role dictionary
  intelligence.ts   hierarchy + campus detection + confidence + custom rules
  analyzer.ts       LinkedIn CSV parsing
  zip.ts            reads the export .zip in the browser
  exporter.ts       Excel tracker
  workspace/        types, local database, filters, priority, insights, templates
components/
  workspace/store   React state, IndexedDB persistence, all actions
  shell, people, outreach, find, views
```

Your data lives in IndexedDB in this browser. `Settings → Data` exports a JSON backup and resets everything.
