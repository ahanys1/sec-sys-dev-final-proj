import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { CategoriesAdmin } from "./CategoriesAdmin";
import { CategoryControls } from "./CategoryControls";

// EP-22/23: Only administrators may manage incident categories.
export default async function CategoriesPage() {
  const user = await requirePageUser({ roles: ["admin"] });

  const categories = await getDb().category.findMany({
    select: {
      id: true,
      name: true,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <>
      <AppHeader username={user.username} role={user.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Categories</h1>

        <p className="text-sm text-gray-400">
          Manage incident categories and their availability.
        </p>

        <p className="text-sm">
          {categories.length} categories configured.
        </p>

        <CategoriesAdmin />

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Existing Categories</h2>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-400">
              No categories have been created.
            </p>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{category.name}</span>

              <span
                className={
                  category.active
                    ? "text-sm text-green-400"
                    : "text-sm text-gray-400"
                }
              >
                {category.active ? "Active" : "Inactive"}
              </span>
            </div>

            <CategoryControls
              id={category.id}
              name={category.name}
              active={category.active}
            />
          </div>
        ))}
      </div>
    )}
  </section>
      </main>
    </>
  );
}