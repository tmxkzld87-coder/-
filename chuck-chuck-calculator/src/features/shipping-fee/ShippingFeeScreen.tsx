import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { Stepper } from '../../components/Stepper';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { calculateShippingFee } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`;
}

export type ShippingFeeScreenProps = { onBack?: () => void };

export function ShippingFeeScreen({ onBack }: ShippingFeeScreenProps) {
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [shippingFee, setShippingFee] = useState('');
  const [hasThreshold, setHasThreshold] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  const { result, errorMessage } = useMemo(() => {
    if (unitPrice === '' || shippingFee === '') {
      return { result: null, errorMessage: null };
    }
    try {
      const result = calculateShippingFee({
        unitPrice: toNumber(unitPrice),
        quantity,
        shippingFee: toNumber(shippingFee),
        freeShippingThreshold: hasThreshold ? toNumber(freeShippingThreshold) : undefined,
      });
      return { result, errorMessage: null };
    } catch {
      return { result: null, errorMessage: '상품 단가는 0보다 큰 값을 입력해주세요.' };
    }
  }, [unitPrice, quantity, shippingFee, hasThreshold, freeShippingThreshold]);

  const handleReset = () => {
    setUnitPrice('');
    setQuantity(1);
    setShippingFee('');
    setHasThreshold(false);
    setFreeShippingThreshold('');
  };

  return (
    <CalculatorChrome
      testIDPrefix="shipping-fee"
      title="배송비"
      onBack={onBack}
      calculatorType="shipping-fee"
      onReset={handleReset}
      titlePlaceholder="예: 주문 상품명"
      getSaveValidationError={() => (result ? null : '상품 단가와 배송비를 입력해주세요.')}
      getSaveSummary={() => (result ? `총 결제금액 ${formatWon(result.finalTotal)}` : '')}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상품 정보</Text>
        <NumberInput testID="input-unit-price" label="상품 단가" value={unitPrice} onChangeValue={setUnitPrice} placeholder="0" />
        <Stepper testID="quantity-stepper" label="수량" value={quantity} onChange={setQuantity} suffix="개" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>배송 정보</Text>
        <NumberInput testID="input-shipping-fee" label="배송비" value={shippingFee} onChangeValue={setShippingFee} placeholder="0" />

        <TouchableOpacity testID="threshold-toggle" style={styles.toggleRow} onPress={() => setHasThreshold((v) => !v)}>
          <View style={[styles.checkbox, hasThreshold && styles.checkboxChecked]} />
          <Text style={styles.toggleLabel}>무료배송 기준 있음</Text>
        </TouchableOpacity>

        {hasThreshold ? (
          <NumberInput
            testID="input-free-shipping-threshold"
            label="무료배송 기준금액"
            value={freeShippingThreshold}
            onChangeValue={setFreeShippingThreshold}
            placeholder="0"
          />
        ) : null}
      </View>

      {errorMessage ? (
        <Text testID="shipping-fee-error" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      {result ? (
        <View testID="shipping-fee-result" style={styles.resultSection}>
          <ResultCard label="총 결제 금액" value={formatWon(result.finalTotal)} emphasis="success" />
          <ResultCard label="상품 합계" value={formatWon(result.productTotal)} />
          <ResultCard label="배송비" value={formatWon(result.shippingCharged)} />
          {result.amountToFreeShipping !== null ? (
            <Text testID="free-shipping-banner" style={styles.banner}>
              {result.isFreeShipping
                ? '무료배송 조건을 채웠어요'
                : `무료배송까지 ${formatWon(result.amountToFreeShipping)} 남았어요`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </CalculatorChrome>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, marginBottom: 4 },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginHorizontal: 20, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.secondaryText, marginRight: 8 },
  checkboxChecked: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  toggleLabel: { fontSize: fontSizes.body, color: colors.darkText, fontWeight: fontWeights.bold },
  resultSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 12 },
  banner: { marginHorizontal: 20, marginTop: 4, fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  errorText: { marginHorizontal: 20, marginTop: 8, fontSize: fontSizes.caption, color: colors.error },
});
