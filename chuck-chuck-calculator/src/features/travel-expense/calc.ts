export type TravelExpenseCategories = {
  lodging: number;
  transport: number;
  food: number;
  activity: number;
  etc: number;
};

export type TravelExpenseInput = {
  categories: TravelExpenseCategories;
  headcount: number;
  days?: number;
};

export type TravelExpenseResult = {
  totalCost: number;
  perPerson: number;
  perDay: number | null;
  shares: Record<keyof TravelExpenseCategories, number>;
};

function roundToWon(value: number): number {
  return Math.round(value);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateTravelExpense(input: TravelExpenseInput): TravelExpenseResult {
  if (input.headcount <= 0) {
    throw new RangeError('headcount must be greater than 0');
  }

  const { lodging, transport, food, activity, etc } = input.categories;
  const totalCost = lodging + transport + food + activity + etc;
  const perPerson = roundToWon(totalCost / input.headcount);
  const perDay = input.days && input.days > 0 ? roundToWon(totalCost / input.days) : null;

  const shareOf = (amount: number) => (totalCost === 0 ? 0 : roundToOneDecimal((amount / totalCost) * 100));
  const shares: Record<keyof TravelExpenseCategories, number> = {
    lodging: shareOf(lodging),
    transport: shareOf(transport),
    food: shareOf(food),
    activity: shareOf(activity),
    etc: shareOf(etc),
  };

  return { totalCost, perPerson, perDay, shares };
}
