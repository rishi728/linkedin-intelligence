# NetLens

A local-first **network intelligence and outreach workspace** built on your LinkedIn connections export.
Import `Connections.csv` once and NetLens becomes the place you find the right people, understand why they
matter, prepare personalised outreach, track conversations and never miss a follow-up.

Everything runs in the browser. No backend, no API keys, no data leaves the device.

```bash
npm install
npm run dev      # http://localhost:3000 — "Explore with sample data" if you don't have a CSV yet
npm test         # classifier, workspace and Excel-export tests
npm run build    # static production build (deploy to Vercel with zero config)
```

## Uploading a file

Drag any LinkedIn `Connections.csv` onto the start screen (or use `Settings → Data` to import a newer one).
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

| Page | What it's for |
| --- | --- |
| **Home** | What to do today: follow-ups due, suggested next conversations, goals, pipeline |
| **Find people** | Natural-language search ("senior people in supply chain at unilever"), intent shortcuts, guided opportunity mode |
| **People** | Filterable, virtualised explorer (table / cards / compact) with bulk actions |
| **Companies** | Who you know at each company, broken down by domain, seniority and role |
| **Outreach** | Kanban pipeline with drag-and-drop between customisable stages |
| **Follow-ups** | Overdue / today / tomorrow / this week, with done, snooze and reschedule |
| **Analytics** | Domains, functions, roles, seniority, companies, industries, growth, pipeline |
| **Data health** | Unclassified, low-confidence, duplicates and missing fields — each clickable |
| **Settings** | Goals, target companies, pipeline stages, message templates, learned rules, backup |

## Your work is saved as you go

Statuses, notes, follow-ups, classifications, goals and segments are written to this browser's local database
the moment you change them — the sidebar shows when it last saved. A snapshot is kept once a day (last five),
so a bad bulk edit can be rolled back from `Settings → Data`. The Excel export is for **sharing a list with
someone else**, never a requirement for keeping your work safe.

## Bringing in the rest of your LinkedIn export

`Settings → Data → Add archive files` accepts the other CSVs in the export folder:

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
- **Status pills are editable everywhere** — in the table, cards, board, follow-ups and company lists, with undo.
- **Follow-up cadence** — set the day gaps in `Settings → Outreach`; completing one schedules the next.
  `Follow-ups → Add to calendar` exports them as an `.ics` file.

## Classification: Domain → Function → Role → Seniority

`lib/roles.ts` holds ~21 domains, ~80 functions and 300+ roles; `lib/taxonomy.ts` holds the underlying
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
     "Joint Secretary" is a civil servant
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
  exporter.ts       Excel tracker
  workspace/        types, local database, filters, priority, insights, templates
components/
  workspace/store   React state, IndexedDB persistence, all actions
  shell, people, outreach, find, views
```

Your data lives in IndexedDB in this browser. `Settings → Data` exports a JSON backup and resets everything.
