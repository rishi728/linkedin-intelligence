// The request budget, enforced in one place.
//
// The limit is not advice. Every call to the provider goes through `spend`,
// which refuses once the budget is gone, so there is no path through the code
// that can make a tenth request.

import { MAX_CLASSIFICATION_REQUESTS, MAX_OPENROUTER_REQUESTS_PER_RUN } from "./types";

export type RequestKind = "classify" | "reconcile" | "personalize";

export class RunBudget {
  readonly runId: string;
  private used = 0;
  private failed = 0;
  private classifications = 0;

  constructor(runId: string) {
    this.runId = runId;
  }

  get requestsUsed(): number {
    return this.used;
  }

  get requestsRemaining(): number {
    return MAX_OPENROUTER_REQUESTS_PER_RUN - this.used;
  }

  get requestsFailed(): number {
    return this.failed;
  }

  get batchCount(): number {
    return this.classifications;
  }

  /**
   * How many classification requests are still allowed, respecting both the
   * overall budget and the two calls reserved for reconciliation and
   * personalisation at the end.
   */
  classificationsRemaining(): number {
    const reserved = 2;
    const byKind = MAX_CLASSIFICATION_REQUESTS - this.classifications;
    const byTotal = this.requestsRemaining - reserved;
    return Math.max(0, Math.min(byKind, byTotal));
  }

  canSpend(kind: RequestKind): boolean {
    if (this.requestsRemaining <= 0) return false;
    if (kind === "classify") return this.classifications < MAX_CLASSIFICATION_REQUESTS;
    return true;
  }

  /** Records one request against the budget. Throws rather than quietly overspending. */
  spend(kind: RequestKind): void {
    if (!this.canSpend(kind)) throw new Error(`Request budget spent (${this.used}/${MAX_OPENROUTER_REQUESTS_PER_RUN})`);
    this.used++;
    if (kind === "classify") this.classifications++;
  }

  /** A retry costs a request like any other, which is why it is counted here. */
  recordFailure(): void {
    this.failed++;
  }
}
