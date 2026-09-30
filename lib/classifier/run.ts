// The whole classification, over the whole export at once.
//
// Ported from classify_v5.run. It has to see the corpus, not one person: the
// centroids are seeded from everyone the titles already placed, and generic
// titles are resolved partly by what the rest of the company does. Unique
// (Position, Company) pairs are classified once and mapped back, so two people
// with the same title at the same employer can never disagree.

import { BIZ, CATS, FOUND, NOPRO, STUD, bandOf, type Band } from "./categories";
import { clusterPairs } from "./centroids";
import { PRECISE } from "./rules";
import { stage1 } from "./stage1";

export interface ClassifiedPair {
  category: string;
  roleFamily: string;
  /** 0.20 to 0.97. Never 1, except for a genuinely empty row. */
  confidence: number;
  band: Band;
  secondCategory: string | null;
  method: string;
  needsReview: boolean;
  /** 1 to 10, the seeded centroid this pair sits nearest. */
  cluster: number | null;
  /** The title disagreed with a confident cluster. */
  conflict: boolean;
  /** The title named no function, so company and peers decided it. */
  genericInference: boolean;
}

export interface Row {
  position: string;
  company: string;
}

/** The key a pair is deduplicated and cached by. */
export function pairKey(position: string, company: string): string {
  return `${position}\u0000${company}`;
}

export type Classification = Map<string, ClassifiedPair>;

export interface CorpusStats {
  pairs: number;
  titleResolved: number;
  genericResolved: number;
  needsReview: number;
  empty: number;
}

export function classifyCorpus(rows: Row[]): { byPair: Classification; stats: CorpusStats } {
  // ---- unique pairs, with how many people each stands for --------------------
  const counts = new Map<string, number>();
  const pairs: Row[] = [];
  for (const row of rows) {
    const key = pairKey(row.position, row.company);
    const seen = counts.get(key);
    if (seen === undefined) {
      counts.set(key, 1);
      pairs.push({ position: row.position, company: row.company });
    } else {
      counts.set(key, seen + 1);
    }
  }

  const st = pairs.map((p) => stage1(p.position, p.company));
  const byPair: Classification = new Map();

  // Empty rows never reach the model; they are a fact about the export.
  const live: number[] = [];
  for (let i = 0; i < pairs.length; i++) {
    if (st[i].cat === NOPRO) {
      byPair.set(pairKey(pairs[i].position, pairs[i].company), {
        category: NOPRO,
        roleFamily: NOPRO,
        confidence: 1,
        band: "High",
        secondCategory: null,
        method: "Empty company & position",
        needsReview: false,
        cluster: null,
        conflict: false,
        genericInference: false,
      });
    } else {
      live.push(i);
    }
  }

  const livePairs = live.map((i) => pairs[i]);
  // Only titles the rules placed with real weight are allowed to shape a centroid.
  const seeds = live.map((i) => (st[i].titleTop >= 3 && st[i].cat ? st[i].cat : null));
  const km = clusterPairs(livePairs, seeds);

  // ---- company peers: what confidently placed colleagues do -----------------
  const peerWeights = new Map<string, Map<string, number>>();
  live.forEach((i, j) => {
    if (seeds[j] === null) return;
    const company = pairs[i].company;
    if (!company) return;
    const n = counts.get(pairKey(pairs[i].position, company)) ?? 1;
    const inner = peerWeights.get(company) ?? new Map<string, number>();
    inner.set(seeds[j]!, (inner.get(seeds[j]!) ?? 0) + n);
    peerWeights.set(company, inner);
  });

  const peers = new Map<string, { cat: string; share: number; n: number }>();
  for (const [company, weights] of peerWeights) {
    let total = 0;
    let best = "";
    let bestN = 0;
    for (const [cat, n] of weights) {
      total += n;
      if (n > bestN) {
        bestN = n;
        best = cat;
      }
    }
    if (total >= 2) peers.set(company, { cat: best, share: bestN / total, n: total });
  }

  let titleResolved = 0;
  let genericResolved = 0;
  let needsReviewCount = 0;

  live.forEach((i, j) => {
    const s = st[i];
    const pair = pairs[i];
    const peer = peers.get(pair.company);
    const strongKm = km.kmMargin[j] >= km.strongMargin;

    let category: string;
    let confidence: number;
    let method: string;
    let conflict = false;
    let generic = false;
    let second = s.second;

    if (s.resolved && s.cat) {
      // ---- the title carries the function
      titleResolved++;
      category = s.cat;
      const tt = s.titleTop;
      confidence = tt >= 5 ? 0.9 : tt >= 3 ? 0.82 : 0.66;
      if (s.margin < 0.4 * Math.max(tt, 1)) confidence -= 0.15;
      if (s.ccat === category) confidence += 0.04;
      if (km.kmCat[j] === category) confidence += 0.04;
      else if (strongKm) confidence -= 0.1;
      method = tt >= 3 ? "Title function" : "Title (moderate) + context";
      conflict = km.kmCat[j] !== category && strongKm;
    } else {
      // ---- a level and nothing else: company, peers and the centroid vote
      genericResolved++;
      generic = true;
      const votes: Record<string, number> = {};
      for (const c of CATS) votes[c] = 0;

      if (s.ccat) votes[s.ccat] += s.cname && PRECISE.has(s.cname) ? 1.0 : 0.7;
      const peerCounts = peer && peer.share >= 0.6 ? peer : null;
      if (peerCounts) votes[peerCounts.cat] += (peerCounts.n >= 3 ? 1.2 : 0.8) * peerCounts.share;
      const kg = km.kmCatGeneric[j];
      votes[kg] += 0.6 + (strongKm ? 0.4 : 0);

      const ranked = [...CATS].sort((a, b) => votes[b] - votes[a]);
      category = ranked[0];
      const ts = votes[category];
      const ss = votes[ranked[1]];

      const agree = [s.ccat, peerCounts ? peerCounts.cat : null, kg].filter((x) => x === category).length;
      confidence = agree === 3 ? 0.8 : agree === 2 ? 0.66 : agree === 1 ? 0.5 : 0.4;
      if (agree === 1 && !s.ccat && !peerCounts) confidence = 0.42;
      if (s.fam === "Leadership (function unspecified)") confidence -= 0.05;
      if (ts - ss < 0.25) confidence -= 0.08;

      method =
        agree === 3
          ? "Generic title: company + peers + K-means agree"
          : agree === 2
            ? "Generic title: 2 of 3 signals agree"
            : !s.ccat && !peerCounts
              ? "Generic title: K-means neighbourhood only"
              : "Generic title: single signal";
      second = ss >= 0.75 * ts && ranked[1] !== category ? ranked[1] : null;
    }

    confidence = Math.round(Math.max(0.2, Math.min(confidence, 0.97)) * 100) / 100;

    const needsReview =
      confidence < 0.6 ||
      conflict ||
      (generic && (method.includes("single signal") || method.includes("neighbourhood only")));
    if (needsReview) needsReviewCount++;

    byPair.set(pairKey(pair.position, pair.company), {
      category,
      roleFamily: s.fam,
      confidence,
      band: bandOf(confidence),
      secondCategory: second,
      method,
      needsReview,
      cluster: km.cluster[j],
      conflict,
      genericInference: generic,
    });
  });

  return {
    byPair,
    stats: {
      pairs: pairs.length,
      titleResolved,
      genericResolved,
      needsReview: needsReviewCount,
      empty: pairs.length - live.length,
    },
  };
}

export { BIZ, FOUND, STUD };
