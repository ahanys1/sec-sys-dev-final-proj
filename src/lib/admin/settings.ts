
import type { PrismaClient } from "../../generated/prisma/client";
import { recordAudit } from "../audit";
import { getSettings, sanitizeSettings, type Settings } from "../auth/settings";
import { serializable } from "../tx";
import type { UpdateSettingsInput } from "./settings-schemas";

export async function readAdminSettings(db: PrismaClient): Promise<Settings> {
  return getSettings(db);
}

export async function updateAdminSettings(
  db: PrismaClient,
  adminId: string,
  changes: UpdateSettingsInput,
): Promise<Settings> {
  return serializable(db, async (tx) => {
    const stored = await tx.settings.findUnique({ where: { id: 1 } });
    const current = sanitizeSettings(stored);

    const differences: Record<string, { old: string | number; new: string | number }> = {};

    for (const key of Object.keys(changes) as (keyof Settings)[]) {
      const next = changes[key];

      if (next !== undefined && current[key] !== next) {
        differences[key] = {
          old: current[key],
          new: next,
        };
      }
    }

    if (Object.keys(differences).length === 0) {
      return current;
    }

    const updated = await tx.settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ...current,
        ...changes,
        updatedById: adminId,
      },
      update: {
        ...changes,
        updatedById: adminId,
      },
    });

    await recordAudit(tx, {
      actor: { type: "user", userId: adminId },
      action: "settings.update",
      targetId: "1",
      details: differences,
    });

    return sanitizeSettings(updated);
  });
}
