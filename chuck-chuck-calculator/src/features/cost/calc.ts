const MAX_MARGIN_RATE_PERCENT = 100;

export type CostInputs = {
  materialCost: number;
  subMaterialCost?: number;
  laborCost?: number;
  otherCost?: number;
};

export type CostCalcInput =
  | (CostInputs & { mode: 'marginToPrice'; marginRatePercent: number })
  | (CostInputs & { mode: 'priceToMargin'; sellingPrice: number });

export type CostCalcResult = {
  totalCost: number;
  sellingPrice: number;
  costRatePercent: number;
  marginRatePercent: number;
  expectedProfit: number;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function sumTotalCost(inputs: CostInputs): number {
  return inputs.materialCost + (inputs.subMaterialCost ?? 0) + (inputs.laborCost ?? 0) + (inputs.otherCost ?? 0);
}

export function calculateCost(input: CostCalcInput): CostCalcResult {
  const totalCost = sumTotalCost(input);

  let sellingPrice: number;
  if (input.mode === 'marginToPrice') {
    if (input.marginRatePercent >= MAX_MARGIN_RATE_PERCENT) {
      throw new RangeError('marginRatePercent must be less than 100');
    }
    sellingPrice = roundToWon(totalCost / (1 - input.marginRatePercent / 100));
  } else {
    if (input.sellingPrice <= 0) {
      throw new RangeError('sellingPrice must be greater than 0');
    }
    sellingPrice = input.sellingPrice;
  }

  const costRatePercent = sellingPrice === 0 ? 0 : roundToOneDecimal((totalCost / sellingPrice) * 100);
  const marginRatePercent =
    sellingPrice === 0 ? 0 : roundToOneDecimal(((sellingPrice - totalCost) / sellingPrice) * 100);
  const expectedProfit = roundToWon(sellingPrice - totalCost);

  return { totalCost, sellingPrice, costRatePercent, marginRatePercent, expectedProfit };
}
