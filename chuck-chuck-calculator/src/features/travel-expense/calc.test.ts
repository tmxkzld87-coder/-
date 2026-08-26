import { calculateTravelExpense } from './calc';

const categories = { lodging: 200000, transport: 100000, food: 150000, activity: 50000, etc: 0 };

describe('calculateTravelExpense', () => {
  it('sums categories and divides by headcount', () => {
    const result = calculateTravelExpense({ categories, headcount: 2 });
    expect(result.totalCost).toBe(500000);
    expect(result.perPerson).toBe(250000);
    expect(result.perDay).toBeNull();
  });

  it('computes a per-day average only when days is provided', () => {
    const result = calculateTravelExpense({ categories, headcount: 2, days: 5 });
    expect(result.perDay).toBe(100000);
  });

  it('computes each category share as a percentage of the total', () => {
    const result = calculateTravelExpense({ categories, headcount: 2 });
    expect(result.shares.lodging).toBe(40);
    expect(result.shares.transport).toBe(20);
    expect(result.shares.food).toBe(30);
    expect(result.shares.activity).toBe(10);
    expect(result.shares.etc).toBe(0);
  });

  it('treats all-zero categories as zero shares instead of dividing by zero', () => {
    const result = calculateTravelExpense({
      categories: { lodging: 0, transport: 0, food: 0, activity: 0, etc: 0 },
      headcount: 2,
    });
    expect(result.totalCost).toBe(0);
    expect(Object.values(result.shares).every((s) => s === 0)).toBe(true);
  });

  it('rejects a headcount of 0 or less', () => {
    expect(() => calculateTravelExpense({ categories, headcount: 0 })).toThrow(RangeError);
  });
});
