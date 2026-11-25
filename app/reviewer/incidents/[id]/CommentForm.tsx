"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({
  incidentId,
}: {
  incidentId: string;
}) {
  const router = useRouter();

  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (submitting || !body.trim()) return;

  setSubmitting(true);
  setMessage("");

  try {
    const response = await fetch(
      `/api/incidents/${incidentId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: body.trim(),
        }),
      },
    );

    if (!response.ok) {
      setMessage("Unable to post comment.");
      return;
    }

    setBody("");
    setMessage("Comment posted successfully.");
    router.refresh();
  } catch {
    setMessage("Unable to post comment.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <form method="post" onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="comment-body">Add Comment</label>

      <textarea
        id="comment-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        className="rounded border bg-transparent p-2"
        placeholder="Enter your comment..."
        required
      />

      <button
        type="submit"
        disabled={submitting || !body.trim()}
        className="rounded bg-blue-600 p-2 text-white disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Post Comment"}
      </button>

      {message && (
        <p className="text-sm" role="status">
          {message}
        </p>
      )}
    </form>
  );
}