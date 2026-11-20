"use client";

// Replaces the root layout when it fails, so it needs its own html and body (T-47).
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <h1>Something went wrong</h1>
        <button onClick={() => retry()}>Try again</button>
      </body>
    </html>
  );
}
