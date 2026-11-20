// T-47, T-25: the same generic page for every missing or forbidden page.
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
    </main>
  );
}
