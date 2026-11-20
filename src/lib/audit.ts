import { Prisma, type PrismaClient } from "../generated/prisma/client";

// FR-11, FR-12, SR-10, SR-11 (ASVS V16.2.1, V2.3.3): the audit record is written in the same
// transaction as the business change and fails closed. Records hold actor, time, action, and
// target only: never passwords, tokens, or incident descriptions (SR-9).
export const AUDIT_ACTIONS = [
  "incident.create",
  "incident.status",
  "incident.classify",
  "comment.create",
  "user.create",
  "user.update",
  "user.role",
  "user.deactivate",
  "user.password.reset",
  "user.password.change",
  "settings.update",
  "category.create",
  "category.update",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const SETTING_KEYS = [
  "statusMessage",
  "sessionIdleMinutes",
  "sessionMaxHours",
  "lockoutThreshold",
  "lockoutMinutes",
  "tempPasswordHours",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type SettingsChange = Partial<Record<SettingKey, { old: string | number; new: string | number }>>;

export type AuditEntry = {
  actor: { type: "user"; userId: string } | { type: "system" };
  action: AuditAction;
  targetId?: string;
  /** Only for `settings.update` (design §4). */
  details?: SettingsChange;
};

function validate(entry: AuditEntry): void {
  if (!AUDIT_ACTIONS.includes(entry.action)) throw new Error("Unknown audit action");
  if (entry.details === undefined) return;
  if (entry.action !== "settings.update") throw new Error("Audit details are only allowed for settings.update");
  for (const key of Object.keys(entry.details)) {
    if (!SETTING_KEYS.includes(key as SettingKey)) throw new Error("Unknown settings key in audit details");
  }
}

export async function recordAudit(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  validate(entry);
  await tx.auditLog.create({
    data: {
      actorType: entry.actor.type,
      userId: entry.actor.type === "user" ? entry.actor.userId : null,
      action: entry.action,
      targetId: entry.targetId ?? null,
      details: entry.details ?? Prisma.JsonNull,
    },
  });
}

/** Run a change and its audit record atomically. If the audit insert fails, the change rolls back. */
export function runAudited<T>(
  db: PrismaClient,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
  audit: (result: T) => AuditEntry | AuditEntry[],
  options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      const result = await work(tx);
      for (const entry of [audit(result)].flat()) await recordAudit(tx, entry);
      return result;
    },
    options?.isolationLevel ? { isolationLevel: options.isolationLevel } : undefined,
  );
}
