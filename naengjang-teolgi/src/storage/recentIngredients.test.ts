import { RecentIngredientsStore } from './recentIngredients';

describe('RecentIngredientsStore', () => {
  it('starts empty', async () => {
    expect(await RecentIngredientsStore.getAll()).toEqual([]);
  });

  it('records the most recently used ingredients first, without duplicates', async () => {
    await RecentIngredientsStore.record(['egg', 'kimchi']);
    const second = await RecentIngredientsStore.record(['kimchi', 'green-onion']);
    expect(second).toEqual(['kimchi', 'green-onion', 'egg']);
  });
});
