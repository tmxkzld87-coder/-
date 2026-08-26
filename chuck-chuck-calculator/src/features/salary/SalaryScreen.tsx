import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateAnnualToMonthly, calculateHourlyToMonthly, calculateNetPay } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'hourlyToMonthly' | 'annualToMonthly' | 'netPay';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export type SalaryScreenProps = { onBack?: () => void };

export function SalaryScreen({ onBack }: SalaryScreenProps) {
  const [mode, setMode] = useState<Mode>('hourlyToMonthly');

  const [hourlyWage, setHourlyWage] = useState('');
  const [dailyHours, setDailyHours] = useState('8');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [includeWeeklyHoliday, setIncludeWeeklyHoliday] = useState(true);

  const [annualSalary, setAnnualSalary] = useState('');
  const [monthlyWorkHours, setMonthlyWorkHours] = useState('209');

  const [monthlyGrossPay, setMonthlyGrossPay] = useState('');

  const hourlyResult = useMemo(() => {
    if (hourlyWage === '') return null;
    try {
      return calculateHourlyToMonthly({
        mode: 'hourlyToMonthly',
        hourlyWage: toNumber(hourlyWage),
        dailyHours: toNumber(dailyHours) || 1,
        daysPerWeek: toNumber(daysPerWeek) || 1,
        includeWeeklyHoliday,
      });
    } catch {
      return null;
    }
  }, [hourlyWage, dailyHours, daysPerWeek, includeWeeklyHoliday]);

  const annualResult = useMemo(() => {
    if (annualSalary === '') return null;
    try {
      return calculateAnnualToMonthly({ mode: 'annualToMonthly', annualSalary: toNumber(annualSalary), monthlyWorkHours: toNumber(monthlyWorkHours) || undefined });
    } catch {
      return null;
    }
  }, [annualSalary, monthlyWorkHours]);

  const netPayResult = useMemo(() => {
    if (monthlyGrossPay === '') return null;
    try {
      return calculateNetPay({ mode: 'netPay', monthlyGrossPay: toNumber(monthlyGrossPay) });
    } catch {
      return null;
    }
  }, [monthlyGrossPay]);

  const handleReset = () => {
    setMode('hourlyToMonthly');
    setHourlyWage('');
    setDailyHours('8');
    setDaysPerWeek('5');
    setIncludeWeeklyHoliday(true);
    setAnnualSalary('');
    setMonthlyWorkHours('209');
    setMonthlyGrossPay('');
  };

  return (
    <CalculatorChrome
      testIDPrefix="salary"
      title="급여·시급"
      onBack={onBack}
      calculatorType="salary"
      onReset={handleReset}
      titlePlaceholder="예: 이번 달 알바"
      getSaveValidationError={() => {
        if (mode === 'hourlyToMonthly') return hourlyResult ? null : '시급을 입력해주세요.';
        if (mode === 'annualToMonthly') return annualResult ? null : '연봉을 입력해주세요.';
        return netPayResult ? null : '세전 월급을 입력해주세요.';
      }}
      getSaveSummary={() => {
        if (mode === 'hourlyToMonthly') return hourlyResult ? `월 예상 급여 ${formatWon(hourlyResult.monthlyPay)}` : '';
        if (mode === 'annualToMonthly') return annualResult ? `월급 ${formatWon(annualResult.monthlyPay)} · 환산 시급 ${formatWon(annualResult.hourlyWage)}` : '';
        return netPayResult ? `실수령액(근사) ${formatWon(netPayResult.netPay)}` : '';
      }}>
      <View style={styles.modeSwitch}>
        <TouchableOpacity testID="mode-hourly" style={[styles.modeButton, mode === 'hourlyToMonthly' && styles.modeButtonActive]} onPress={() => setMode('hourlyToMonthly')}>
          <Text style={[styles.modeButtonText, mode === 'hourlyToMonthly' && styles.modeButtonTextActive]}>시급 → 월급</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mode-annual" style={[styles.modeButton, mode === 'annualToMonthly' && styles.modeButtonActive]} onPress={() => setMode('annualToMonthly')}>
          <Text style={[styles.modeButtonText, mode === 'annualToMonthly' && styles.modeButtonTextActive]}>연봉 → 월급·시급</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mode-net-pay" style={[styles.modeButton, mode === 'netPay' && styles.modeButtonActive]} onPress={() => setMode('netPay')}>
          <Text style={[styles.modeButtonText, mode === 'netPay' && styles.modeButtonTextActive]}>실수령액</Text>
        </TouchableOpacity>
      </View>

      {mode === 'hourlyToMonthly' ? (
        <>
          <NumberInput testID="input-hourly-wage" label="시급" value={hourlyWage} onChangeValue={setHourlyWage} placeholder="0" />
          <NumberInput testID="input-daily-hours" label="1일 근무시간" value={dailyHours} onChangeValue={setDailyHours} placeholder="8" />
          <NumberInput testID="input-days-per-week" label="주 근무일수" value={daysPerWeek} onChangeValue={setDaysPerWeek} placeholder="5" />
          <TouchableOpacity testID="weekly-holiday-toggle" style={styles.toggleRow} onPress={() => setIncludeWeeklyHoliday((v) => !v)}>
            <View style={[styles.checkbox, includeWeeklyHoliday && styles.checkboxChecked]} />
            <Text style={styles.toggleLabel}>주휴수당 포함</Text>
          </TouchableOpacity>

          {hourlyResult ? (
            <View testID="hourly-result" style={styles.resultSection}>
              <ResultCard label="월 예상 급여" value={formatWon(hourlyResult.monthlyPay)} emphasis="success" />
              <ResultCard label="주급" value={formatWon(hourlyResult.weeklyPay)} />
              <ResultCard label="주휴수당" value={formatWon(hourlyResult.weeklyHolidayPay)} />
            </View>
          ) : null}
        </>
      ) : null}

      {mode === 'annualToMonthly' ? (
        <>
          <NumberInput testID="input-annual-salary" label="연봉" value={annualSalary} onChangeValue={setAnnualSalary} placeholder="0" />
          <NumberInput testID="input-monthly-work-hours" label="월 근무시간" value={monthlyWorkHours} onChangeValue={setMonthlyWorkHours} placeholder="209" />

          {annualResult ? (
            <View testID="annual-result" style={styles.resultSection}>
              <ResultCard label="월급 (세전)" value={formatWon(annualResult.monthlyPay)} emphasis="success" />
              <ResultCard label="환산 시급" value={formatWon(annualResult.hourlyWage)} />
            </View>
          ) : null}
        </>
      ) : null}

      {mode === 'netPay' ? (
        <>
          <Text style={styles.notice}>실제 세액은 부양가족 수 등에 따라 달라질 수 있는 참고용 계산이에요.</Text>
          <NumberInput testID="input-monthly-gross-pay" label="세전 월급" value={monthlyGrossPay} onChangeValue={setMonthlyGrossPay} placeholder="0" />

          {netPayResult ? (
            <View testID="net-pay-result" style={styles.resultSection}>
              <ResultCard label="실수령액 (근사)" value={formatWon(netPayResult.netPay)} emphasis="success" />
              <ResultCard label="4대보험 합계" value={formatWon(netPayResult.totalInsurance)} />
              <ResultCard label="세금 합계" value={formatWon(netPayResult.totalTax)} />
            </View>
          ) : null}
        </>
      ) : null}
    </CalculatorChrome>
  );
}

const styles = StyleSheet.create({
  notice: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 16 },
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: colors.lightBlueBackground,
    padding: 4,
  },
  modeButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primaryBlue },
  modeButtonText: { fontSize: 10.5, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.secondaryText, marginRight: 8 },
  checkboxChecked: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  toggleLabel: { fontSize: fontSizes.body, color: colors.darkText, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
});
