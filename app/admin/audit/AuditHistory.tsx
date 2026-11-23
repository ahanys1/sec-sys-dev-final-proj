
"use client";

import { useCallback, useEffect, useState } from "react";


type AuditRecord = {
  id: string;
  actorType: "user" | "system";
  userId: string | null;
  createdAt: string;
  action: string;
  targetId: string | null;
  details: unknown;
};

type AuditResponse = {
  records: AuditRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 25;


function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Invalid timestamp"
    : date.toLocaleString();
}


const SETTING_LABELS: Record<string, string> = {
  statusMessage: "Status message",
  sessionIdleMinutes: "Session idle timeout",
  sessionMaxHours: "Maximum session lifetime",
  lockoutThreshold: "Lockout threshold",
  lockoutMinutes: "Lockout duration",
  tempPasswordHours: "Temporary password lifetime",
};

function settingsChanges(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }

  return Object.entries(details)
    .filter(([key, value]) => {
      if (!Object.hasOwn(SETTING_LABELS, key)) return false;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
      }

      const change = value as Record<string, unknown>;

      return (
        (typeof change.old === "string" ||
          typeof change.old === "number") &&
        (typeof change.new === "string" ||
          typeof change.new === "number")
      );
    })
    .map(([key, value]) => {
      const change = value as { old: string | number; new: string | number };

      return {
        label: SETTING_LABELS[key],
        old: String(change.old),
        new: String(change.new),
      };
    });
}

export function AuditHistory({ actions }: { actions: string[] }) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (action) params.set("action", action);

  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T00:00:00`) : null;

  if (
    (fromDate && Number.isNaN(fromDate.getTime())) ||
    (toDate && Number.isNaN(toDate.getTime())) ||
    (fromDate && toDate && fromDate > toDate)
  ) {
    if (signal?.aborted) return;

    setError("Enter a valid date range. Start must be before or equal to end.");
    setRecords([]);
    setTotal(0);
    setTotalPages(0);
    setLoading(false);
    return;
  }

  if (fromDate) {
    params.set("from", fromDate.toISOString());
  }

  if (toDate) {
    // Include the entire selected end date.
    toDate.setDate(toDate.getDate() + 1);
    toDate.setMilliseconds(toDate.getMilliseconds() - 1);

    params.set("to", toDate.toISOString());
  }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/audit?${params}`, {
        signal,
      });

      const body = (await response.json()) as AuditResponse & {
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(body.error?.message ?? "Unable to load audit history.");
      }

      if (signal?.aborted) return;

    setRecords(body.records);
    setTotal(body.pagination.total);
    setTotalPages(body.pagination.totalPages);
    } catch (err) {
      if (signal?.aborted) return;

      setError(
        err instanceof Error ? err.message : "Unable to load audit history."
      );
      setRecords([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, action, from, to]);

useEffect(() => {
  const controller = new AbortController();

  void Promise.resolve().then(() => {
    if (!controller.signal.aborted) {
      return loadRecords(controller.signal);
    }
  });

  return () => controller.abort();
}, [loadRecords]);

return (
  <div className="flex flex-col gap-6">
    <p className="text-sm text-gray-500">
      Read-only audit history. Records are displayed newest first.
    </p>

    {loading && (
      <p role="status" className="text-sm">
        Loading audit records...
      </p>
    )}

<section aria-label="Audit filters" className="flex flex-wrap items-end gap-4">
  <label className="flex flex-col gap-1 text-sm">
    Action
    <select
      value={action}
      onChange={(event) => {
        setAction(event.target.value);
        setPage(1);
      }}
      className="rounded border px-3 py-2"
    >
      <option value="">All actions</option>
      {actions.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  </label>

  <label className="flex flex-col gap-1 text-sm">
    From
    <input
      type="date"
      value={from}
      onChange={(event) => {
        setFrom(event.target.value);
        setPage(1);
      }}
      className="rounded border px-3 py-2"
    />
  </label>

  <label className="flex flex-col gap-1 text-sm">
    To
    <input
      type="date"
      value={to}
      onChange={(event) => {
        setTo(event.target.value);
        setPage(1);
      }}
      className="rounded border px-3 py-2"
    />
  </label>

  <button
    type="button"
    onClick={() => {
      setAction("");
      setFrom("");
      setTo("");
      setPage(1);
    }}
    className="rounded border px-3 py-2 text-sm"
  >
    Clear filters
  </button>
</section>

    {error && (
      <p role="alert" className="text-sm text-red-700">
        {error}
      </p>
    )}

{!loading && !error && (
  <>
    <p className="text-sm text-gray-500">
      Showing {records.length} of {total} matching records.
    </p>

    {records.length === 0 ? (
      <p className="rounded border p-4 text-sm">
        No audit records match the selected filters.
      </p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4">Timestamp</th>
              <th className="pr-4">Actor</th>
              <th className="pr-4">Action</th>
              <th className="pr-4">Target</th>
              <th className="pr-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b">
                <td className="py-3 pr-4 whitespace-nowrap">
                  {formatTimestamp(record.createdAt)}
                </td>
                <td className="pr-4">
                  {record.actorType === "system"
                    ? "System"
                    : record.userId ?? "Unknown user"}
                </td>
                <td className="pr-4">
                  <code>{record.action}</code>
                </td>
                <td className="pr-4">
                  {record.targetId ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  {record.action === "settings.update" ? (
                    <div className="flex flex-col gap-1">
                      {settingsChanges(record.details).map((change) => (
                        <p key={change.label} className="text-xs">
                          <strong>{change.label}:</strong>{" "}
                          <span className="break-words">{change.old}</span>
                          {" → "}
                          <span className="break-words">{change.new}</span>
                        </p>
                    ))}
                </div>
              ) : (
                "—"
              )}
            </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        disabled={loading || page <= 1}
        onClick={() => setPage((current) => current - 1)}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm">
        Page {page} of {Math.max(totalPages, 1)}
      </span>

      <button
        type="button"
        disabled={loading || page >= totalPages}
        onClick={() => setPage((current) => current + 1)}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </>
)}

  </div>
);

}
