import { calculateVat } from './calc';

describe('calculateVat', () => {
  it('mode fromSupply: derives VAT and total from supply amount', () => {
    const result = calculateVat({ mode: 'fromSupply', supplyAmount: 10000 });
    expect(result).toEqual({ supplyAmount: 10000, vatAmount: 1000, totalAmount: 11000 });
  });

  it('mode fromTotal: derives supply amount and VAT from a VAT-included total', () => {
    const result = calculateVat({ mode: 'fromTotal', totalAmount: 11000 });
    expect(result).toEqual({ supplyAmount: 10000, vatAmount: 1000, totalAmount: 11000 });
  });

  it('rounds to the nearest won for non-round totals', () => {
    const result = calculateVat({ mode: 'fromTotal', totalAmount: 10000 });
    // 10000 / 1.1 = 9090.909...
    expect(result.supplyAmount).toBe(9091);
    expect(result.vatAmount).toBe(909);
  });

  it('rejects a supply amount of 0 or less', () => {
    expect(() => calculateVat({ mode: 'fromSupply', supplyAmount: 0 })).toThrow(RangeError);
  });

  it('rejects a total amount of 0 or less', () => {
    expect(() => calculateVat({ mode: 'fromTotal', totalAmount: -1 })).toThrow(RangeError);
  });
});
