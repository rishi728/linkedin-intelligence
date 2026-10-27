"use client";

import Link from "next/link";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--t-red)]">Something went wrong</p>
      <h1 className="text-[28px] font-semibold tracking-tight">This screen hit a problem.</h1>
      <p className="max-w-sm text-[14px] text-muted">
        Your data is safe: it only lives in this browser and this error did not touch it. Try again, or go back to Home.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link href="/home" className="rounded-full border border-line px-5 py-2 text-[13px] font-semibold transition hover:bg-hover">
          Go to Home
        </Link>
      </div>
    </main>
  );
}
