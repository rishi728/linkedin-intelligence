# NetLens — Complete Feature Inventory

A local-first **network intelligence + outreach workspace** built on a LinkedIn
`Connections.csv` export. It classifies every connection into a role hierarchy,
scores who is worth contacting, and runs the whole outreach pipeline in-app.
Next.js 16 (App Router) + React 19 + Tailwind 4 + TypeScript. No backend, no API
key, no account, no network calls unless the user clicks a research link.

---

## 1. Data input

1. Upload any LinkedIn `Connections.csv` by drag-and-drop or file picker.
2. Tolerant CSV parser: skips LinkedIn's "Notes:" preamble by scanning for the real header row, handles BOM, CRLF, quoted multi-line fields, and auto-detects the delimiter (comma / semicolon / tab).
3. Header aliasing, so exports in different shapes still work: `First Name` / `Last Name` / `Full Name`, `Email Address` / `Email`, `Company` / `Organization`, `Position` / `Title` / `Headline`, `Connected On` / `Connected`, `URL` / `Profile URL`.
4. Clear, non-technical error when the file isn't a connections export (`CsvFormatError`) instead of a silent empty state.
5. Handles 7,000+ rows; a full parse + classify of 7,293 connections runs in roughly 250 ms.
6. Built-in sample dataset ("try it without my data") that generates a realistic synthetic network so the whole app can be explored before uploading anything.
7. Re-import at any time: new connections are added, existing people keep every status, note, follow-up and manual classification the user set.
8. **Optional LinkedIn archive import** — drop in `messages.csv`, `Invitations.csv`, `Education.csv`, `Positions.csv`, `Profile.csv` from the full LinkedIn export.
9. Archive import works out *who you are* automatically (most frequent participant across message threads) so the direction of each conversation is known.
10. From the archive it derives, per connection: message count, first/last message date, who sent first, whether they ever replied, and whether the invitation came from them or from you.
11. **Message text is never stored.** It is read only to determine direction and then discarded; drafts are skipped entirely.
12. Archive import also fills in the user's own name and schools (used for alumni matching) and seeds pipeline statuses — without overwriting anything the user set by hand.

## 2. Classification engine (the core)

13. Every connection is placed in a 4-level hierarchy: **Domain → Function → Role → Seniority**.
14. 22 domains (Leadership & Founders, Strategy & Consulting, Product, Design, Engineering, Technology & IT, Data & AI, Finance, Sales & BD, Marketing, Customer Success, People & Talent, Operations, Legal & Compliance, Healthcare & Life Sciences, Research & Science, Education & Mentoring, Students & Early Career, Media & Creative, Government/Policy/Impact, Real Estate & Construction, Hospitality/Retail/Services).
15. 84 functions and 357 named roles underneath them.
16. **No "Other" or "Miscellaneous" bucket, by design.** The only unassigned state is "Role not shared", reserved for connections whose CSV row genuinely contains no title — on a real 7,293-person file that was 351 rows (~95% classified).
17. Every function has a *generalist* fallback role (e.g. "Supply Chain Professional", "Engineer") so a bare function noun never produces a wrong specific title.
18. Context-aware disambiguation: Product Manager ≠ Project Manager, Product Designer ≠ Graphic Designer, Business Analyst ≠ Data Analyst, "Chief … Officer" variants, Founder's Office vs Founder.
19. Weighted phrase scoring — strong / medium / weak / weakest signals, plus separate company-derived signals capped so an employer can never outrank an explicit job title.
20. `DOMAIN_CAPS`: industry nouns ("healthcare", "fintech") are capped below role words, so "Software Engineer at a healthcare company" stays Engineering.
21. `~weak` phrases only fire when the surrounding domain agrees, killing a large class of false positives.
22. Headline splitting with positional weights: the part before "|" or "@" counts most (1.0), later segments less (0.7), and `Ex-`/`Former` segments barely at all (0.25) — so "PM at Acme | Ex-Google" classifies as Product, not Google.
23. **Past companies are extracted separately** from `Ex-`/`Former`/`Previously` segments and become their own filter.
24. Deep tokenizer: diacritic folding, abbreviation expansion (SDE, SWE, BD, TA, PM, HR…), singularization with an exception list, letter-digit splitting (`SDE2` → `sde 2`), and preservation of `C++`, `C#`, `&`, apostrophes.
25. Longest-phrase, non-overlapping matching so multi-word titles beat their parts.
26. Word-order variants for hyphenated titles like "Manager - Category" → "Category Manager".
27. Typo tolerance via Damerau-Levenshtein fallback for near-miss title words.
28. Campus-organisation detection: student clubs, chapters, societies and fests are recognised as campus roles rather than corporate jobs.
29. Seniority inference across 11 levels — Founder, C-Level, VP, Director / Head, Manager / Lead, Senior, Mid-level, Entry-level, Intern, Student, Unknown.
30. Individual-contributor guard: "Engineering Manager" is seniority Manager, but "Product Manager" or "Account Manager" is not.
31. "Aspiring / Incoming / Seeking" titles are handled as intent, not as the job.
32. Industry inferred from the employer where the company is recognised.
33. System tags applied automatically: FAANG, Big Tech, AI Labs, YC, Big 4, MBB, Wall Street, Top VC, Hiring, Open to Work — each with exclusion lists to stop lookalike names matching.
34. Every classification carries a **confidence percentage** and a plain-English "why" (the exact phrases that matched, plus the runner-up interpretation).

## 3. Correction & learning

35. Any person's Domain / Function / Role can be overridden by hand from their profile, and the override persists forever.
36. Precedence is fixed and visible: **manual override > learned rule > automatic**. A manual edit is never re-run over.
37. On correcting someone, the user can choose "apply to all with this exact title" — which creates a reusable custom rule and immediately reports how many other people it changed.
38. Custom rules are listed, editable and deletable in Settings; each shows the example title it was learned from.
39. Every person shows a badge for how they were classified (auto / rule / manual) and their confidence.
40. **Review queue** — a dedicated page that walks through low-confidence and ambiguous people one at a time, offering the top candidate interpretations as one-click buttons, plus a manual picker, with undo on every decision.

## 4. Finding people

41. "Find People" hero page built around one question: *What are you looking for?*
42. 13 one-click intents: Product, Consulting, Supply Chain, Operations, Finance, AI/ML, Software, Founders, Mentors, Recruiters, Referrals, Internships, Jobs.
43. 7 audience shortcuts: Peers, Alumni, Managers, Directors & Heads, Founders, Recruiters, Executives.
44. **Natural-language search** — "senior people in supply chain", "product managers at google not contacted" are parsed into real structured filters (function + seniority + company + status) rather than string matching.
45. **Opportunity wizard** — a 4-step guided flow (what are you looking for → which area → who to reach → anything else) that ends in a ready-made, filtered shortlist for off-campus outreach.
46. Full filter set: domain, function, role, seniority, company, industry, location, connected-after/before, connected-within-N-days, dormant ties, has email, has LinkedIn, status, priority, tags, audience, target companies only, needs review, data-health issue, follow-up state, conversation history (messaged / replied / no reply / never / they invited you), past companies.
47. Active filters render as removable chips with a plain-English description of the current view.
48. **Saved segments** — name any filter combination and it becomes a live view that stays up to date as the data and pipeline change.

## 5. People explorer

49. Three display modes for the same list: **Table**, **Cards**, **Compact**.
50. Virtualised rendering (including a lane-based virtualiser for the card grid) so 7,000+ rows scroll smoothly.
51. Seven sort orders: Best match, Recently connected, Name A–Z, Company, Seniority, Follow-up date, Lowest confidence.
52. Multi-select with bulk status changes across the whole selection.
53. Bulk export of exactly the current selection or the current filter.
54. Inline status menu on every row — change someone's pipeline stage without leaving the list.

## 6. Person profile

55. Slide-over profile panel with everything known about one person.
56. Shows the raw CSV position text next to the interpreted hierarchy, so the app never hides what it inferred vs what was given.
57. Classification block with confidence, reasoning, alternative interpretation, an edit control and a "reset to automatic" action.
58. **Priority explanation**: the exact list of scoring reasons that applied to this person ("Works at Google, a target company", "Shares your school", "They replied to you").
59. Relationship history from the archive: messages exchanged, who reached out first, whether they replied, when you last spoke.
60. Editable CRM fields: status, priority, channel, opportunity type, response, next action, last contacted, follow-up date, free-text notes, user tags, and a location the user can fill in.
61. Personalization memory: why you're reaching out, what you know about them, common context, your ask, personal notes — reused by the message composer.
62. Per-person activity log (status changes, notes, follow-ups, classification edits, messages) with timestamps.
63. **User-triggered research only** — seven one-click search links (person, company, company + role, careers page, recent news, company on LinkedIn, others in this role) that open a normal search in a new tab. Nothing is fetched, scraped or crawled automatically, ever.
64. Direct link out to the person's LinkedIn profile for the manual part of the workflow.

## 7. Company intelligence

65. Companies page grouping the whole network by employer, with fuzzy name normalisation so "Blinkit" and "Blinkit (formerly Grofers)" merge.
66. Per-company breakdowns: domain mix, seniority mix, most common roles.
67. **"Best ways in"** — ranked suggestions of which specific people at that company to approach, based only on the user's own data (prior replies, shared campus, seniority, email availability).
68. **Target companies** — star any company; membership feeds priority scoring, filters and the home page.
69. Filter the company list to targets only, search companies, and jump straight to the filtered people list for any company.

## 8. Outreach pipeline (CRM)

70. 13 default statuses out of the box: Not contacted, To contact, Contacted, Awaiting response, Follow-up, Replied, Call scheduled, Interested, Referral, Opportunity, Not interested, Closed, Do not contact.
71. **Statuses are fully customisable** — rename, recolour (9 tones), choose which appear as kanban columns, set the kind (idle / active / positive / closed), and set a default follow-up interval per status.
72. Kanban board with one-click movement between columns and per-card context actions.
73. Every status change is a single click and is instantly undoable via a toast.
74. Changing status auto-stamps the contact date and schedules the next follow-up according to the cadence; closing someone clears their reminders.
75. Configurable **follow-up cadence** (default 5 / 9 / 14 days, add or remove steps, or turn it off) — completing one follow-up advances to the next step.
76. Suggested next action generated for each person based on their current stage.
77. Channel, purpose, opportunity type and response are all recorded from predefined lists (LinkedIn / Email / Phone / WhatsApp / In person / intro; Internship / Full-time / Referral / Mentorship / Project / Research / Consulting / Freelance / Startup; Positive / Neutral / Declined / Asked for resume / Offered referral / Scheduled a call…).

## 9. Message composer

78. 7 built-in templates (Referral request, Quick advice, Mentorship, Introduction, Internship enquiry, Job opportunity, Catch up) — fully editable, and the user can add their own.
79. 10+ merge variables: first name, full name, company, role, position, reason, ask, common context, your name, your background.
80. `readableRole()` inserts a sensible role phrase instead of pasting an entire LinkedIn headline into the message.
81. Missing variables render as visible `[placeholders]` rather than blanks, so a half-finished message can never be sent by accident.
82. Live LinkedIn connection-note character limit with an over-limit warning.
83. The user's background is saved to their profile the first time they type it.
84. Drafts are stored per person; edits survive closing the composer.
85. **Copy to clipboard + open profile** — the app never sends anything. Sending is always a deliberate human act in LinkedIn or the user's email client.

## 10. Focus session mode

86. "Session" turns any shortlist into a one-person-at-a-time queue, ordered by priority score, automatically skipping closed and already-contacted people.
87. Each card shows the person, their context, and a pre-rendered message ready to edit.
88. Keyboard-driven: single keys to copy, mark sent, skip or mark not-interested.
89. Marking sent sets status, contact date, channel, follow-up and saves the draft in one action.
90. Live session counters (sent / skipped) and progress through the queue.

## 11. Follow-up center

91. Dedicated page bucketing everything due: **Overdue, Today, Tomorrow, This week, Later**.
92. One-click "done" (which advances the cadence), snooze, and jump-to-person.
93. Undo on every follow-up action.
94. **Calendar export** — generates a standards-compliant `.ics` file with one all-day event and a reminder per scheduled follow-up, importable into Google Calendar / Outlook / Apple Calendar. Closed people are excluded.

## 12. Home / dashboard

95. Action-oriented home page, not a chart wall: what to do today, who to contact, what's overdue.
96. Headline action cards: people in network / companies, best matches for your goals, follow-ups due, pipeline size.
97. Four relationship shortcuts: they replied to you, messaged with no reply, connected in the last 30 days, dormant ties — each a live filtered view.
98. "Suggested for you" — highest-priority uncontacted people in the user's target areas, with inline status actions.
99. Goals summary card, pipeline snapshot and saved segments, each one click from the relevant page.
100. Archive-import prompt shown until the user adds their conversation history.

## 13. Analytics

101. Connections by domain, function, exact role, seniority, company and industry — every bar is clickable and drills through to that filtered people list.
102. **Network growth** — cumulative connections by month, from `Connected On`.
103. Relationship mix: replied / messaged-no-reply / they invited you / never messaged.
104. **Replies by seniority**, deliberately shown as raw counts ("7 of 31") rather than percentages, so small samples aren't over-read.
105. Outreach pipeline funnel across the user's own statuses.
106. Top-line stats: in pipeline, follow-ups due, target-company contacts, needs review, plus how many were classified by the user vs automatically.

## 14. Data health

107. Dedicated page counting every data quality issue: duplicates, missing position, missing company, missing email, missing LinkedIn URL, unclassified, low confidence, manually classified.
108. Each issue is a one-click filter into the exact affected people.
109. Coverage meters showing what proportion of the network has each field.
110. Surfaces the custom rules the user has taught the app, with a jump to manage them.

## 15. Excel export

111. 25 available export columns, with an interactive column picker and a chosen file name.
112. Sensible 18-column default, plus an optional Summary sheet.
113. Exports exactly what's on screen: current filter, current selection, a saved segment, or a company.
114. Real Excel tracker features: frozen header row and first column, autofilter, column widths, wrapped text for long fields, clickable LinkedIn hyperlinks, true date cells.
115. **Dropdown data validation** on Status, Priority, Channel and Opportunity Type — driven off a hidden Lists sheet, so the exported file stays a usable tracker for whoever receives it.
116. Conditional formatting on priority/status so the sheet is readable at a glance.
117. Export is framed as *for sharing*, never as the safety net — the app itself is the source of truth.

## 16. Storage, safety and privacy

118. **Everything is local.** The CSV never leaves the browser; there is no server, no upload, no telemetry, no account, no API key.
119. Persisted in IndexedDB: dataset, per-person records, settings, archive, snapshots, and last-saved timestamp.
120. Debounced auto-save (350 ms) on every change, with a live "Saved locally · 2 minutes ago" indicator in the sidebar.
121. **Daily snapshots** — the first change each day snapshots all user edits; the last 5 are kept and any one can be restored with a confirmation.
122. Full backup export / import as a single versioned JSON file (v3), for moving between browsers or machines.
123. Workspace reset with confirmation.
124. The app never claims to know anything that isn't in the CSV, in the archive, or explicitly retrieved by the user clicking a research link.
125. No automatic scraping or crawling of LinkedIn. No automatic message sending. Both are structural guarantees, not settings.

## 17. Settings

126. **Goals** — opportunity types, target domains, target functions, target seniorities and target audiences; these drive priority and every suggestion.
127. **Profile** — your name, your background (used in messages), and your schools (used for alumni matching).
128. **Target companies** — add, search, remove.
129. **Pipeline** — full status editor (label, tone, board visibility, kind, follow-up days), add and remove statuses.
130. **Outreach** — cadence editor and 10 adjustable priority weight sliders (target function 35, target domain 28, target company 25, seniority 15, recruiter 12, replied 12, alumni 10, hiring 8, they invited you 6, has email 4), with a reset to defaults.
131. **Templates** — create, edit, delete message templates with purpose and channel.
132. **Rules** — manage learned classification rules.
133. **Data** — connections import, archive import, snapshots, backup, reset.

## 18. Priority scoring

134. Transparent, rule-based scoring — no black box, no ML, no "likelihood they'll help" guesswork. It scores *fit against the user's stated goals* only.
135. Score 0–100 mapped to High / Medium / Low, High starting at 55 points.
136. Unclassified people score 0 with an explicit reason; low-confidence classifications are penalised 5 points and flagged for review.
137. Every contributing factor is listed in plain English on the person's profile, and every weight is user-adjustable.

## 19. Interface & workflow

138. Original design language (dense, keyboard-first, Linear/Notion-adjacent) with a full light/dark theme built on CSS variables.
139. Persistent sidebar navigation across 12 pages: Home, Find, People, Companies, Outreach, Follow-ups, Session, Review, Analytics, Health, Settings, Welcome.
140. **Command palette (⌘K / Ctrl-K)** with arrow-key navigation for jumping to any page, person, company or saved segment.
141. Toast notifications with inline **Undo** on every destructive or stateful action.
142. Slide-over panels and dialogs instead of page reloads, so context is never lost.
143. Written for non-technical users: every card has a plain-language hint, no jargon, no unexplained metric.
144. Empty states everywhere that explain what to do next rather than showing zero.

## 20. Engineering

145. Next.js 16 App Router with Turbopack, React 19 (React Compiler-clean — no setState-in-effect), Tailwind CSS 4, TypeScript strict mode.
146. Papa Parse for CSV, ExcelJS for export, Recharts for charts, @tanstack/react-virtual for virtualisation, lucide-react for icons.
147. 437 passing tests across 7 suites covering the classifier, the role intelligence layer, the CSV analyzer, 14 different upload-format variants, archive parsing, the Excel exporter and the whole workspace layer.
148. Builds to 13 fully static routes; runs entirely client-side and can be hosted as static files.
