import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { calculateCost, type CostCalcInput } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'marginToPrice' | 'priceToMargin';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function CostScreen() {
  const [mode, setMode] = useState<Mode>('marginToPrice');
  const [materialCost, setMaterialCost] = useState('');
  const [subMaterialCost, setSubMaterialCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [marginRatePercent, setMarginRatePercent] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');

  const { result, errorMessage } = useMemo(() => {
    if (materialCost === '') {
      return { result: null, errorMessage: null };
    }
    if (mode === 'marginToPrice' && marginRatePercent === '') {
      return { result: null, errorMessage: null };
    }
    if (mode === 'priceToMargin' && sellingPriceInput === '') {
      return { result: null, errorMessage: null };
    }

    const base = {
      materialCost: toNumber(materialCost),
      subMaterialCost: toNumber(subMaterialCost),
      laborCost: toNumber(laborCost),
      otherCost: toNumber(otherCost),
    };
    const input: CostCalcInput =
      mode === 'marginToPrice'
        ? { ...base, mode, marginRatePercent: toNumber(marginRatePercent) }
        : { ...base, mode, sellingPrice: toNumber(sellingPriceInput) };

    try {
      return { result: calculateCost(input), errorMessage: null };
    } catch {
      const message =
        mode === 'marginToPrice'
          ? '마진율은 100% 미만으로 입력해주세요.'
          : '판매가는 0보다 큰 값을 입력해주세요.';
      return { result: null, errorMessage: message };
    }
  }, [mode, materialCost, subMaterialCost, laborCost, otherCost, marginRatePercent, sellingPriceInput]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          testID="mode-margin-to-price"
          style={[styles.modeButton, mode === 'marginToPrice' && styles.modeButtonActive]}
          onPress={() => setMode('marginToPrice')}>
          <Text style={[styles.modeButtonText, mode === 'marginToPrice' && styles.modeButtonTextActive]}>
            마진율로 판매가 구하기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="mode-price-to-margin"
          style={[styles.modeButton, mode === 'priceToMargin' && styles.modeButtonActive]}
          onPress={() => setMode('priceToMargin')}>
          <Text style={[styles.modeButtonText, mode === 'priceToMargin' && styles.modeButtonTextActive]}>
            판매가로 마진율 구하기
          </Text>
        </TouchableOpacity>
      </View>

      <NumberInput testID="input-material-cost" label="재료비" value={materialCost} onChangeValue={setMaterialCost} placeholder="0" />
      <NumberInput testID="input-sub-material-cost" label="부자재비 (선택)" value={subMaterialCost} onChangeValue={setSubMaterialCost} placeholder="0" />
      <NumberInput testID="input-labor-cost" label="인건비 (선택)" value={laborCost} onChangeValue={setLaborCost} placeholder="0" />
      <NumberInput testID="input-other-cost" label="기타비용 (선택)" value={otherCost} onChangeValue={setOtherCost} placeholder="0" />

      {mode === 'marginToPrice' ? (
        <NumberInput
          testID="input-margin-rate"
          label="목표 마진율 (%)"
          value={marginRatePercent}
          onChangeValue={setMarginRatePercent}
          placeholder="0"
        />
      ) : (
        <NumberInput
          testID="input-selling-price"
          label="판매가"
          value={sellingPriceInput}
          onChangeValue={setSellingPriceInput}
          placeholder="0"
        />
      )}

      {errorMessage ? (
        <Text testID="cost-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {result ? (
        <View testID="cost-result" style={styles.resultSection}>
          <ResultCard label="원가율" value={`${result.costRatePercent}%`} />
          <ResultCard label="판매가" value={formatWon(result.sellingPrice)} />
          <ResultCard
            label="예상 이익"
            value={formatWon(result.expectedProfit)}
            emphasis={result.expectedProfit >= 0 ? 'success' : 'error'}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 20 },
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
  modeButtonText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  errorText: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.error },
});
