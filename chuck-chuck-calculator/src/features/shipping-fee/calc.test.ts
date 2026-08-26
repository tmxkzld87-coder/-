import { calculateShippingFee } from './calc';

describe('calculateShippingFee', () => {
  it('always charges shipping when no free-shipping threshold is set', () => {
    const result = calculateShippingFee({ unitPrice: 10000, quantity: 2, shippingFee: 3000 });
    expect(result).toEqual({
      productTotal: 20000,
      shippingCharged: 3000,
      finalTotal: 23000,
      isFreeShipping: false,
      amountToFreeShipping: null,
    });
  });

  it('waives shipping once the product total meets the free-shipping threshold', () => {
    const result = calculateShippingFee({
      unitPrice: 15000,
      quantity: 2,
      shippingFee: 3000,
      freeShippingThreshold: 30000,
    });
    expect(result.isFreeShipping).toBe(true);
    expect(result.shippingCharged).toBe(0);
    expect(result.finalTotal).toBe(30000);
    expect(result.amountToFreeShipping).toBe(0);
  });

  it('reports how much more is needed to reach free shipping', () => {
    const result = calculateShippingFee({
      unitPrice: 10000,
      quantity: 1,
      shippingFee: 3000,
      freeShippingThreshold: 30000,
    });
    expect(result.isFreeShipping).toBe(false);
    expect(result.shippingCharged).toBe(3000);
    expect(result.amountToFreeShipping).toBe(20000);
  });

  it('rejects a unit price of 0 or less', () => {
    expect(() => calculateShippingFee({ unitPrice: 0, quantity: 1, shippingFee: 0 })).toThrow(RangeError);
  });

  it('rejects a quantity of 0 or less', () => {
    expect(() => calculateShippingFee({ unitPrice: 1000, quantity: 0, shippingFee: 0 })).toThrow(RangeError);
  });
});
