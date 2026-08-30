import { Storage } from '@apps-in-toss/framework';

const KEY = 'ntg:recent-ingredients';
const MAX_RECENT = 12;

async function readIds(): Promise<string[]> {
  const raw = await Storage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export const RecentIngredientsStore = {
  getAll: readIds,

  /** 방금 선택해 추천을 받은 재료들을 최신순으로 저장한다(중복 제거, 최대 개수 제한). */
  async record(usedIds: string[]): Promise<string[]> {
    const previous = await readIds();
    const merged = [...usedIds, ...previous.filter((id) => !usedIds.includes(id))].slice(0, MAX_RECENT);
    await Storage.setItem(KEY, JSON.stringify(merged));
    return merged;
  },
};
