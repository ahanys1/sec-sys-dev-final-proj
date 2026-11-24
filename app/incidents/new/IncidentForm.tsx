
"use client";

import { useState, type FormEvent } from "react";


type Category = {
  id: string;
  name: string;
};

export function IncidentForm({
  categories,
}: {
  categories: Category[];
}) {

const [submitting, setSubmitting] = useState(false);
const [message, setMessage] = useState("");

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (submitting) return;

  const form = event.currentTarget;
  const data = new FormData(form);

  setSubmitting(true);
  setMessage("");

  try {
    const response = await fetch("/api/incidents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description"),
        categoryId: data.get("categoryId"),
      }),
    });

    if (!response.ok) {
      setMessage(`Incident submission failed (${response.status}).`);
      return;
    }

    if (response.status !== 201) {
      setMessage("Unexpected response from the server.");
      return;
    }

    form.reset();
    setMessage("Incident submitted successfully.");
  } catch {
    setMessage("Unable to submit the incident. Please try again.");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="font-medium">
          Incident Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={1}
          maxLength={200}
          className="rounded border p-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={1}
          maxLength={10000}
          rows={6}
          className="rounded border p-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="font-medium">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue=""
          disabled={categories.length === 0}
          className="rounded border p-2"
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
      </div>

      <button
        type="submit"
        disabled={submitting || categories.length === 0}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
        {submitting ? "Submitting..." : "Submit Incident"}
        </button>
        {message && (
            <p role="status" aria-live="polite" className="text-sm">
                {message}
            </p>
     )}
    </form>
  );
}