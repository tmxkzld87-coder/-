import React, { useMemo, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { Stepper } from '../../components/Stepper';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateTravelExpense, type TravelExpenseCategories } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

const CATEGORY_LABELS: { key: keyof TravelExpenseCategories; label: string }[] = [
  { key: 'lodging', label: '숙박' },
  { key: 'transport', label: '교통' },
  { key: 'food', label: '식비' },
  { key: 'activity', label: '관광/액티비티' },
  { key: 'etc', label: '기타' },
];

export type TravelExpenseScreenProps = { onBack?: () => void };

export function TravelExpenseScreen({ onBack }: TravelExpenseScreenProps) {
  const [headcount, setHeadcount] = useState(2);
  const [days, setDays] = useState('');
  const [categoryInputs, setCategoryInputs] = useState<Record<keyof TravelExpenseCategories, string>>({
    lodging: '',
    transport: '',
    food: '',
    activity: '',
    etc: '',
  });

  const updateCategory = (key: keyof TravelExpenseCategories, value: string) => {
    setCategoryInputs((prev) => ({ ...prev, [key]: value }));
  };

  const result = useMemo(
    () =>
      calculateTravelExpense({
        headcount,
        days: days === '' ? undefined : toNumber(days),
        categories: {
          lodging: toNumber(categoryInputs.lodging),
          transport: toNumber(categoryInputs.transport),
          food: toNumber(categoryInputs.food),
          activity: toNumber(categoryInputs.activity),
          etc: toNumber(categoryInputs.etc),
        },
      }),
    [headcount, days, categoryInputs],
  );

  const hasAnyCost = result.totalCost > 0;

  const handleReset = () => {
    setHeadcount(2);
    setDays('');
    setCategoryInputs({ lodging: '', transport: '', food: '', activity: '', etc: '' });
  };

  return (
    <CalculatorChrome
      testIDPrefix="travel-expense"
      title="여행 경비"
      onBack={onBack}
      calculatorType="travel-expense"
      onReset={handleReset}
      titlePlaceholder="예: 제주도 여행"
      getSaveValidationError={() => (hasAnyCost ? null : '경비를 하나 이상 입력해주세요.')}
      getSaveSummary={() => `총 경비 ${formatWon(result.totalCost)} · 인당 ${formatWon(result.perPerson)}`}>
      <Text style={styles.lede}>여행 경비를 한눈에 정리해보세요.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>여행 정보</Text>
        <Stepper testID="headcount-stepper" label="인원 수" value={headcount} onChange={setHeadcount} suffix="명" />
        <NumberInput testID="input-days" label="여행 일수 (선택)" value={days} onChangeValue={setDays} placeholder="비워두면 1일 평균 생략" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>항목별 비용</Text>
        {CATEGORY_LABELS.map(({ key, label }) => (
          <NumberInput
            key={key}
            testID={`input-category-${key}`}
            label={label}
            value={categoryInputs[key]}
            onChangeValue={(v) => updateCategory(key, v)}
            placeholder="0"
          />
        ))}
      </View>

      {!hasAnyCost ? (
        <Text style={styles.emptyHint}>비용을 입력해보세요.</Text>
      ) : (
        <View testID="travel-expense-result" style={styles.resultSection}>
          <ResultCard label="총 경비" value={formatWon(result.totalCost)} emphasis="success" />
          <ResultCard label="인당 경비" value={formatWon(result.perPerson)} />
          {result.perDay !== null ? <ResultCard label="1일 평균" value={formatWon(result.perDay)} /> : null}

          <View style={styles.shareList}>
            {CATEGORY_LABELS.filter(({ key }) => result.shares[key] > 0).map(({ key, label }) => (
              <View key={key} style={styles.shareRow}>
                <Text style={styles.shareLabel}>{label}</Text>
                <View style={styles.shareBarTrack}>
                  <View style={[styles.shareBarFill, { width: `${result.shares[key]}%` }]} />
                </View>
                <Text style={styles.sharePercent}>{result.shares[key]}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text testID="split-bill-hint" style={styles.splitBillHint}>인원별로 얼마씩 정산할지는 N빵 계산기에서 확인하세요.</Text>
    </CalculatorChrome>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 12 },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginHorizontal: 20, marginBottom: 8 },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  emptyHint: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.secondaryText },
  shareList: { marginTop: 8, paddingHorizontal: 20 },
  shareRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  shareLabel: { width: 92, fontSize: fontSizes.caption, color: colors.darkText },
  shareBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.divider, marginHorizontal: 8, overflow: 'hidden' },
  shareBarFill: { height: 8, borderRadius: 4, backgroundColor: colors.primaryBlue },
  sharePercent: { width: 40, fontSize: fontSizes.caption, color: colors.secondaryText, textAlign: 'right' },
  splitBillHint: { marginHorizontal: 20, marginTop: 16, fontSize: 12, color: colors.secondaryText, backgroundColor: colors.divider, padding: 12, borderRadius: 10 },
});
