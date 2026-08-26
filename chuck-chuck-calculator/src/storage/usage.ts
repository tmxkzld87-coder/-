import { Storage } from '@apps-in-toss/framework';

const STORAGE_KEY = 'usage-history-v1';

export type UsageEntry = {
  calculatorId: string;
  lastUsedAt: number;
  useCount: number;
};

export async function getRecentUsage(): Promise<UsageEntry[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEntry[]) : [];
  } catch {
    return [];
  }
}

export async function recordUsage(calculatorId: string): Promise<UsageEntry[]> {
  const current = await getRecentUsage();
  const now = Date.now();
  const existing = current.find((e) => e.calculatorId === calculatorId);

  const updated = existing
    ? current.map((e) =>
        e.calculatorId === calculatorId ? { ...e, lastUsedAt: now, useCount: e.useCount + 1 } : e,
      )
    : [...current, { calculatorId, lastUsedAt: now, useCount: 1 }];

  updated.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort persistence — usage tracking must never block navigation or crash the caller.
  }
  return updated;
}
