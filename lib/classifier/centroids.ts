// The K = 10 model, ported from classify_v5.
//
// TF-IDF over the role text (75%) and the employer (25%), then one centroid per
// category seeded from the pairs the title already placed confidently. The
// centroids are deliberately not iterated: free Lloyd iterations drift, and the
// Python audit measured held-out agreement falling from 88% to 68% after ten of
// them. A cluster here IS its named category, which is the whole point.

import { CAT_ORDER } from "./categories";
import { roleText } from "./stage1";

type Vector = Map<number, number>;

interface Space {
  vocab: Map<string, number>;
  idf: number[];
}

/** Words and word pairs, as the Python side does with ngram_range=(1,2). */
function wordGrams(text: string): string[] {
  const words = text.split(" ").filter(Boolean);
  const out = [...words];
  for (let i = 0; i + 1 < words.length; i++) out.push(`${words[i]} ${words[i + 1]}`);
  return out;
}

/** Character n-grams inside word boundaries, as char_wb does. */
function charGrams(text: string, min = 3, max = 5): string[] {
  const out: string[] = [];
  for (const word of text.split(" ").filter(Boolean)) {
    const padded = ` ${word} `;
    for (let n = min; n <= max; n++) {
      for (let i = 0; i + n <= padded.length; i++) out.push(padded.slice(i, i + n));
    }
  }
  return out;
}

function buildSpace(docs: string[], grams: (t: string) => string[], minDf: number): Space {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const g of new Set(grams(doc))) df.set(g, (df.get(g) ?? 0) + 1);
  }
  const vocab = new Map<string, number>();
  const idf: number[] = [];
  const n = docs.length;
  for (const [term, count] of df) {
    if (count < minDf) continue;
    vocab.set(term, idf.length);
    // scikit-learn's smoothed idf, plus one.
    idf.push(Math.log((1 + n) / (1 + count)) + 1);
  }
  return { vocab, idf };
}

/** Sublinear TF-IDF, L2 normalised, exactly as sublinear_tf=True does. */
function vectorise(doc: string, grams: (t: string) => string[], space: Space): Vector {
  const counts = new Map<number, number>();
  for (const g of grams(doc)) {
    const i = space.vocab.get(g);
    if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  const v: Vector = new Map();
  let norm2 = 0;
  for (const [i, tf] of counts) {
    const w = (1 + Math.log(tf)) * space.idf[i];
    v.set(i, w);
    norm2 += w * w;
  }
  if (norm2 > 0) {
    const inv = 1 / Math.sqrt(norm2);
    for (const [i, w] of v) v.set(i, w * inv);
  }
  return v;
}

function scale(v: Vector, factor: number, offset: number, into: Vector): void {
  for (const [i, w] of v) into.set(i + offset, w * factor);
}

function l2(v: Vector): Vector {
  let n2 = 0;
  for (const w of v.values()) n2 += w * w;
  if (n2 === 0) return v;
  const inv = 1 / Math.sqrt(n2);
  const out: Vector = new Map();
  for (const [i, w] of v) out.set(i, w * inv);
  return out;
}

function dot(a: Vector, b: Vector): number {
  // Walk the shorter one.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [i, w] of small) {
    const other = large.get(i);
    if (other !== undefined) sum += w * other;
  }
  return sum;
}

export interface Pair {
  position: string;
  company: string;
}

export interface ClusterResult {
  /** 1-based, matching the Python output column. */
  cluster: number[];
  /** The category the nearest centroid stands for. */
  kmCat: string[];
  /** The nearest centroid excluding Student and Founders, which need real support. */
  kmCatGeneric: string[];
  /** Distance gap between the best and second-best centroid. */
  kmMargin: number[];
  /** The cut-off above which a margin counts as strong (the top third). */
  strongMargin: number;
}

/**
 * Builds the ten seeded centroids and assigns every pair to one.
 *
 * `labelled` marks the pairs whose title placed them confidently; those are the
 * only ones that shape a centroid. A category nobody was confidently placed into
 * gets no centroid, and is simply never chosen.
 */
export function clusterPairs(pairs: Pair[], labelled: Array<string | null>): ClusterResult {
  const roles = pairs.map((p) => roleText(p.position));
  const comps = pairs.map((p) => p.company.toLowerCase().replace(/[^a-z0-9 ]/g, " "));

  const rw = buildSpace(roles, wordGrams, 2);
  const rc = buildSpace(roles, charGrams, 3);
  const cw = buildSpace(comps, wordGrams, 2);
  const cc = buildSpace(comps, charGrams, 3);

  const offRw = 0;
  const offRc = offRw + rw.vocab.size;
  const offCw = offRc + rc.vocab.size;
  const offCc = offCw + cw.vocab.size;

  const X: Vector[] = pairs.map((_, i) => {
    const v: Vector = new Map();
    // ROLE 75%, COMPANY 25%, split between word and character features.
    scale(vectorise(roles[i], wordGrams, rw), 0.5, offRw, v);
    scale(vectorise(roles[i], charGrams, rc), 0.25, offRc, v);
    scale(vectorise(comps[i], wordGrams, cw), 0.15, offCw, v);
    scale(vectorise(comps[i], charGrams, cc), 0.1, offCc, v);
    return l2(v);
  });

  // Seed each centroid with the mean of its confidently labelled members.
  const centroids: Array<Vector | null> = CAT_ORDER.map((cat) => {
    const members: Vector[] = [];
    for (let i = 0; i < pairs.length; i++) if (labelled[i] === cat) members.push(X[i]);
    if (!members.length) return null;
    const sum: Vector = new Map();
    for (const m of members) for (const [k, w] of m) sum.set(k, (sum.get(k) ?? 0) + w);
    for (const [k, w] of sum) sum.set(k, w / members.length);
    return l2(sum);
  });

  const cluster: number[] = [];
  const kmCat: string[] = [];
  const kmCatGeneric: string[] = [];
  const kmMargin: number[] = [];

  for (let i = 0; i < pairs.length; i++) {
    // Euclidean distance on unit vectors is a monotone function of cosine.
    const dist = centroids.map((c) => (c ? Math.sqrt(Math.max(0, 2 - 2 * dot(X[i], c))) : Infinity));
    const order = dist.map((d, k) => [d, k] as const).sort((a, b) => a[0] - b[0]);
    const best = order[0][1];
    const secondDist = order[1]?.[0] ?? order[0][0];

    cluster.push(best + 1);
    kmCat.push(CAT_ORDER[best]);
    kmMargin.push(Number.isFinite(secondDist) ? secondDist - order[0][0] : 0);

    // Student and Founders need company or peer support, never geometry alone.
    let bestGeneric = -1;
    let bestGenericDist = Infinity;
    for (let k = 0; k < CAT_ORDER.length; k++) {
      const cat = CAT_ORDER[k];
      if (cat === "Student & Community" || cat === "Founders & Leadership") continue;
      if (dist[k] < bestGenericDist) {
        bestGenericDist = dist[k];
        bestGeneric = k;
      }
    }
    kmCatGeneric.push(bestGeneric >= 0 ? CAT_ORDER[bestGeneric] : CAT_ORDER[best]);
  }

  const sorted = [...kmMargin].filter(Number.isFinite).sort((a, b) => a - b);
  const strongMargin = sorted.length ? sorted[Math.floor(sorted.length * 0.66)] : 0;

  return { cluster, kmCat, kmCatGeneric, kmMargin, strongMargin };
}
