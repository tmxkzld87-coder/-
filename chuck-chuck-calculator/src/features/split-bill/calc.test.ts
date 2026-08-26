import { calculateEvenSplit, calculateWeightedSplit } from './calc';

describe('calculateEvenSplit', () => {
  it('divides the total evenly and rounds to the nearest 100 by default behavior when asked', () => {
    const result = calculateEvenSplit({ mode: 'even', totalAmount: 10000, headcount: 3, roundUnit: 100 });
    // 10000 / 3 = 3333.33 -> rounds to nearest 100 = 3300
    expect(result.perPerson).toBe(3300);
    expect(result.settledTotal).toBe(9900);
    expect(result.remainder).toBe(100);
  });

  it('divides exactly when the total splits evenly', () => {
    const result = calculateEvenSplit({ mode: 'even', totalAmount: 10000, headcount: 2, roundUnit: 100 });
    expect(result.perPerson).toBe(5000);
    expect(result.remainder).toBe(0);
  });

  it('floors to the won with no rounding unit', () => {
    const result = calculateEvenSplit({ mode: 'even', totalAmount: 10000, headcount: 3, roundUnit: 0 });
    expect(result.perPerson).toBe(3333);
    expect(result.remainder).toBe(1);
  });

  it('rejects a non-positive total amount', () => {
    expect(() => calculateEvenSplit({ mode: 'even', totalAmount: 0, headcount: 2, roundUnit: 100 })).toThrow(
      RangeError,
    );
  });

  it('rejects a headcount of 0 or less', () => {
    expect(() => calculateEvenSplit({ mode: 'even', totalAmount: 10000, headcount: 0, roundUnit: 100 })).toThrow(
      RangeError,
    );
  });
});

describe('calculateWeightedSplit', () => {
  it('settles three participants with the minimum number of transfers', () => {
    // A paid 30000, B paid 0, C paid 0 -> average 10000, A is owed 20000, B and C each owe 10000
    const result = calculateWeightedSplit({
      mode: 'weighted',
      participants: [
        { name: 'A', amount: 30000 },
        { name: 'B', amount: 0 },
        { name: 'C', amount: 0 },
      ],
    });
    expect(result.averageAmount).toBe(10000);
    expect(result.transfers).toEqual(
      expect.arrayContaining([
        { from: 'B', to: 'A', amount: 10000 },
        { from: 'C', to: 'A', amount: 10000 },
      ]),
    );
    expect(result.transfers).toHaveLength(2);
  });

  it('produces no transfers when everyone paid the same amount', () => {
    const result = calculateWeightedSplit({
      mode: 'weighted',
      participants: [
        { name: 'A', amount: 10000 },
        { name: 'B', amount: 10000 },
      ],
    });
    expect(result.transfers).toEqual([]);
  });

  it('rejects fewer than 2 participants', () => {
    expect(() => calculateWeightedSplit({ mode: 'weighted', participants: [{ name: 'A', amount: 1000 }] })).toThrow(
      RangeError,
    );
  });

  it('rejects a negative participant amount', () => {
    expect(() =>
      calculateWeightedSplit({
        mode: 'weighted',
        participants: [
          { name: 'A', amount: -1000 },
          { name: 'B', amount: 1000 },
        ],
      }),
    ).toThrow(RangeError);
  });
});
