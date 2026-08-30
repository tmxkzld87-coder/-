import { Storage } from '@apps-in-toss/framework';

const KEY = 'ntg:favorite-recipe-ids';

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

export const FavoritesStore = {
  getAll: readIds,

  async isFavorite(recipeId: string): Promise<boolean> {
    const ids = await readIds();
    return ids.includes(recipeId);
  },

  async toggle(recipeId: string): Promise<boolean> {
    const ids = await readIds();
    const isFavorite = ids.includes(recipeId);
    const next = isFavorite ? ids.filter((id) => id !== recipeId) : [recipeId, ...ids];
    await Storage.setItem(KEY, JSON.stringify(next));
    return !isFavorite;
  },
};
