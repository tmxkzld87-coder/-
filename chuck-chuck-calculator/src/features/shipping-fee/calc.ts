export type ShippingFeeInput = {
  unitPrice: number;
  quantity: number;
  shippingFee: number;
  freeShippingThreshold?: number;
};

export type ShippingFeeResult = {
  productTotal: number;
  shippingCharged: number;
  finalTotal: number;
  isFreeShipping: boolean;
  amountToFreeShipping: number | null;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

export function calculateShippingFee(input: ShippingFeeInput): ShippingFeeResult {
  if (input.unitPrice <= 0) {
    throw new RangeError('unitPrice must be greater than 0');
  }
  if (input.quantity <= 0) {
    throw new RangeError('quantity must be greater than 0');
  }

  const productTotal = roundToWon(input.unitPrice * input.quantity);
  const hasThreshold = input.freeShippingThreshold !== undefined;
  const isFreeShipping = hasThreshold && productTotal >= (input.freeShippingThreshold as number);
  const shippingCharged = isFreeShipping ? 0 : input.shippingFee;
  const finalTotal = productTotal + shippingCharged;
  const amountToFreeShipping = hasThreshold
    ? Math.max(0, (input.freeShippingThreshold as number) - productTotal)
    : null;

  return { productTotal, shippingCharged, finalTotal, isFreeShipping, amountToFreeShipping };
}
