export type DiscountCalcInput =
  | { mode: 'rate'; regularPrice: number; discountedPrice: number }
  | { mode: 'price'; regularPrice: number; discountRate: number }
  | { mode: 'stacked'; regularPrice: number; discountRates: number[] };

export type DiscountCalcResult = {
  finalPrice: number;
  savings: number;
  effectiveRate: number;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateDiscount(input: DiscountCalcInput): DiscountCalcResult {
  if (input.regularPrice <= 0) {
    throw new RangeError('regularPrice must be greater than 0');
  }

  if (input.mode === 'rate') {
    if (input.discountedPrice > input.regularPrice) {
      throw new RangeError('discountedPrice must not exceed regularPrice');
    }
    const savings = roundToWon(input.regularPrice - input.discountedPrice);
    const effectiveRate = roundToOneDecimal((savings / input.regularPrice) * 100);
    return { finalPrice: roundToWon(input.discountedPrice), savings, effectiveRate };
  }

  if (input.mode === 'price') {
    if (input.discountRate > 100 || input.discountRate < 0) {
      throw new RangeError('discountRate must be between 0 and 100');
    }
    const finalPrice = roundToWon(input.regularPrice * (1 - input.discountRate / 100));
    const savings = roundToWon(input.regularPrice) - finalPrice;
    return { finalPrice, savings, effectiveRate: input.discountRate };
  }

  if (input.discountRates.length === 0) {
    throw new RangeError('discountRates must not be empty');
  }
  if (input.discountRates.some((r) => r < 0 || r > 100)) {
    throw new RangeError('each discountRate must be between 0 and 100');
  }

  const finalPriceRaw = input.discountRates.reduce((price, rate) => price * (1 - rate / 100), input.regularPrice);
  const finalPrice = roundToWon(finalPriceRaw);
  const savings = roundToWon(input.regularPrice) - finalPrice;
  const effectiveRate = roundToOneDecimal((savings / input.regularPrice) * 100);

  return { finalPrice, savings, effectiveRate };
}
