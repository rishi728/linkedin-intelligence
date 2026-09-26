import { describe, expect, it } from "vitest";
import { parseConnectionsCsv } from "../analyzer";
import { generateSampleCsv } from "../sample";
import { autoClassifyAll, buildPeople } from "../workspace/build";
import { defaultSettings } from "../workspace/defaults";
import { scoreRelevance } from "../workspace/relevance";
import { SAFE_BATCH_CHARS, buildBatches, buildPendingQueue, fingerprintOf } from "./batching";
import { RunBudget } from "./budget";
import { parseJsonLoosely } from "./provider";
import { MAX_CLASSIFICATION_REQUESTS, MAX_OPENROUTER_REQUESTS_PER_RUN } from "./types";
import { validateClassification, validateCorrections, validateInsights } from "./validate";

const rows = parseConnectionsCsv(generateSampleCsv(640));
const settings = defaultSettings();
const people = buildPeople(rows, autoClassifyAll(rows), {}, settings);

describe("the request budget", () => {
  it("never allows a tenth request", () => {
    const b = new RunBudget("t");
    for (let i = 0; i < MAX_CLASSIFICATION_REQUESTS; i++) b.spend("classify");
    b.spend("reconcile");
    b.spend("personalize");
    expect(b.requestsUsed).toBe(MAX_OPENROUTER_REQUESTS_PER_RUN);
    expect(b.requestsRemaining).toBe(0);
    expect(b.canSpend("classify")).toBe(false);
    expect(b.canSpend("reconcile")).toBe(false);
    expect(() => b.spend("personalize")).toThrow();
  });

  it("caps classification requests at seven however many are asked for", () => {
    const b = new RunBudget("t");
    expect(b.classificationsRemaining()).toBe(MAX_CLASSIFICATION_REQUESTS);
    for (let i = 0; i < MAX_CLASSIFICATION_REQUESTS; i++) b.spend("classify");
    expect(b.canSpend("classify")).toBe(false);
    expect(b.classificationsRemaining()).toBe(0);
  });

  it("always keeps room for reconciliation and personalisation", () => {
    const b = new RunBudget("t");
    for (let i = 0; i < MAX_CLASSIFICATION_REQUESTS; i++) b.spend("classify");
    expect(b.canSpend("reconcile")).toBe(true);
    b.spend("reconcile");
    expect(b.canSpend("personalize")).toBe(true);
  });
});

describe("what actually gets sent", () => {
  it("never sends anyone the repository already placed confidently", () => {
    const { pending, resolved } = buildPendingQueue(people);
    expect(resolved).toBeGreaterThan(0);
    const pendingIds = new Set(pending.flatMap((g) => g.personIds));
    for (const p of people) {
      if (p.bucket && p.certainty === "high") expect(pendingIds.has(p.id)).toBe(false);
    }
  });

  it("never sends a manual correction or a taught rule back to the model", () => {
    const withManual = people.map((p, i) =>
      i === 0 ? { ...p, classSource: "manual" as const, certainty: "low" as const, bucket: null } : p,
    );
    const { pending } = buildPendingQueue(withManual);
    expect(pending.flatMap((g) => g.personIds)).not.toContain(withManual[0].id);
  });

  it("collapses everyone sharing a title and employer into one question", () => {
    const { pending } = buildPendingQueue(people);
    const fingerprints = pending.map((g) => g.fingerprint);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
    expect(pending.flatMap((g) => g.personIds).length).toBeGreaterThanOrEqual(pending.length);
  });

  it("puts the patterns covering the most people first", () => {
    const { pending } = buildPendingQueue(people);
    for (let i = 1; i < pending.length; i++) {
      expect(pending[i - 1].personIds.length).toBeGreaterThanOrEqual(pending[i].personIds.length);
    }
  });

  it("treats the same title at the same employer as one fingerprint", () => {
    const a = { position: "Senior Software Engineer", company: "Google" };
    const b = { position: "senior  software engineer", company: "Google Inc" };
    expect(fingerprintOf(a)).toBe(fingerprintOf(b));
    expect(fingerprintOf(a)).not.toBe(fingerprintOf({ position: "Data Analyst", company: "Google" }));
  });
});

describe("batching", () => {
  const many = Array.from({ length: 5000 }, (_, i) => ({
    fingerprint: `fp${i}`,
    title: `Some Unusual Title Number ${i}`,
    company: `Company ${i % 300}`,
    personIds: [`p${i}`],
  }));

  it("never exceeds the batch limit it was given", () => {
    for (const max of [1, 3, 7]) {
      const { batches } = buildBatches(many, max);
      expect(batches.length).toBeLessThanOrEqual(max);
    }
  });

  it("keeps every batch under the safe request size", () => {
    const { batches } = buildBatches(many, 7);
    for (const b of batches) expect(b.chars).toBeLessThanOrEqual(SAFE_BATCH_CHARS);
  });

  it("uses fewer requests when fewer will do", () => {
    const { batches } = buildBatches(many.slice(0, 40), 7);
    expect(batches).toHaveLength(1);
  });

  it("never splits one profile across requests, and reports what did not fit", () => {
    const { batches, skipped } = buildBatches(many, 2);
    const sent = batches.flatMap((b) => b.profiles.map((p) => p.id));
    expect(new Set(sent).size).toBe(sent.length);
    expect(sent.length + skipped.length).toBeLessThanOrEqual(many.length);
    expect(batches.length).toBeLessThanOrEqual(2);
  });

  it("spells each employer once per batch", () => {
    const { batches } = buildBatches(many.slice(0, 600), 7);
    for (const b of batches) expect(new Set(b.companies).size).toBe(b.companies.length);
  });

  it("sends nothing at all when there is no budget for it", () => {
    const { batches, skipped } = buildBatches(many, 0);
    expect(batches).toHaveLength(0);
    expect(skipped).toHaveLength(many.length);
  });
});

describe("validating what comes back", () => {
  const source = { title: "Founder's Office", company: "Razorpay" };

  it("accepts a whole valid path", () => {
    const ok = validateClassification(
      {
        id: "fp1",
        role_bucket: "business-and-consulting",
        role_section: "founders-office-and-chief-of-staff",
        detailed_role: "founders-office",
        sector: "technology",
        role_confidence: 0.94,
      },
      source,
    );
    expect(ok).toMatchObject({ bucket: "business-and-consulting", roleId: "founders-office", sector: "technology" });
  });

  it("accepts labels as well as ids", () => {
    const ok = validateClassification(
      {
        id: "fp1",
        role_bucket: "Business & Consulting",
        role_section: "Founder's Office & Chief of Staff",
        detailed_role: "Founder's Office",
      },
      source,
    );
    expect(ok?.bucket).toBe("business-and-consulting");
  });

  it("refuses an invented bucket", () => {
    expect(
      validateClassification(
        { id: "fp1", role_bucket: "Blockchain & Web3", role_section: "x", detailed_role: "y" },
        source,
      ),
    ).toBeNull();
  });

  it("refuses a section that belongs to a different bucket", () => {
    expect(
      validateClassification(
        { id: "fp1", role_bucket: "data-and-ai", role_section: "founders-office-and-chief-of-staff", detailed_role: "founders-office" },
        source,
      ),
    ).toBeNull();
  });

  it("refuses a role that belongs to a different section", () => {
    expect(
      validateClassification(
        { id: "fp1", role_bucket: "business-and-consulting", role_section: "management-consulting", detailed_role: "founders-office" },
        source,
      ),
    ).toBeNull();
  });

  it("drops an invented sector rather than the whole answer", () => {
    const ok = validateClassification(
      {
        id: "fp1",
        role_bucket: "business-and-consulting",
        role_section: "founders-office-and-chief-of-staff",
        detailed_role: "founders-office",
        sector: "Web3",
      },
      source,
    );
    expect(ok?.sector).toBeNull();
  });

  it("never records certainty", () => {
    const ok = validateClassification(
      {
        id: "fp1",
        role_bucket: "business-and-consulting",
        role_section: "founders-office-and-chief-of-staff",
        detailed_role: "founders-office",
        role_confidence: 1,
      },
      source,
    );
    expect(ok!.roleConfidence).toBeLessThan(1);
    expect(ok!.roleConfidence).toBeGreaterThan(0);
  });

  it("throws away evidence that does not quote the source", () => {
    const ok = validateClassification(
      {
        id: "fp1",
        role_bucket: "business-and-consulting",
        role_section: "founders-office-and-chief-of-staff",
        detailed_role: "founders-office",
        evidence: [
          { field: "title", text: "Founder's Office", supports: "role" },
          { field: "title", text: "Head of Strategy", supports: "role" },
          { field: "company", text: "Stripe", supports: "sector" },
        ],
      },
      source,
    );
    expect(ok!.evidence).toHaveLength(1);
    expect(ok!.evidence[0].text).toBe("Founder's Office");
  });

  it("refuses corrections that point at nothing real", () => {
    const out = validateCorrections([
      { id: "a", field: "role_bucket", from: "x", to: "Made Up Bucket", confidence: 0.9 },
      { id: "b", field: "role_bucket", from: "x", to: "business-and-consulting", reason: "r", confidence: 0.9 },
      { id: "c", field: "nickname", to: "bob" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("b");
  });

  it("drops insights pointing at taxonomy that does not exist", () => {
    const out = validateInsights([
      { headline: "Strong product cluster", detail: "d", bucket: "product-and-design" },
      { headline: "Web3 cluster", detail: "d", bucket: "web3" },
      { detail: "no headline" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].bucket).toBe("product-and-design");
    expect(out[1].bucket).toBeUndefined();
  });
});

describe("reading a reply", () => {
  it("recovers JSON from a fenced or chatty response", () => {
    expect(parseJsonLoosely('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseJsonLoosely('Sure. {"a":2} Hope that helps.')).toEqual({ a: 2 });
    expect(() => parseJsonLoosely("no json here")).toThrow();
  });
});

describe("relevance", () => {
  it("is worked out on the device and never claims certainty", () => {
    const s = defaultSettings();
    s.goals.buckets = ["product-and-design"];
    for (const p of people.slice(0, 200)) {
      const r = scoreRelevance(p, s);
      expect(r.relevance).toBeGreaterThanOrEqual(0);
      expect(r.relevance).toBeLessThan(1);
    }
  });

  it("changes with the user, not just the person", () => {
    const pm = people.find((p) => p.bucket === "product-and-design");
    if (!pm) return;
    const a = defaultSettings();
    a.goals.buckets = ["product-and-design"];
    const b = defaultSettings();
    b.goals.buckets = ["finance-and-investment"];
    expect(scoreRelevance(pm, a).relevance).toBeGreaterThan(scoreRelevance(pm, b).relevance);
  });

  it("only ever cites relationship facts that are stored", () => {
    const s = defaultSettings();
    for (const p of people.slice(0, 300)) {
      const r = scoreRelevance(p, s);
      for (const line of r.relationshipContext) {
        if (line.includes("school")) expect(p.isAlumni).toBe(true);
        if (line.includes("replied")) expect(p.history?.theyReplied).toBe(true);
        if (line.includes("messages exchanged")) expect(p.history?.messageCount).toBeGreaterThan(0);
      }
    }
  });
});
