import { FavoritesStore } from './favorites';

describe('FavoritesStore', () => {
  it('starts with no favorites', async () => {
    expect(await FavoritesStore.getAll()).toEqual([]);
    expect(await FavoritesStore.isFavorite('kimchi-fried-rice')).toBe(false);
  });

  it('toggling adds then removes a recipe from favorites', async () => {
    const addedNowFavorite = await FavoritesStore.toggle('kimchi-fried-rice');
    expect(addedNowFavorite).toBe(true);
    expect(await FavoritesStore.getAll()).toEqual(['kimchi-fried-rice']);

    const removedNowFavorite = await FavoritesStore.toggle('kimchi-fried-rice');
    expect(removedNowFavorite).toBe(false);
    expect(await FavoritesStore.getAll()).toEqual([]);
  });

  it('keeps the newest favorite first', async () => {
    await FavoritesStore.toggle('ramyeon');
    await FavoritesStore.toggle('kimchi-jjigae');
    expect(await FavoritesStore.getAll()).toEqual(['kimchi-jjigae', 'ramyeon']);
  });
});
