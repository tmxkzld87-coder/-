import { Storage } from '@apps-in-toss/framework';
import type { CalculatorId } from '../data/calculators';

const STORAGE_KEY = 'calculator-history-v1';
export const MAX_FREE_ENTRIES = 3;
const MAX_SUBSCRIBED_ENTRIES = 100;

export type CalculatorHistoryEntry = {
  id: string;
  calculatorType: CalculatorId;
  title: string;
  summary: string;
  createdAt: number;
};

export async function getHistory(): Promise<CalculatorHistoryEntry[]> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CalculatorHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

// maxEntries caps how many entries survive a save — pass MAX_FREE_ENTRIES for
// non-subscribers (oldest entries drop off silently) or MAX_SUBSCRIBED_ENTRIES
// once the user has an active subscription. Kept as a caller-supplied value
// so this module doesn't need to know about subscription status itself.
export async function saveHistoryEntry(
  entry: Omit<CalculatorHistoryEntry, 'id' | 'createdAt'>,
  maxEntries: number = MAX_FREE_ENTRIES,
): Promise<CalculatorHistoryEntry[]> {
  const current = await getHistory();
  const saved: CalculatorHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const updated = [saved, ...current].slice(0, maxEntries);
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort persistence — a failed save must never block the calculator UI.
  }
  return updated;
}

export async function deleteHistoryEntry(id: string): Promise<CalculatorHistoryEntry[]> {
  const current = await getHistory();
  const updated = current.filter((entry) => entry.id !== id);
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort persistence — a failed delete must never block the UI.
  }
  return updated;
}

export { MAX_SUBSCRIBED_ENTRIES };
