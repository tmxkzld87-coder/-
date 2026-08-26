import { Storage } from '@apps-in-toss/framework';
import { getAdFreeUntil, isAdFreeActive, grantAdFreeMinutes } from './adFreeSession';

jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
  InlineAd: () => null,
}));

const mockedStorage = jest.mocked(Storage);

describe('adFreeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAdFreeUntil', () => {
    it('returns 0 when nothing is stored', async () => {
      mockedStorage.getItem.mockResolvedValue(null);
      await expect(getAdFreeUntil()).resolves.toBe(0);
    });

    it('returns 0 when the stored value is not a number', async () => {
      mockedStorage.getItem.mockResolvedValue('not a number');
      await expect(getAdFreeUntil()).resolves.toBe(0);
    });

    it('returns 0 when Storage.getItem rejects', async () => {
      mockedStorage.getItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(getAdFreeUntil()).resolves.toBe(0);
    });

    it('parses a previously stored timestamp', async () => {
      mockedStorage.getItem.mockResolvedValue('2000000');
      await expect(getAdFreeUntil()).resolves.toBe(2_000_000);
    });
  });

  describe('isAdFreeActive', () => {
    it('is false when the stored timestamp is in the past', async () => {
      mockedStorage.getItem.mockResolvedValue('999999');
      await expect(isAdFreeActive()).resolves.toBe(false);
    });

    it('is true when the stored timestamp is in the future', async () => {
      mockedStorage.getItem.mockResolvedValue('1000001');
      await expect(isAdFreeActive()).resolves.toBe(true);
    });
  });

  describe('grantAdFreeMinutes', () => {
    it('stores now + N minutes and returns that timestamp', async () => {
      const until = await grantAdFreeMinutes(30);
      expect(until).toBe(1_000_000 + 30 * 60_000);
      expect(mockedStorage.setItem).toHaveBeenCalledWith('ad-free-until-v1', String(until));
    });

    it('still resolves with the computed timestamp when Storage.setItem rejects', async () => {
      mockedStorage.setItem.mockRejectedValue(new Error('bridge unavailable'));
      await expect(grantAdFreeMinutes(30)).resolves.toBe(1_000_000 + 30 * 60_000);
    });
  });
});
