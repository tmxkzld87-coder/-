import { Storage } from '@apps-in-toss/framework';
import { getHistory, saveHistoryEntry, deleteHistoryEntry } from './history';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('history storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getHistory', () => {
    it('returns an empty array when nothing is stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      await expect(getHistory()).resolves.toEqual([]);
    });

    it('returns an empty array when the stored value is not valid JSON', async () => {
      mockedStorage.getItem.mockResolvedValue('not json');
      await expect(getHistory()).resolves.toEqual([]);
    });
  });

  describe('saveHistoryEntry', () => {
    it('prepends a new entry with a generated id and timestamp', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      const result = await saveHistoryEntry({ calculatorType: 'cost', title: '아메리카노', summary: '판매가 4,500원 · 원가율 10%' });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ calculatorType: 'cost', title: '아메리카노', createdAt: 1000 });
      expect(result[0]!.id).toEqual(expect.any(String));
    });

    it('keeps existing entries and puts the new one first', async () => {
      const stored = [{ id: 'old', calculatorType: 'cost', title: '기존', summary: '', createdAt: 100 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await saveHistoryEntry({ calculatorType: 'discount', title: '새 계산', summary: '' });
      expect(result.map((e) => e.title)).toEqual(['새 계산', '기존']);
    });

    it('still resolves with the updated list when Storage.setItem rejects', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      mockedStorage.setItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(
        saveHistoryEntry({ calculatorType: 'cost', title: '아메리카노', summary: '' }),
      ).resolves.toHaveLength(1);
    });

    it('defaults to the free cap (3) and drops the oldest entry beyond it', async () => {
      // saveHistoryEntry always prepends, so a real stored list is newest-first —
      // the fixture must match that invariant for the cap's "drop the tail" logic to be meaningful.
      const stored = [
        { id: 'c', calculatorType: 'cost', title: '3', summary: '', createdAt: 300 },
        { id: 'b', calculatorType: 'cost', title: '2', summary: '', createdAt: 200 },
        { id: 'a', calculatorType: 'cost', title: '1', summary: '', createdAt: 100 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await saveHistoryEntry({ calculatorType: 'cost', title: '새 계산', summary: '' });
      expect(result.map((e) => e.title)).toEqual(['새 계산', '3', '2']);
    });

    it('keeps more entries when a higher maxEntries is passed (subscribed users)', async () => {
      const stored = [
        { id: 'c', calculatorType: 'cost', title: '3', summary: '', createdAt: 300 },
        { id: 'b', calculatorType: 'cost', title: '2', summary: '', createdAt: 200 },
        { id: 'a', calculatorType: 'cost', title: '1', summary: '', createdAt: 100 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await saveHistoryEntry({ calculatorType: 'cost', title: '새 계산', summary: '' }, 100);
      expect(result.map((e) => e.title)).toEqual(['새 계산', '3', '2', '1']);
    });
  });

  describe('deleteHistoryEntry', () => {
    it('removes the entry with the matching id', async () => {
      const stored = [
        { id: 'a', calculatorType: 'cost', title: '1', summary: '', createdAt: 100 },
        { id: 'b', calculatorType: 'cost', title: '2', summary: '', createdAt: 200 },
      ];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await deleteHistoryEntry('a');
      expect(result.map((e) => e.id)).toEqual(['b']);
      expect(mockedStorage.setItem).toHaveBeenCalledWith('calculator-history-v1', JSON.stringify(result));
    });

    it('is a no-op when the id does not exist', async () => {
      const stored = [{ id: 'a', calculatorType: 'cost', title: '1', summary: '', createdAt: 100 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      const result = await deleteHistoryEntry('missing');
      expect(result).toEqual(stored);
    });

    it('still resolves when Storage.setItem rejects', async () => {
      const stored = [{ id: 'a', calculatorType: 'cost', title: '1', summary: '', createdAt: 100 }];
      mockedStorage.getItem.mockResolvedValue(JSON.stringify(stored));
      mockedStorage.setItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(deleteHistoryEntry('a')).resolves.toEqual([]);
    });
  });
});
