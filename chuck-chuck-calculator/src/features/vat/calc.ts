const VAT_RATE = 0.1;

export type VatCalcInput =
  | { mode: 'fromSupply'; supplyAmount: number }
  | { mode: 'fromTotal'; totalAmount: number };

export type VatCalcResult = {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

export function calculateVat(input: VatCalcInput): VatCalcResult {
  if (input.mode === 'fromSupply') {
    if (input.supplyAmount <= 0) {
      throw new RangeError('supplyAmount must be greater than 0');
    }
    const vatAmount = roundToWon(input.supplyAmount * VAT_RATE);
    return { supplyAmount: roundToWon(input.supplyAmount), vatAmount, totalAmount: roundToWon(input.supplyAmount) + vatAmount };
  }

  if (input.totalAmount <= 0) {
    throw new RangeError('totalAmount must be greater than 0');
  }
  const supplyAmount = roundToWon(input.totalAmount / (1 + VAT_RATE));
  const vatAmount = roundToWon(input.totalAmount) - supplyAmount;
  return { supplyAmount, vatAmount, totalAmount: roundToWon(input.totalAmount) };
}
