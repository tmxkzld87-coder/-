export const UNITS = ['g', 'kg', 'ml', 'L', '개', '장', '봉', '병', '캔', '직접입력'] as const;
export type Unit = (typeof UNITS)[number];

const UNIT_BASE_FACTOR: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  L: 1000,
  개: 1,
  장: 1,
  봉: 1,
  병: 1,
  캔: 1,
  직접입력: 1,
};

export type CostItem = {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseQuantity: number;
  purchaseUnit: Unit;
  usedQuantity: number;
  usedUnit: Unit;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

// A missing/zero field means the item isn't fully filled in yet — treated as 0 cost
// rather than an error, so the running total stays accurate while the user is still typing.
export function calculateItemCost(item: CostItem): number {
  if (item.purchasePrice <= 0 || item.purchaseQuantity <= 0 || item.usedQuantity <= 0) {
    return 0;
  }
  const purchaseBase = item.purchaseQuantity * UNIT_BASE_FACTOR[item.purchaseUnit];
  const usedBase = item.usedQuantity * UNIT_BASE_FACTOR[item.usedUnit];
  return (item.purchasePrice / purchaseBase) * usedBase;
}

export type CostSummaryInput = {
  sellingPrice: number;
  quantity: number;
  ingredients: CostItem[];
  additionalCosts: CostItem[];
};

export type CostSummaryResult = {
  totalIngredientCost: number;
  totalAdditionalCost: number;
  totalCost: number;
  unitCost: number;
  profit: number;
  costRatePercent: number;
  totalRevenue: number;
  totalProfit: number;
};

export function calculateCostSummary(input: CostSummaryInput): CostSummaryResult {
  const totalIngredientCost = input.ingredients.reduce((sum, item) => sum + calculateItemCost(item), 0);
  const totalAdditionalCost = input.additionalCosts.reduce((sum, item) => sum + calculateItemCost(item), 0);
  const totalCost = totalIngredientCost + totalAdditionalCost;
  const quantity = Math.max(1, input.quantity || 1);
  const unitCost = totalCost / quantity;
  const profit = input.sellingPrice - unitCost;
  const costRatePercent = input.sellingPrice > 0 ? roundToOneDecimal((unitCost / input.sellingPrice) * 100) : 0;
  const totalRevenue = input.sellingPrice * quantity;
  const totalProfit = profit * quantity;

  return {
    totalIngredientCost: roundToWon(totalIngredientCost),
    totalAdditionalCost: roundToWon(totalAdditionalCost),
    totalCost: roundToWon(totalCost),
    unitCost: roundToWon(unitCost),
    profit: roundToWon(profit),
    costRatePercent,
    totalRevenue: roundToWon(totalRevenue),
    totalProfit: roundToWon(totalProfit),
  };
}

export type CostRateStatus = 'none' | 'good' | 'ok' | 'warn' | 'bad';

export function costRateStatus(costRatePercent: number): CostRateStatus {
  if (costRatePercent <= 0) return 'none';
  if (costRatePercent <= 30) return 'good';
  if (costRatePercent <= 40) return 'ok';
  if (costRatePercent <= 50) return 'warn';
  return 'bad';
}

export function calculateVatBreakdown(vatInclusivePrice: number): { supplyAmount: number; vatAmount: number } {
  const supplyAmount = vatInclusivePrice / 1.1;
  return { supplyAmount: roundToWon(supplyAmount), vatAmount: roundToWon(vatInclusivePrice - supplyAmount) };
}

export function calculateTargetPriceByCostRate(unitCost: number, targetCostRatePercent: number, roundToTen: boolean): number {
  if (targetCostRatePercent <= 0) return 0;
  const price = unitCost / (targetCostRatePercent / 100);
  return roundToTen ? Math.round(price / 10) * 10 : roundToWon(price);
}

export function calculateRecommendedPriceByTargetProfit(unitCost: number, targetProfitPerUnit: number): number {
  return roundToWon(unitCost + targetProfitPerUnit);
}

export type FeeBreakdownInput = {
  sellingPrice: number;
  unitCost: number;
  platformFeePercent: number;
  paymentFeePercent: number;
  deliveryFee: number;
};

export type FeeBreakdownResult = {
  platformFeeAmount: number;
  paymentFeeAmount: number;
  netProfit: number;
};

export function calculateFeeBreakdown(input: FeeBreakdownInput): FeeBreakdownResult {
  const platformFeeAmount = roundToWon(input.sellingPrice * (input.platformFeePercent / 100));
  const paymentFeeAmount = roundToWon(input.sellingPrice * (input.paymentFeePercent / 100));
  const netProfit = roundToWon(input.sellingPrice - input.unitCost - platformFeeAmount - paymentFeeAmount - input.deliveryFee);
  return { platformFeeAmount, paymentFeeAmount, netProfit };
}
