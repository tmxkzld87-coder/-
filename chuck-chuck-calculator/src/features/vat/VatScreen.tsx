import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateVat } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

type Mode = 'fromSupply' | 'fromTotal';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export type VatScreenProps = { onBack?: () => void };

export function VatScreen({ onBack }: VatScreenProps) {
  const [mode, setMode] = useState<Mode>('fromSupply');
  const [supplyAmount, setSupplyAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const { result, errorMessage } = useMemo(() => {
    const raw = mode === 'fromSupply' ? supplyAmount : totalAmount;
    if (raw === '') {
      return { result: null, errorMessage: null };
    }
    try {
      const result =
        mode === 'fromSupply'
          ? calculateVat({ mode, supplyAmount: toNumber(supplyAmount) })
          : calculateVat({ mode, totalAmount: toNumber(totalAmount) });
      return { result, errorMessage: null };
    } catch {
      const label = mode === 'fromSupply' ? '공급가액' : '합계금액';
      return { result: null, errorMessage: `${label}은 0보다 큰 값을 입력해주세요.` };
    }
  }, [mode, supplyAmount, totalAmount]);

  const handleReset = () => {
    setMode('fromSupply');
    setSupplyAmount('');
    setTotalAmount('');
  };

  return (
    <CalculatorChrome
      testIDPrefix="vat"
      title="부가세"
      onBack={onBack}
      calculatorType="vat"
      onReset={handleReset}
      titlePlaceholder="예: 세금계산서용"
      getSaveValidationError={() => (result ? null : '값을 입력해주세요.')}
      getSaveSummary={() => (result ? `공급가액 ${formatWon(result.supplyAmount)} · 부가세 ${formatWon(result.vatAmount)} · 합계 ${formatWon(result.totalAmount)}` : '')}>
      <Text style={styles.notice}>일반과세 10% 기준의 참고용 계산이에요.</Text>

      <View style={styles.modeSwitch}>
        <TouchableOpacity
          testID="mode-from-supply"
          style={[styles.modeButton, mode === 'fromSupply' && styles.modeButtonActive]}
          onPress={() => setMode('fromSupply')}>
          <Text style={[styles.modeButtonText, mode === 'fromSupply' && styles.modeButtonTextActive]}>
            공급가액으로 계산
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="mode-from-total"
          style={[styles.modeButton, mode === 'fromTotal' && styles.modeButtonActive]}
          onPress={() => setMode('fromTotal')}>
          <Text style={[styles.modeButtonText, mode === 'fromTotal' && styles.modeButtonTextActive]}>
            합계금액으로 계산
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'fromSupply' ? (
        <NumberInput testID="input-supply-amount" label="공급가액" value={supplyAmount} onChangeValue={setSupplyAmount} placeholder="0" />
      ) : (
        <NumberInput testID="input-total-amount" label="합계금액 (부가세 포함)" value={totalAmount} onChangeValue={setTotalAmount} placeholder="0" />
      )}

      {errorMessage ? (
        <Text testID="vat-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {result ? (
        <View testID="vat-result" style={styles.resultSection}>
          <ResultCard label="공급가액" value={formatWon(result.supplyAmount)} />
          <ResultCard label="부가세" value={formatWon(result.vatAmount)} />
          <ResultCard label="합계금액" value={formatWon(result.totalAmount)} emphasis="success" />
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
  modeButtonText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  modeButtonTextActive: { color: colors.background },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  errorText: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.error },
});
