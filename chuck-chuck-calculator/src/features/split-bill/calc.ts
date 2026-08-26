export type RoundUnit = 0 | 10 | 100 | 1000;

export type EvenSplitInput = {
  mode: 'even';
  totalAmount: number;
  headcount: number;
  roundUnit: RoundUnit;
};

export type EvenSplitResult = {
  perPersonRaw: number;
  perPerson: number;
  settledTotal: number;
  remainder: number;
};

export type Participant = {
  name: string;
  amount: number;
};

export type WeightedSplitInput = {
  mode: 'weighted';
  participants: Participant[];
};

export type ParticipantBalance = Participant & { balance: number };
export type Transfer = { from: string; to: string; amount: number };

export type WeightedSplitResult = {
  totalAmount: number;
  averageAmount: number;
  balances: ParticipantBalance[];
  transfers: Transfer[];
};

function roundToWon(value: number): number {
  return Math.round(value);
}

export function calculateEvenSplit(input: EvenSplitInput): EvenSplitResult {
  if (input.totalAmount <= 0) {
    throw new RangeError('totalAmount must be greater than 0');
  }
  if (input.headcount <= 0) {
    throw new RangeError('headcount must be greater than 0');
  }

  const perPersonRaw = input.totalAmount / input.headcount;
  const perPerson =
    input.roundUnit === 0
      ? Math.floor(perPersonRaw)
      : Math.round(perPersonRaw / input.roundUnit) * input.roundUnit;
  const settledTotal = perPerson * input.headcount;
  const remainder = input.totalAmount - settledTotal;

  return { perPersonRaw, perPerson, settledTotal, remainder };
}

const SETTLEMENT_EPSILON = 0.5;

export function calculateWeightedSplit(input: WeightedSplitInput): WeightedSplitResult {
  if (input.participants.length < 2) {
    throw new RangeError('at least 2 participants are required');
  }
  if (input.participants.some((p) => p.amount < 0)) {
    throw new RangeError('participant amount must not be negative');
  }

  const totalAmount = input.participants.reduce((sum, p) => sum + p.amount, 0);
  const averageAmount = totalAmount / input.participants.length;

  const balances: ParticipantBalance[] = input.participants.map((p) => ({
    ...p,
    balance: roundToWon(p.amount - averageAmount),
  }));

  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ name: b.name, remaining: b.balance }))
    .sort((a, b) => b.remaining - a.remaining);
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ name: b.name, remaining: -b.balance }))
    .sort((a, b) => b.remaining - a.remaining);

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    // Guarded by the loop condition above, so both indices are always in range.
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;
    const amount = Math.min(creditor.remaining, debtor.remaining);

    if (amount > SETTLEMENT_EPSILON) {
      transfers.push({ from: debtor.name, to: creditor.name, amount: roundToWon(amount) });
    }

    creditor.remaining -= amount;
    debtor.remaining -= amount;
    if (creditor.remaining <= SETTLEMENT_EPSILON) ci += 1;
    if (debtor.remaining <= SETTLEMENT_EPSILON) di += 1;
  }

  return { totalAmount, averageAmount: roundToWon(averageAmount), balances, transfers };
}
