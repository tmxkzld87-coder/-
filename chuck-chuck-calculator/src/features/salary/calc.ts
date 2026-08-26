const WEEKS_PER_MONTH = 4.345;
const WEEKLY_HOLIDAY_ELIGIBLE_HOURS = 15;
const FULL_TIME_WEEKLY_HOURS = 40;
const WEEKLY_HOLIDAY_HOURS = 8;
const DEFAULT_MONTHLY_WORK_HOURS = 209;

const NATIONAL_PENSION_RATE = 0.045;
const HEALTH_INSURANCE_RATE = 0.03545;
const LONG_TERM_CARE_RATE = 0.1295; // of health insurance, not of salary
const EMPLOYMENT_INSURANCE_RATE = 0.009;
const LOCAL_INCOME_TAX_RATE = 0.1; // of income tax

function roundToWon(value: number): number {
  return Math.round(value);
}

export type HourlyToMonthlyInput = {
  mode: 'hourlyToMonthly';
  hourlyWage: number;
  dailyHours: number;
  daysPerWeek: number;
  includeWeeklyHoliday: boolean;
};

export type HourlyToMonthlyResult = {
  weeklyHours: number;
  weeklyPay: number;
  weeklyHolidayPay: number;
  monthlyPay: number;
};

export function calculateHourlyToMonthly(input: HourlyToMonthlyInput): HourlyToMonthlyResult {
  if (input.hourlyWage <= 0) {
    throw new RangeError('hourlyWage must be greater than 0');
  }
  if (input.dailyHours <= 0 || input.daysPerWeek <= 0) {
    throw new RangeError('dailyHours and daysPerWeek must be greater than 0');
  }

  const weeklyHours = input.dailyHours * input.daysPerWeek;
  const weeklyPay = input.hourlyWage * weeklyHours;
  const weeklyHolidayPay =
    input.includeWeeklyHoliday && weeklyHours >= WEEKLY_HOLIDAY_ELIGIBLE_HOURS
      ? (weeklyHours / FULL_TIME_WEEKLY_HOURS) * WEEKLY_HOLIDAY_HOURS * input.hourlyWage
      : 0;
  const monthlyPay = roundToWon((weeklyPay + weeklyHolidayPay) * WEEKS_PER_MONTH);

  return { weeklyHours, weeklyPay: roundToWon(weeklyPay), weeklyHolidayPay: roundToWon(weeklyHolidayPay), monthlyPay };
}

export type AnnualToMonthlyInput = {
  mode: 'annualToMonthly';
  annualSalary: number;
  monthlyWorkHours?: number;
};

export type AnnualToMonthlyResult = {
  monthlyPay: number;
  hourlyWage: number;
};

export function calculateAnnualToMonthly(input: AnnualToMonthlyInput): AnnualToMonthlyResult {
  if (input.annualSalary <= 0) {
    throw new RangeError('annualSalary must be greater than 0');
  }
  const monthlyWorkHours = input.monthlyWorkHours ?? DEFAULT_MONTHLY_WORK_HOURS;
  if (monthlyWorkHours <= 0) {
    throw new RangeError('monthlyWorkHours must be greater than 0');
  }

  const monthlyPay = roundToWon(input.annualSalary / 12);
  const hourlyWage = roundToWon(monthlyPay / monthlyWorkHours);

  return { monthlyPay, hourlyWage };
}

// Simplified, clearly-approximate progressive bracket on monthly gross pay.
// Not the real 국세청 간이세액표 (which also depends on dependents) — for reference only.
const INCOME_TAX_BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 1_060_000, rate: 0 },
  { upTo: 1_500_000, rate: 0.01 },
  { upTo: 3_000_000, rate: 0.025 },
  { upTo: 5_000_000, rate: 0.05 },
  { upTo: 7_000_000, rate: 0.08 },
  { upTo: 10_000_000, rate: 0.12 },
  { upTo: Infinity, rate: 0.15 },
];

function approximateIncomeTax(monthlyGrossPay: number): number {
  // The last bracket's upTo is Infinity, so find() always matches.
  const bracket = INCOME_TAX_BRACKETS.find((b) => monthlyGrossPay <= b.upTo)!;
  return roundToWon(monthlyGrossPay * bracket.rate);
}

export type NetPayInput = {
  mode: 'netPay';
  monthlyGrossPay: number;
};

export type NetPayResult = {
  nationalPension: number;
  healthInsurance: number;
  longTermCareInsurance: number;
  employmentInsurance: number;
  totalInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  totalTax: number;
  netPay: number;
};

export function calculateNetPay(input: NetPayInput): NetPayResult {
  if (input.monthlyGrossPay <= 0) {
    throw new RangeError('monthlyGrossPay must be greater than 0');
  }

  const nationalPension = roundToWon(input.monthlyGrossPay * NATIONAL_PENSION_RATE);
  const healthInsurance = roundToWon(input.monthlyGrossPay * HEALTH_INSURANCE_RATE);
  const longTermCareInsurance = roundToWon(healthInsurance * LONG_TERM_CARE_RATE);
  const employmentInsurance = roundToWon(input.monthlyGrossPay * EMPLOYMENT_INSURANCE_RATE);
  const totalInsurance = nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance;

  const incomeTax = approximateIncomeTax(input.monthlyGrossPay);
  const localIncomeTax = roundToWon(incomeTax * LOCAL_INCOME_TAX_RATE);
  const totalTax = incomeTax + localIncomeTax;

  const netPay = input.monthlyGrossPay - totalInsurance - totalTax;

  return { nationalPension, healthInsurance, longTermCareInsurance, employmentInsurance, totalInsurance, incomeTax, localIncomeTax, totalTax, netPay };
}
