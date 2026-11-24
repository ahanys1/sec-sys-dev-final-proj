import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { getIncidentDetail } from "@/src/lib/incidents/incidents";
import { ApiError } from "@/src/lib/http";
import { CommentForm } from "@/app/reviewer/incidents/[id]/CommentForm";

type Props = {
  params: Promise<{ id: string }>;
};

// Administrators may view incidents in any status.
// Missing incidents return 404.
export default async function AdminIncidentDetailPage({
  params,
}: Props) {
  const user = await requirePageUser({ roles: ["admin"] });
  const { id } = await params;

  let incident;

  try {
    incident = await getIncidentDetail(getDb(), id, user);
  } catch (error) {
    if (error instanceof ApiError && error.code === "not_found") {
      notFound();
    }
    throw error;
  }
  const category = incident.categoryId
  ? await getDb().category.findUnique({
      where: { id: incident.categoryId },
      select: { name: true },
    })
  : null;
  const comments = await getDb().comment.findMany({
  where: { incidentId: incident.id },
  select: {
    id: true,
    body: true,
    createdAt: true,
    author: {
      select: {
        username: true,
      },
    },
  },
  orderBy: [
    { createdAt: "asc" },
    { id: "asc" },
  ],
});
  return (
    <>
      <AppHeader username={user.username} role={user.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <Link href="/admin/incidents" className="text-sm underline">
          Back to All Incidents
        </Link>

        <h1 className="text-2xl font-semibold">{incident.title}</h1>
        <div className="flex flex-col gap-2 rounded border p-4">
          <p>Status: {incident.status.replaceAll("_", " ")}</p>
          <p>Category: {category?.name ?? "Uncategorized"}</p>
          <p>Submitted: {incident.createdAt.toISOString().slice(0, 10)}</p>
          <p>Updated: {incident.updatedAt.toISOString().slice(0, 10)}</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="whitespace-pre-wrap break-words">
            {incident.description}
          </p>
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Comments</h2>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-400">
              No comments have been added.
            </p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
          <div key={comment.id} className="rounded border p-3">
            <p className="text-sm text-gray-400">
              {comment.author.username} —{" "}
              {comment.createdAt
                .toISOString()
                .slice(0, 16)
                .replace("T", " ")}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words">
              {comment.body}
            </p>
              </div>
                ))}
              </div>
            )}

          <CommentForm incidentId={incident.id} />
        </section>
      </main>
    </>
  );
}