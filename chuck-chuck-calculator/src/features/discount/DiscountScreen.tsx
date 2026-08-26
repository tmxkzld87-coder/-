import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateDiscount } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'rate' | 'price' | 'stacked';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

let stackedIdSeed = 0;
function nextStackedId(): string {
  stackedIdSeed += 1;
  return `stacked-${stackedIdSeed}`;
}

export type DiscountScreenProps = { onBack?: () => void };

export function DiscountScreen({ onBack }: DiscountScreenProps) {
  const [mode, setMode] = useState<Mode>('rate');
  const [regularPrice, setRegularPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [stackedRates, setStackedRates] = useState<{ id: string; value: string }[]>([{ id: nextStackedId(), value: '' }]);

  const { result, errorMessage } = useMemo(() => {
    if (regularPrice === '') {
      return { result: null, errorMessage: null };
    }
    const regularPriceNum = toNumber(regularPrice);

    try {
      if (mode === 'rate') {
        if (discountedPrice === '') return { result: null, errorMessage: null };
        return { result: calculateDiscount({ mode, regularPrice: regularPriceNum, discountedPrice: toNumber(discountedPrice) }), errorMessage: null };
      }
      if (mode === 'price') {
        if (discountRate === '') return { result: null, errorMessage: null };
        return { result: calculateDiscount({ mode, regularPrice: regularPriceNum, discountRate: toNumber(discountRate) }), errorMessage: null };
      }
      const rates = stackedRates.map((r) => r.value).filter((v) => v !== '').map(toNumber);
      if (rates.length === 0) return { result: null, errorMessage: null };
      return { result: calculateDiscount({ mode, regularPrice: regularPriceNum, discountRates: rates }), errorMessage: null };
    } catch {
      if (mode === 'rate') return { result: null, errorMessage: '할인가는 정가보다 낮아야 해요.' };
      if (mode === 'price') return { result: null, errorMessage: '할인율은 100%를 넘을 수 없어요.' };
      return { result: null, errorMessage: '할인율은 0~100 사이로 입력해주세요.' };
    }
  }, [mode, regularPrice, discountedPrice, discountRate, stackedRates]);

  const handleReset = () => {
    setMode('rate');
    setRegularPrice('');
    setDiscountedPrice('');
    setDiscountRate('');
    setStackedRates([{ id: nextStackedId(), value: '' }]);
  };

  const summaryLabel = mode === 'rate' ? '할인율' : mode === 'price' ? '할인가' : '최종가';

  return (
    <CalculatorChrome
      testIDPrefix="discount"
      title="할인 계산"
      onBack={onBack}
      calculatorType="discount"
      onReset={handleReset}
      titlePlaceholder="예: 세일 상품명"
      getSaveValidationError={() => (result ? null : '정가와 할인 정보를 입력해주세요.')}
      getSaveSummary={() => (result ? `${summaryLabel} ${mode === 'rate' ? `${result.effectiveRate}%` : formatWon(result.finalPrice)} · 절약액 ${formatWon(result.savings)}` : '')}>
      <Text style={styles.notice}>정가와 할인 정보로 최종 가격을 계산해보세요.</Text>

      <View style={styles.modeSwitch}>
        <TouchableOpacity testID="mode-rate" style={[styles.modeButton, mode === 'rate' && styles.modeButtonActive]} onPress={() => setMode('rate')}>
          <Text style={[styles.modeButtonText, mode === 'rate' && styles.modeButtonTextActive]}>할인율 계산</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mode-price" style={[styles.modeButton, mode === 'price' && styles.modeButtonActive]} onPress={() => setMode('price')}>
          <Text style={[styles.modeButtonText, mode === 'price' && styles.modeButtonTextActive]}>할인가 계산</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="mode-stacked" style={[styles.modeButton, mode === 'stacked' && styles.modeButtonActive]} onPress={() => setMode('stacked')}>
          <Text style={[styles.modeButtonText, mode === 'stacked' && styles.modeButtonTextActive]}>중복 할인</Text>
        </TouchableOpacity>
      </View>

      <NumberInput testID="input-regular-price" label="정가" value={regularPrice} onChangeValue={setRegularPrice} placeholder="0" />

      {mode === 'rate' ? (
        <NumberInput testID="input-discounted-price" label="할인가" value={discountedPrice} onChangeValue={setDiscountedPrice} placeholder="0" />
      ) : null}
      {mode === 'price' ? (
        <NumberInput testID="input-discount-rate" label="할인율 (%)" value={discountRate} onChangeValue={setDiscountRate} placeholder="0" />
      ) : null}
      {mode === 'stacked' ? (
        <View style={styles.stackedList}>
          {stackedRates.map((row, index) => (
            <View key={row.id} style={styles.stackedRow}>
              <View style={styles.stackedInputWrap}>
                <NumberInput
                  testID={`input-stacked-rate-${index}`}
                  label={`할인 ${index + 1}차 (%)`}
                  value={row.value}
                  onChangeValue={(v) => setStackedRates((prev) => prev.map((r) => (r.id === row.id ? { ...r, value: v } : r)))}
                  placeholder="0"
                />
              </View>
              {stackedRates.length > 1 ? (
                <TouchableOpacity
                  testID={`remove-stacked-rate-${index}`}
                  style={styles.removeButton}
                  onPress={() => setStackedRates((prev) => prev.filter((r) => r.id !== row.id))}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          <TouchableOpacity
            testID="add-stacked-rate"
            style={styles.addButton}
            onPress={() => setStackedRates((prev) => [...prev, { id: nextStackedId(), value: '' }])}>
            <Text style={styles.addButtonText}>+ 할인 추가</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {errorMessage ? (
        <Text testID="discount-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {result ? (
        <View testID="discount-result" style={styles.resultSection}>
          {mode === 'rate' ? (
            <>
              <ResultCard label="할인율" value={`${result.effectiveRate}%`} emphasis="success" />
              <ResultCard label="절약액" value={formatWon(result.savings)} />
            </>
          ) : (
            <>
              <ResultCard label={mode === 'stacked' ? '최종가' : '할인가'} value={formatWon(result.finalPrice)} emphasis="success" />
              <ResultCard label="절약액" value={formatWon(result.savings)} />
              {mode === 'stacked' ? <ResultCard label="실질 할인율" value={`${result.effectiveRate}%`} /> : null}
            </>
          )}
        </View>
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
  modeButtonText: { fontSize: 11, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  stackedList: { marginBottom: 4 },
  stackedRow: { flexDirection: 'row', alignItems: 'flex-end' },
  stackedInputWrap: { flex: 1 },
  removeButton: { marginBottom: 30, marginLeft: -8, marginRight: 20, padding: 8 },
  removeButtonText: { color: colors.secondaryText, fontSize: fontSizes.body },
  addButton: { marginHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  addButtonText: { color: colors.primaryBlue, fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  errorText: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.error },
});
