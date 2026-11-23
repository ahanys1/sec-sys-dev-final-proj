"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type IncidentStatus = "open" | "under_review" | "closed";

export function StatusControls({
  incidentId,
  status,
}: {
  incidentId: string;
  status: IncidentStatus;
}) {
    const router = useRouter();
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");

async function handleStatusUpdate(nextStatus: "under_review" | "closed") {
  if (submitting) return;

  setSubmitting(true);
  setError("");

  try {
    const response = await fetch(
      `/api/incidents/${incidentId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      },
    );

    if (!response.ok) {
      setError(
        response.status === 409
          ? "The incident status has changed. Refresh and try again."
          : "Unable to update incident status.",
      );
      return;
    }

    if (nextStatus === "closed") {
      router.replace("/reviewer/incidents");
    } else {
      router.refresh();
    }
  } catch {
    setError("Unable to connect to the server.");
  } finally {
    setSubmitting(false);
  }
}
  const nextStatus =
    status === "open"
      ? "under_review"
      : status === "under_review"
        ? "closed"
        : null;

  if (!nextStatus) {
    return <p>Incident closed.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p>Current status: {status.replaceAll("_", " ")}</p>
      <button
        type="button"
        disabled={submitting}
        onClick={() => handleStatusUpdate(nextStatus)}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {submitting
          ? "Updating..."
          : nextStatus === "under_review"
            ? "Start Review"
            : "Close Incident"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
            {error}
        </p>
      )}
    </div>
  );
}