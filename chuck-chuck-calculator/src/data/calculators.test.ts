import { calculators, FREQUENTLY_USED_IDS, findCalculator, searchCalculators } from './calculators';

describe('calculators data', () => {
  it('has exactly 8 entries with unique ids', () => {
    expect(calculators).toHaveLength(8);
    expect(new Set(calculators.map((c) => c.id)).size).toBe(8);
  });

  it('marks only cost as implemented', () => {
    const implementedIds = calculators.filter((c) => c.implemented).map((c) => c.id);
    expect(implementedIds).toEqual(['cost']);
  });

  it('gives every calculator a name, description, icon and route', () => {
    for (const c of calculators) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
      expect(c.route.startsWith('/')).toBe(true);
    }
  });

  it('has 4 frequently-used ids that all exist in calculators', () => {
    expect(FREQUENTLY_USED_IDS).toEqual(['cost', 'discount', 'split-bill', 'travel-expense']);
    for (const id of FREQUENTLY_USED_IDS) {
      expect(() => findCalculator(id)).not.toThrow();
    }
  });

  describe('findCalculator', () => {
    it('returns the matching calculator', () => {
      expect(findCalculator('cost').name).toBe('원가 · 마진');
    });
  });

  describe('searchCalculators', () => {
    it('returns all calculators for an empty query', () => {
      expect(searchCalculators('')).toHaveLength(8);
      expect(searchCalculators('   ')).toHaveLength(8);
    });

    it('matches by name', () => {
      expect(searchCalculators('원가').map((c) => c.id)).toEqual(['cost']);
    });

    it('matches by description, case-insensitively', () => {
      expect(searchCalculators('인원별').map((c) => c.id)).toEqual(['split-bill']);
    });

    it('returns an empty array when nothing matches', () => {
      expect(searchCalculators('존재하지않음')).toEqual([]);
    });
  });
});
