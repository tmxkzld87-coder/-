import { calculateAnnualToMonthly, calculateHourlyToMonthly, calculateNetPay } from './calc';

describe('calculateHourlyToMonthly', () => {
  it('includes weekly-holiday pay by default toggle-on behavior when requested', () => {
    const result = calculateHourlyToMonthly({
      mode: 'hourlyToMonthly',
      hourlyWage: 10000,
      dailyHours: 8,
      daysPerWeek: 5,
      includeWeeklyHoliday: true,
    });
    expect(result.weeklyHours).toBe(40);
    expect(result.weeklyPay).toBe(400000);
    expect(result.weeklyHolidayPay).toBe(80000);
    expect(result.monthlyPay).toBe(2085600);
  });

  it('excludes weekly-holiday pay when the toggle is off', () => {
    const result = calculateHourlyToMonthly({
      mode: 'hourlyToMonthly',
      hourlyWage: 10000,
      dailyHours: 8,
      daysPerWeek: 5,
      includeWeeklyHoliday: false,
    });
    expect(result.weeklyHolidayPay).toBe(0);
    expect(result.monthlyPay).toBe(1738000);
  });

  it('withholds weekly-holiday pay for under-15-hour weeks even with the toggle on', () => {
    const result = calculateHourlyToMonthly({
      mode: 'hourlyToMonthly',
      hourlyWage: 10000,
      dailyHours: 2,
      daysPerWeek: 5,
      includeWeeklyHoliday: true,
    });
    expect(result.weeklyHours).toBe(10);
    expect(result.weeklyHolidayPay).toBe(0);
  });

  it('rejects a non-positive hourly wage', () => {
    expect(() =>
      calculateHourlyToMonthly({ mode: 'hourlyToMonthly', hourlyWage: 0, dailyHours: 8, daysPerWeek: 5, includeWeeklyHoliday: true }),
    ).toThrow(RangeError);
  });
});

describe('calculateAnnualToMonthly', () => {
  it('divides annual salary by 12 and derives an hourly rate from the default 209 monthly hours', () => {
    const result = calculateAnnualToMonthly({ mode: 'annualToMonthly', annualSalary: 36_000_000 });
    expect(result.monthlyPay).toBe(3_000_000);
    expect(result.hourlyWage).toBe(14354);
  });

  it('uses a custom monthly work-hours figure when provided', () => {
    const result = calculateAnnualToMonthly({ mode: 'annualToMonthly', annualSalary: 36_000_000, monthlyWorkHours: 200 });
    expect(result.hourlyWage).toBe(15000);
  });

  it('rejects a non-positive annual salary', () => {
    expect(() => calculateAnnualToMonthly({ mode: 'annualToMonthly', annualSalary: 0 })).toThrow(RangeError);
  });
});

describe('calculateNetPay', () => {
  it('deducts 4 major insurances and an approximate income tax from gross pay', () => {
    const result = calculateNetPay({ mode: 'netPay', monthlyGrossPay: 3_000_000 });
    expect(result.nationalPension).toBe(135000);
    expect(result.healthInsurance).toBe(106350);
    expect(result.longTermCareInsurance).toBe(13772);
    expect(result.employmentInsurance).toBe(27000);
    expect(result.totalInsurance).toBe(282122);
    expect(result.incomeTax).toBe(75000);
    expect(result.localIncomeTax).toBe(7500);
    expect(result.netPay).toBe(3_000_000 - 282122 - 75000 - 7500);
  });

  it('rejects a non-positive gross pay', () => {
    expect(() => calculateNetPay({ mode: 'netPay', monthlyGrossPay: 0 })).toThrow(RangeError);
  });
});
