import { Storage } from '@apps-in-toss/framework';
import type { CalculatorId } from '../data/calculators';

const STORAGE_KEY = 'calculator-history-v1';
const MAX_ENTRIES = 100;

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

export async function saveHistoryEntry(entry: Omit<CalculatorHistoryEntry, 'id' | 'createdAt'>): Promise<CalculatorHistoryEntry[]> {
  const current = await getHistory();
  const saved: CalculatorHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  const updated = [saved, ...current].slice(0, MAX_ENTRIES);
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Best-effort persistence — a failed save must never block the calculator UI.
  }
  return updated;
}
