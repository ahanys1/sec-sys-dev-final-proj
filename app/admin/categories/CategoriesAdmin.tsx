"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CategoriesAdmin() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateCategory() {
  if (!name.trim() || saving) return;

  setSaving(true);
  setMessage("");

  try {
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
      }),
    });

    if (!response.ok) {
      setMessage(
        response.status === 409
          ? "A category with this name already exists."
          : "Unable to create category.",
      );
      return;
    }

    setName("");
    setMessage("Category created successfully.");
    router.refresh();
  } catch {
    setMessage("Unable to create category.");
  } finally {
    setSaving(false);
  }
}
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Create Category</h2>

      <label htmlFor="category-name">Category Name</label>

      <input
        id="category-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={100}
        className="rounded border bg-transparent p-2"
      />
      <button
        type="button"
        onClick={handleCreateCategory}
        disabled={!name.trim() || saving}
        className="rounded bg-blue-600 p-2 text-white disabled:opacity-50"
        >
        {saving ? "Creating..." : "Create Category"}
        </button>

        {message && (
        <p className="text-sm" role="status">
            {message}
        </p>
        )}
    </section>
  );
}