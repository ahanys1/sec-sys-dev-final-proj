
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LIMITS, type Settings } from "@/src/lib/auth/settings";

type NumericSetting = Exclude<keyof Settings, "statusMessage">;

const NUMERIC_FIELDS: {
  key: NumericSetting;
  label: string;
}[] = [
  { key: "sessionIdleMinutes", label: "Session idle timeout (minutes)" },
  { key: "sessionMaxHours", label: "Maximum session lifetime (hours)" },
  { key: "lockoutThreshold", label: "Failed login attempts before lockout" },
  { key: "lockoutMinutes", label: "Account lockout duration (minutes)" },
  { key: "tempPasswordHours", label: "Temporary password lifetime (hours)" },
];

export function SettingsAdmin({
  initialSettings,
}: {
  initialSettings: Settings;
}) {
  const router = useRouter();

  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [savedSettings, setSavedSettings] =
    useState<Settings>(initialSettings);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const changes = Object.fromEntries(
    (Object.keys(settings) as (keyof Settings)[])
      .filter((key) => settings[key] !== savedSettings[key])
      .map((key) => [key, settings[key]])
  ) as Partial<Settings>;

  const hasChanges = Object.keys(changes).length > 0;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || !hasChanges) return;

    // Prevent invalid numeric values from reaching the API.
    for (const { key } of NUMERIC_FIELDS) {
        const value = settings[key];
        const { min, max } = LIMITS[key];

        if (!Number.isInteger(value) || value < min || value > max) {
        setError(`Invalid value for ${key}. Allowed range: ${min}–${max}.`);
        setMessage("");
        return;
        }
    }

  setBusy(true);
  setError("");
  setMessage("");

  try {
    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(changes),
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error?.message ?? "Unable to save settings.");
      return;
    }

    const updated: Settings = body.settings;

    setSettings(updated);
    setSavedSettings(updated);
    setMessage("Settings saved successfully.");

    router.refresh();
  } catch {
    setError("Unable to connect to the server. Please try again.");
  } finally {
    setBusy(false);
  }
}

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {message && (
        <p role="status" className="text-sm text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm">
          Status message
          <textarea
            value={settings.statusMessage}
            maxLength={LIMITS.statusMessage.max}
            disabled={busy}
            onChange={(event) =>
              setSettings({
                ...settings,
                statusMessage: event.target.value,
              })
            }
            className="rounded border px-3 py-2"
            rows={3}
          />
        </label>

        {NUMERIC_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            {label}
            <input
              type="number"
              min={LIMITS[key].min}
              max={LIMITS[key].max}
              step={1}
              required
              disabled={busy}
              value={settings[key]}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  [key]: event.target.valueAsNumber,
                })
              }
              className="rounded border px-3 py-2"
            />
            <span className="text-xs text-gray-500">
              Allowed range: {LIMITS[key].min}–{LIMITS[key].max}
            </span>
          </label>
        ))}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !hasChanges}
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          >
              {busy ? "Saving..." : "Save Changes"}
            </button>

          {hasChanges && (
            <span className="text-sm text-gray-500">
              Unsaved changes
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
