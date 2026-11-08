"use client";

// The last resort, if even the app's frame fails. It can't use our stylesheet,
// so it's a few inline styles in the same sky blue, light and dark alike.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "linear-gradient(#2c5cb0, #7aa2e0)", color: "#fff", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <title>Amble</title>
        <div>
          <h1 style={{ fontSize: 40, margin: 0 }}>hmm</h1>
          <p style={{ fontSize: 17, lineHeight: 1.4, maxWidth: "28ch", margin: "12px auto 28px" }}>Amble tripped over something. Your quests and coins are safe.</p>
          <button onClick={() => retry()} style={{ minHeight: 56, padding: "0 32px", borderRadius: 20, border: 0, background: "#fff", color: "#0d0e0d", fontSize: 17, fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
