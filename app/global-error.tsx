"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fcfcfa", color: "#14171f" }}>
        <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>NEST could not start.</h1>
          <p style={{ maxWidth: 360, color: "#686d79", margin: 0 }}>
            Your data is safe in this browser. Reload the page, or try again below.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: "10px 22px", borderRadius: 999, border: 0, background: "#0f766e", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
