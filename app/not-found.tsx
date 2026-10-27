import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Page not found</p>
      <h1 className="text-[28px] font-semibold tracking-tight">That page is not here.</h1>
      <p className="max-w-sm text-[14px] text-muted">
        The link may be old or mistyped. Nothing is lost: your network is still saved in this browser.
      </p>
      <div className="mt-2 flex gap-2">
        <Link href="/home" className="rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition hover:bg-accent-hover">
          Go to Home
        </Link>
        <Link href="/?welcome" className="rounded-full border border-line px-5 py-2 text-[13px] font-semibold transition hover:bg-hover">
          Back to the start
        </Link>
      </div>
    </main>
  );
}
