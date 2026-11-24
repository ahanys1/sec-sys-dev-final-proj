"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CategoryControlsProps = {
  id: string;
  name: string;
  active: boolean;
};

export function CategoryControls({
  id,
  name,
  active,
}: CategoryControlsProps) {
  const router = useRouter();

  const [newName, setNewName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRename() {
    const trimmedName = newName.trim();

    if (!trimmedName || trimmedName === name || saving) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      if (!response.ok) {
        setMessage(
          response.status === 409
            ? "A category with this name already exists."
            : "Unable to rename category.",
        );
        return;
      }

      setMessage("Category renamed successfully.");
      router.refresh();
    } catch {
      setMessage("Unable to rename category.");
    } finally {
      setSaving(false);
    }
  }
  async function handleToggleActive() {
  if (saving) return;

  setSaving(true);
  setMessage("");

  try {
    const response = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: !active,
      }),
    });

    if (!response.ok) {
      setMessage("Unable to update category status.");
      return;
    }

    setMessage(
      active
        ? "Category deactivated successfully."
        : "Category activated successfully.",
    );

    router.refresh();
  } catch {
    setMessage("Unable to update category status.");
  } finally {
    setSaving(false);
  }
}
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`category-${id}`} className="text-sm">
        Rename Category
      </label>

      <input
        id={`category-${id}`}
        type="text"
        value={newName}
        onChange={(event) => setNewName(event.target.value)}
        maxLength={100}
        className="rounded border bg-transparent p-2"
      />
      <button
        type="button"
        onClick={handleRename}
        disabled={!newName.trim() || newName.trim() === name || saving}
        className="rounded bg-blue-600 p-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Rename"}
      </button>
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={saving}
        className="rounded border p-2 disabled:opacity-50"
      >
        {saving ? "Saving..." : active ? "Deactivate" : "Activate"}
      </button>

        {message && (
          <p className="text-sm" role="status">
            {message}
          </p>
        )}
    </div>
  );
}