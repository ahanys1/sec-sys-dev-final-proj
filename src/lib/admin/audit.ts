
import { getDb } from "../db";
import type { AuditQuery } from "./audit-schemas";

export async function listAuditRecords(query: AuditQuery) {
  const { page, limit, action, from, to } = query;

  const where = {
    ...(action ? { action } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const db = getDb();

  const [records, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      select: {
        id: true,
        actorType: true,
        userId: true,
        createdAt: true,
        action: true,
        targetId: true,
        details: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
  records: records.map((record) => ({
    ...record,
    id: record.id.toString(),
  })),
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
};
}
