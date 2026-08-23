import { calculateCost } from './calc';

describe('calculateCost', () => {
  it('mode marginToPrice: derives selling price from cost + target margin', () => {
    const result = calculateCost({
      mode: 'marginToPrice',
      materialCost: 3000,
      subMaterialCost: 500,
      marginRatePercent: 30,
    });
    expect(result).toEqual({
      totalCost: 3500,
      sellingPrice: 5000,
      costRatePercent: 70,
      marginRatePercent: 30,
      expectedProfit: 1500,
    });
  });

  it('mode priceToMargin: derives margin rate from cost + given selling price', () => {
    const result = calculateCost({
      mode: 'priceToMargin',
      materialCost: 3000,
      subMaterialCost: 500,
      sellingPrice: 5000,
    });
    expect(result).toEqual({
      totalCost: 3500,
      sellingPrice: 5000,
      costRatePercent: 70,
      marginRatePercent: 30,
      expectedProfit: 1500,
    });
  });

  it('treats missing optional costs as zero', () => {
    const result = calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 50 });
    expect(result.totalCost).toBe(1000);
    expect(result.sellingPrice).toBe(2000);
  });

  it('rejects a margin rate of 100 or more', () => {
    expect(() =>
      calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 100 }),
    ).toThrow(RangeError);
  });

  it('rejects a selling price of 0 or less', () => {
    expect(() =>
      calculateCost({ mode: 'priceToMargin', materialCost: 1000, sellingPrice: 0 }),
    ).toThrow(RangeError);
  });

  it('rounds money to the nearest won and percentages to one decimal', () => {
    const result = calculateCost({ mode: 'marginToPrice', materialCost: 1000, marginRatePercent: 33 });
    // 1000 / (1 - 0.33) = 1492.5373...
    expect(result.sellingPrice).toBe(1493);
    expect(Number.isInteger(result.sellingPrice)).toBe(true);
    expect(result.costRatePercent).toBe(67);
  });
});
