"use client";

// NFR-2, SR-12, T-47: generic message only. Never render or log the error here.
export default function Error({ retry }: { retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button className="rounded border px-4 py-2" onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
}
