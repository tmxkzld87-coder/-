export type ProfitRateInput = {
  costPrice: number;
  sellPrice: number;
};

export type ProfitRateResult = {
  profit: number;
  roi: number;
  marginRate: number;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateProfitRate(input: ProfitRateInput): ProfitRateResult {
  if (input.costPrice <= 0) {
    throw new RangeError('costPrice must be greater than 0');
  }
  if (input.sellPrice <= 0) {
    throw new RangeError('sellPrice must be greater than 0');
  }

  const profit = roundToWon(input.sellPrice - input.costPrice);
  const roi = roundToOneDecimal((profit / input.costPrice) * 100);
  const marginRate = roundToOneDecimal((profit / input.sellPrice) * 100);

  return { profit, roi, marginRate };
}
