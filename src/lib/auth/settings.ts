import type { Db } from "../tx";

// threat-model §1.4.1, V16.5.3: limits live in code. A missing or invalid stored value falls back to the
// default for that field, never to "no limit".
export const LIMITS = {
  statusMessage: { max: 280 },
  sessionIdleMinutes: { min: 5, max: 60, fallback: 30 },
  sessionMaxHours: { min: 1, max: 12, fallback: 8 },
  lockoutThreshold: { min: 3, max: 10, fallback: 5 },
  lockoutMinutes: { min: 5, max: 60, fallback: 15 },
  tempPasswordHours: { min: 1, max: 72, fallback: 24 },
} as const;

export type Settings = {
  statusMessage: string;
  sessionIdleMinutes: number;
  sessionMaxHours: number;
  lockoutThreshold: number;
  lockoutMinutes: number;
  tempPasswordHours: number;
};

type NumericKey = Exclude<keyof Settings, "statusMessage">;

function bounded(key: NumericKey, value: unknown): number {
  const { min, max, fallback } = LIMITS[key];
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export function sanitizeSettings(row: Partial<Record<keyof Settings, unknown>> | null): Settings {
  const message = row?.statusMessage;
  return {
    statusMessage: typeof message === "string" && message.length <= LIMITS.statusMessage.max ? message : "",
    sessionIdleMinutes: bounded("sessionIdleMinutes", row?.sessionIdleMinutes),
    sessionMaxHours: bounded("sessionMaxHours", row?.sessionMaxHours),
    lockoutThreshold: bounded("lockoutThreshold", row?.lockoutThreshold),
    lockoutMinutes: bounded("lockoutMinutes", row?.lockoutMinutes),
    tempPasswordHours: bounded("tempPasswordHours", row?.tempPasswordHours),
  };
}

export async function getSettings(db: Db): Promise<Settings> {
  return sanitizeSettings(await db.settings.findUnique({ where: { id: 1 } }));
}
