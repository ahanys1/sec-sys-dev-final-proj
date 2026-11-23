"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

export function CategoryControls({
  incidentId,
  currentCategoryId,
  categories,
}: {
  incidentId: string;
  currentCategoryId: string | null;
  categories: Category[];
}) {
    const router = useRouter();

    const [selectedCategoryId, setSelectedCategoryId] = useState(
      currentCategoryId ?? "",
    );
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    async function handleCategoryUpdate() {
  if (!selectedCategoryId || saving) return;

  setSaving(true);
  setMessage("");

  try {
    const response = await fetch(
      `/api/incidents/${incidentId}/category`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
        }),
      },
    );

    if (!response.ok) {
      setMessage("Unable to update incident category.");
      return;
    }

    setMessage("Category updated successfully.");
    router.refresh();
  } catch {
    setMessage("Unable to update incident category.");
  } finally {
    setSaving(false);
  }
}
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="incident-category">Incident Category</label>

      <select
        id="incident-category"
        value={selectedCategoryId}
        onChange={(event) => setSelectedCategoryId(event.target.value)}
        disabled={saving}
        className="rounded border bg-transparent p-2"
      >
        <option value="" disabled>
          Select a category
        </option>

        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleCategoryUpdate}
        disabled={!selectedCategoryId || saving}
        className="rounded bg-blue-600 p-2 text-white disabled:opacity-50"
        >
        {saving ? "Saving..." : "Save Category"}
      </button>

        {message && (
          <p className="text-sm" role="status">
            {message}
          </p>
        )}
    </div>
  );
}