export type CalculatorId =
  | 'cost'
  | 'discount'
  | 'split-bill'
  | 'salary'
  | 'travel-expense'
  | 'shipping-fee'
  | 'profit-rate'
  | 'vat';

export type CalculatorMeta = {
  id: CalculatorId;
  name: string;
  description: string;
  icon: string;
  route: string;
  implemented: boolean;
};

export const calculators: CalculatorMeta[] = [
  { id: 'cost', name: '원가 · 마진', description: '원가율과 목표 판매가 계산', icon: '🧾', route: '/cost', implemented: true },
  { id: 'discount', name: '할인 · 세일', description: '할인 후 가격 계산', icon: '%', route: '/discount', implemented: true },
  { id: 'split-bill', name: '더치페이', description: '인원별 금액 계산', icon: '👥', route: '/split-bill', implemented: true },
  { id: 'salary', name: '급여 · 시급', description: '월급과 시급 계산', icon: '₩', route: '/salary', implemented: true },
  { id: 'travel-expense', name: '여행 경비', description: '여행 총비용과 1인당 비용 계산', icon: '🧳', route: '/travel-expense', implemented: true },
  { id: 'shipping-fee', name: '배송비', description: '배송비와 총 결제금액 계산', icon: '🚚', route: '/shipping-fee', implemented: true },
  { id: 'profit-rate', name: '수익률', description: '수익률과 마진 계산', icon: '📈', route: '/profit-rate', implemented: true },
  { id: 'vat', name: '부가세', description: '공급가와 부가세 계산', icon: '🏷️', route: '/vat', implemented: true },
];

export const FREQUENTLY_USED_IDS: CalculatorId[] = ['cost', 'discount', 'split-bill', 'travel-expense'];

export function findCalculator(id: CalculatorId): CalculatorMeta {
  const found = calculators.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown calculator id: ${id}`);
  }
  return found;
}

export function searchCalculators(query: string): CalculatorMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return calculators;
  }
  return calculators.filter(
    (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
  );
}
