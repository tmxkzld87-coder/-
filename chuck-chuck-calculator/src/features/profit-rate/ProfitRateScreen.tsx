import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateProfitRate } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Basis = 'roi' | 'margin';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export type ProfitRateScreenProps = { onBack?: () => void };

export function ProfitRateScreen({ onBack }: ProfitRateScreenProps) {
  const [basis, setBasis] = useState<Basis>('roi');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const { result, errorMessage } = useMemo(() => {
    if (costPrice === '' || sellPrice === '') {
      return { result: null, errorMessage: null };
    }
    try {
      return { result: calculateProfitRate({ costPrice: toNumber(costPrice), sellPrice: toNumber(sellPrice) }), errorMessage: null };
    } catch {
      return { result: null, errorMessage: '매입가와 판매가는 0보다 큰 값을 입력해주세요.' };
    }
  }, [costPrice, sellPrice]);

  const handleReset = () => {
    setBasis('roi');
    setCostPrice('');
    setSellPrice('');
  };

  return (
    <CalculatorChrome
      testIDPrefix="profit-rate"
      title="수익률"
      onBack={onBack}
      calculatorType="profit-rate"
      onReset={handleReset}
      titlePlaceholder="예: 상품명"
      getSaveValidationError={() => (result ? null : '매입가와 판매가를 입력해주세요.')}
      getSaveSummary={() => (result ? `수익금 ${formatWon(result.profit)} · ROI ${result.roi}% · 마진율 ${result.marginRate}%` : '')}>
      <Text style={styles.notice}>
        원가부터 판매가를 설계하려면 원가 계산기를, 이미 정한 매입가·판매가를 빠르게 비교하려면 여기를 이용하세요.
      </Text>

      <NumberInput testID="input-cost-price" label="매입가" value={costPrice} onChangeValue={setCostPrice} placeholder="0" />
      <NumberInput testID="input-sell-price" label="판매가" value={sellPrice} onChangeValue={setSellPrice} placeholder="0" />

      <View style={styles.chipRow}>
        <TouchableOpacity testID="basis-roi" style={[styles.chip, basis === 'roi' && styles.chipActive]} onPress={() => setBasis('roi')}>
          <Text style={[styles.chipText, basis === 'roi' && styles.chipTextActive]}>원가 대비 (ROI)</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="basis-margin" style={[styles.chip, basis === 'margin' && styles.chipActive]} onPress={() => setBasis('margin')}>
          <Text style={[styles.chipText, basis === 'margin' && styles.chipTextActive]}>매출 대비 (마진율)</Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <Text testID="profit-rate-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {result ? (
        <View testID="profit-rate-result" style={styles.resultSection}>
          <ResultCard
            testID="profit-rate-hero"
            label={basis === 'roi' ? '원가 대비 수익률' : '매출 대비 마진율'}
            value={`${basis === 'roi' ? result.roi : result.marginRate}%`}
            emphasis={(basis === 'roi' ? result.roi : result.marginRate) >= 0 ? 'success' : 'error'}
          />
          <ResultCard label="수익금" value={formatWon(result.profit)} emphasis={result.profit >= 0 ? 'default' : 'error'} />
          <ResultCard label={basis === 'roi' ? '매출 대비 마진율' : '원가 대비 수익률'} value={`${basis === 'roi' ? result.marginRate : result.roi}%`} />
        </View>
      ) : null}
    </CalculatorChrome>
  );
}

const styles = StyleSheet.create({
  notice: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 16 },
  chipRow: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 4, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: colors.divider },
  chipActive: { backgroundColor: colors.primaryBlue },
  chipText: { fontSize: fontSizes.caption, color: colors.darkText, fontWeight: fontWeights.bold },
  chipTextActive: { color: colors.background },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  errorText: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.error },
});
