import {
  calculateCostSummary,
  calculateFeeBreakdown,
  calculateItemCost,
  calculateRecommendedPriceByTargetProfit,
  calculateTargetPriceByCostRate,
  calculateVatBreakdown,
  costRateStatus,
  type CostItem,
} from './calc';

function item(overrides: Partial<CostItem> = {}): CostItem {
  return {
    id: 'i1',
    name: '원두',
    purchasePrice: 20000,
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    usedQuantity: 20,
    usedUnit: 'g',
    ...overrides,
  };
}

describe('calculateItemCost', () => {
  it('converts purchase and used quantities to a common base unit (kg -> g)', () => {
    // 20000 / (1kg = 1000g) * 20g = 400
    expect(calculateItemCost(item())).toBe(400);
  });

  it('works when purchase and used units already match', () => {
    expect(calculateItemCost(item({ purchaseUnit: '개', purchaseQuantity: 100, purchasePrice: 5000, usedUnit: '개', usedQuantity: 1 }))).toBe(50);
  });

  it('treats an incomplete item (any required field 0) as zero cost, not an error', () => {
    expect(calculateItemCost(item({ purchasePrice: 0 }))).toBe(0);
    expect(calculateItemCost(item({ purchaseQuantity: 0 }))).toBe(0);
    expect(calculateItemCost(item({ usedQuantity: 0 }))).toBe(0);
  });
});

describe('calculateCostSummary', () => {
  it('sums ingredients and additional costs, then derives per-unit figures', () => {
    const result = calculateCostSummary({
      sellingPrice: 4500,
      quantity: 1,
      ingredients: [item()], // 400
      additionalCosts: [item({ id: 'a1', purchasePrice: 5000, purchaseQuantity: 100, purchaseUnit: '개', usedQuantity: 1, usedUnit: '개' })], // 50
    });
    expect(result.totalIngredientCost).toBe(400);
    expect(result.totalAdditionalCost).toBe(50);
    expect(result.totalCost).toBe(450);
    expect(result.unitCost).toBe(450);
    expect(result.profit).toBe(4050);
    expect(result.costRatePercent).toBe(10);
    expect(result.totalRevenue).toBe(4500);
    expect(result.totalProfit).toBe(4050);
  });

  it('divides total cost by quantity to get unit cost when selling more than 1 at a time', () => {
    const result = calculateCostSummary({
      sellingPrice: 1000,
      quantity: 4,
      ingredients: [item({ purchasePrice: 4000, purchaseQuantity: 1, purchaseUnit: '개', usedQuantity: 1, usedUnit: '개' })],
      additionalCosts: [],
    });
    expect(result.totalCost).toBe(4000);
    expect(result.unitCost).toBe(1000);
  });

  it('returns a 0% cost rate when selling price is not set yet, instead of dividing by zero', () => {
    const result = calculateCostSummary({ sellingPrice: 0, quantity: 1, ingredients: [item()], additionalCosts: [] });
    expect(result.costRatePercent).toBe(0);
  });
});

describe('costRateStatus', () => {
  it('buckets the cost rate into the 4 reference tiers', () => {
    expect(costRateStatus(0)).toBe('none');
    expect(costRateStatus(30)).toBe('good');
    expect(costRateStatus(40)).toBe('ok');
    expect(costRateStatus(50)).toBe('warn');
    expect(costRateStatus(51)).toBe('bad');
  });
});

describe('calculateVatBreakdown', () => {
  it('splits a VAT-inclusive price into supply amount and VAT', () => {
    expect(calculateVatBreakdown(11000)).toEqual({ supplyAmount: 10000, vatAmount: 1000 });
  });
});

describe('calculateTargetPriceByCostRate', () => {
  it('derives the price needed to hit a target cost rate', () => {
    expect(calculateTargetPriceByCostRate(300, 30, false)).toBe(1000);
  });

  it('rounds to the nearest 10 won when requested', () => {
    // 300 / 0.33 = 909.09...
    expect(calculateTargetPriceByCostRate(300, 33, true)).toBe(910);
  });
});

describe('calculateRecommendedPriceByTargetProfit', () => {
  it('adds the desired per-unit profit on top of unit cost', () => {
    expect(calculateRecommendedPriceByTargetProfit(450, 1500)).toBe(1950);
  });
});

describe('calculateFeeBreakdown', () => {
  it('deducts platform/payment fees and delivery cost from the raw profit', () => {
    const result = calculateFeeBreakdown({
      sellingPrice: 10000,
      unitCost: 4000,
      platformFeePercent: 25,
      paymentFeePercent: 3,
      deliveryFee: 500,
    });
    expect(result.platformFeeAmount).toBe(2500);
    expect(result.paymentFeeAmount).toBe(300);
    expect(result.netProfit).toBe(10000 - 4000 - 2500 - 300 - 500);
  });
});
