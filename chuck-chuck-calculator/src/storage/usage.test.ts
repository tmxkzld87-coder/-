import { Storage } from '@apps-in-toss/framework';
import { getRecentUsage, recordUsage } from './usage';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const mockedStorage = jest.mocked(Storage);

describe('usage storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getRecentUsage', () => {
    it('returns an empty array when nothing is stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      await expect(getRecentUsage()).resolves.toEqual([]);
    });

    it('returns an empty array when the stored value is not valid JSON', async () => {
      mockedStorage.getItem.mockResolvedValue('not json');
      await expect(getRecentUsage()).resolves.toEqual([]);
    });

    it('parses previously stored entries', async () => {
      const stored = [{ calculatorId: 'cost', lastUsedAt: 500, useCount: 2 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      await expect(getRecentUsage()).resolves.toEqual(stored);
    });

    it('returns an empty array when Storage.getItem rejects', async () => {
      mockedStorage.getItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(getRecentUsage()).resolves.toEqual([]);
    });
  });

  describe('recordUsage', () => {
    it('adds a new entry with useCount 1', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      const result = await recordUsage('cost');
      expect(result).toEqual([{ calculatorId: 'cost', lastUsedAt: 1000, useCount: 1 }]);
      expect(mockedStorage.setItem).toHaveBeenCalledWith('usage-history-v1', JSON.stringify(result));
    });

    it('increments useCount and refreshes lastUsedAt for an existing entry', async () => {
      const stored = [{ calculatorId: 'cost', lastUsedAt: 100, useCount: 1 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await recordUsage('cost');
      expect(result).toEqual([{ calculatorId: 'cost', lastUsedAt: 1000, useCount: 2 }]);
    });

    it('sorts most-recently-used first', async () => {
      const stored = [
        { calculatorId: 'cost', lastUsedAt: 100, useCount: 1 },
        { calculatorId: 'discount', lastUsedAt: 200, useCount: 1 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await recordUsage('cost');
      expect(result.map((e) => e.calculatorId)).toEqual(['cost', 'discount']);
    });

    it('still resolves with the updated list when Storage.setItem rejects', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      mockedStorage.setItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(recordUsage('cost')).resolves.toEqual([
        { calculatorId: 'cost', lastUsedAt: 1000, useCount: 1 },
      ]);
    });
  });
});
