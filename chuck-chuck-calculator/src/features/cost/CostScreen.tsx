import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NumberInput } from '../../components/NumberInput';
import { ResultCard } from '../../components/ResultCard';
import { CalculatorChrome } from '../../components/CalculatorChrome';
import { CostItemCard } from './CostItemCard';
import {
  calculateCostSummary,
  calculateFeeBreakdown,
  calculateRecommendedPriceByTargetProfit,
  calculateTargetPriceByCostRate,
  calculateVatBreakdown,
  costRateStatus,
  type CostItem,
  type CostRateStatus,
} from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../../theme/typography';

function toNumber(value: string): number {
  return value === '' ? 0 : Number(value);
}

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

let itemIdSeed = 0;
function nextItemId(): string {
  itemIdSeed += 1;
  return `item-${Date.now()}-${itemIdSeed}`;
}

function emptyItem(defaults: Partial<CostItem> = {}): CostItem {
  return {
    id: nextItemId(),
    name: '',
    purchasePrice: 0,
    purchaseQuantity: 0,
    purchaseUnit: 'g',
    usedQuantity: 0,
    usedUnit: 'g',
    ...defaults,
  };
}

const ADDITIONAL_COST_SUGGESTIONS = ['포장비', '컵', '뚜껑', '빨대'];

const STATUS_LABEL: Record<CostRateStatus, string> = {
  none: '-',
  good: '좋아요',
  ok: '괜찮아요',
  warn: '원가를 확인해보세요',
  bad: '원가가 높은 편이에요',
};

const STATUS_COLOR: Record<CostRateStatus, string> = {
  none: colors.secondaryText,
  good: colors.success,
  ok: colors.primaryBlue,
  warn: colors.warning,
  bad: colors.error,
};

export type CostScreenProps = {
  onBack?: () => void;
};

export function CostScreen({ onBack }: CostScreenProps) {
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [vatIncluded, setVatIncluded] = useState(false);

  const [ingredients, setIngredients] = useState<CostItem[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<CostItem[]>([]);

  const [targetRateOpen, setTargetRateOpen] = useState(true);
  const [targetProfitOpen, setTargetProfitOpen] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);

  const [targetCostRate, setTargetCostRate] = useState('30');
  const [roundToTen, setRoundToTen] = useState(true);
  const [targetProfitPerUnit, setTargetProfitPerUnit] = useState('');
  const [platformFeePercent, setPlatformFeePercent] = useState('25');
  const [paymentFeePercent, setPaymentFeePercent] = useState('3');
  const [deliveryFee, setDeliveryFee] = useState('');

  const summary = useMemo(
    () =>
      calculateCostSummary({
        sellingPrice: toNumber(sellingPrice),
        quantity: toNumber(quantity) || 1,
        ingredients,
        additionalCosts,
      }),
    [sellingPrice, quantity, ingredients, additionalCosts],
  );

  const status = costRateStatus(summary.costRatePercent);
  const vatBreakdown = useMemo(
    () => (vatIncluded && toNumber(sellingPrice) > 0 ? calculateVatBreakdown(toNumber(sellingPrice)) : null),
    [vatIncluded, sellingPrice],
  );

  const targetPrice = useMemo(
    () => calculateTargetPriceByCostRate(summary.unitCost, toNumber(targetCostRate), roundToTen),
    [summary.unitCost, targetCostRate, roundToTen],
  );
  const recommendedPrice = useMemo(
    () => calculateRecommendedPriceByTargetProfit(summary.unitCost, toNumber(targetProfitPerUnit)),
    [summary.unitCost, targetProfitPerUnit],
  );
  const feeBreakdown = useMemo(
    () =>
      calculateFeeBreakdown({
        sellingPrice: toNumber(sellingPrice),
        unitCost: summary.unitCost,
        platformFeePercent: toNumber(platformFeePercent),
        paymentFeePercent: toNumber(paymentFeePercent),
        deliveryFee: toNumber(deliveryFee),
      }),
    [sellingPrice, summary.unitCost, platformFeePercent, paymentFeePercent, deliveryFee],
  );

  const updateItem = (list: 'ingredients' | 'additionalCosts', id: string, patch: Partial<CostItem>) => {
    const setter = list === 'ingredients' ? setIngredients : setAdditionalCosts;
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };
  const removeItem = (list: 'ingredients' | 'additionalCosts', id: string) => {
    const setter = list === 'ingredients' ? setIngredients : setAdditionalCosts;
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setSellingPrice('');
    setQuantity('1');
    setVatIncluded(false);
    setIngredients([]);
    setAdditionalCosts([]);
    setTargetCostRate('30');
    setRoundToTen(true);
    setTargetProfitPerUnit('');
    setPlatformFeePercent('25');
    setPaymentFeePercent('3');
    setDeliveryFee('');
  };

  return (
    <CalculatorChrome
      testIDPrefix="cost"
      title="원가 계산"
      onBack={onBack}
      calculatorType="cost"
      onReset={handleReset}
      titlePlaceholder="예: 아메리카노"
      getSaveValidationError={() => {
        if (toNumber(sellingPrice) <= 0) return '판매 가격을 입력해주세요.';
        if (ingredients.length === 0 && additionalCosts.length === 0) return '재료를 하나 이상 추가해주세요.';
        return null;
      }}
      getSaveSummary={() => `판매가 ${formatWon(toNumber(sellingPrice))} · 원가율 ${summary.costRatePercent}%`}>
      <Text style={styles.lede}>판매가와 원가를 간편하게 계산해보세요.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>판매 정보</Text>
        <NumberInput testID="input-selling-price" label="판매 가격" value={sellingPrice} onChangeValue={setSellingPrice} placeholder="0" />
        <NumberInput testID="input-quantity" label="판매 수량" value={quantity} onChangeValue={setQuantity} placeholder="1" />

        <TouchableOpacity testID="vat-toggle" style={styles.checkboxRow} onPress={() => setVatIncluded((v) => !v)}>
          <View style={[styles.checkbox, vatIncluded && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>부가세 포함 가격</Text>
        </TouchableOpacity>
        {vatBreakdown ? (
          <Text testID="vat-breakdown" style={styles.vatBreakdown}>
            공급가액 {formatWon(vatBreakdown.supplyAmount)} · 부가세 {formatWon(vatBreakdown.vatAmount)} (참고용 계산)
          </Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>재료비</Text>
        {ingredients.length === 0 ? (
          <Text style={styles.emptyHint}>아직 추가된 재료가 없어요.</Text>
        ) : (
          ingredients.map((item) => (
            <CostItemCard
              key={item.id}
              item={item}
              namePlaceholder="재료명"
              onChange={(patch) => updateItem('ingredients', item.id, patch)}
              onRemove={() => removeItem('ingredients', item.id)}
            />
          ))
        )}
        <TouchableOpacity
          testID="add-ingredient"
          style={styles.addButton}
          onPress={() => setIngredients((prev) => [...prev, emptyItem()])}>
          <Text style={styles.addButtonText}>+ 재료 추가</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기타 비용</Text>
        <Text style={styles.sectionDesc}>묶음으로 산 포장재도 총 가격·총 수량만 입력하면 개당 비용을 자동으로 계산해요.</Text>
        <View style={styles.suggestRow}>
          {ADDITIONAL_COST_SUGGESTIONS.map((name) => (
            <TouchableOpacity
              key={name}
              testID={`add-additional-suggestion-${name}`}
              style={styles.suggestChip}
              onPress={() => setAdditionalCosts((prev) => [...prev, emptyItem({ name, purchaseUnit: '개', usedUnit: '개', usedQuantity: 1 })])}>
              <Text style={styles.suggestChipText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {additionalCosts.map((item) => (
          <CostItemCard
            key={item.id}
            item={item}
            namePlaceholder="항목명"
            onChange={(patch) => updateItem('additionalCosts', item.id, patch)}
            onRemove={() => removeItem('additionalCosts', item.id)}
          />
        ))}
        <TouchableOpacity
          testID="add-additional-cost"
          style={styles.addButton}
          onPress={() => setAdditionalCosts((prev) => [...prev, emptyItem({ purchaseUnit: '개', usedUnit: '개', usedQuantity: 1 })])}>
          <Text style={styles.addButtonText}>+ 비용 추가</Text>
        </TouchableOpacity>
      </View>

      <View testID="cost-result" style={styles.resultCard}>
        <Text style={styles.resultTitle}>계산 결과</Text>
        <View style={styles.resultTopRow}>
          <View style={styles.resultHero}>
            <Text style={styles.resultHeroLabel}>1개당 원가</Text>
            <Text testID="unit-cost-value" style={[styles.resultHeroValue, tabularNums]}>{formatWon(summary.unitCost)}</Text>
          </View>
          <View style={[styles.resultHero, styles.resultHeroRight]}>
            <Text style={styles.resultHeroLabel}>원가율</Text>
            <Text testID="cost-rate-value" style={[styles.resultHeroValue, tabularNums]}>{summary.costRatePercent}%</Text>
            {status !== 'none' ? (
              <Text testID="cost-rate-status" style={[styles.statusPill, { color: STATUS_COLOR[status] }]}>
                {STATUS_LABEL[status]}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.refNote}>원가율 기준은 업종에 따라 달라질 수 있는 참고용 수치예요.</Text>

        <View style={styles.resultSubGrid}>
          <ResultCard testID="total-cost-result" style={styles.resultSubGridItem} label="총 원가" value={formatWon(summary.totalCost)} />
          <ResultCard testID="profit-result" style={styles.resultSubGridItem} label="예상 이익" value={formatWon(summary.profit)} emphasis={summary.profit >= 0 ? 'success' : 'error'} />
          <ResultCard testID="revenue-result" style={styles.resultSubGridItem} label="예상 매출" value={formatWon(summary.totalRevenue)} />
        </View>
      </View>

      <CollapsibleSection testID="target-rate-section" title="목표 원가율로 판매가 계산" open={targetRateOpen} onToggle={() => setTargetRateOpen((v) => !v)}>
        <NumberInput testID="input-target-cost-rate" label="목표 원가율" value={targetCostRate} onChangeValue={setTargetCostRate} placeholder="30" />
        <TouchableOpacity testID="round-to-ten-toggle" style={styles.checkboxRow} onPress={() => setRoundToTen((v) => !v)}>
          <View style={[styles.checkbox, roundToTen && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>10원 단위로 반올림</Text>
        </TouchableOpacity>
        <TargetResultRow label="목표 판매가" value={formatWon(targetPrice)} testID="target-price-result" />
      </CollapsibleSection>

      <CollapsibleSection testID="target-profit-section" title="1개당 목표 이익으로 판매가 계산" open={targetProfitOpen} onToggle={() => setTargetProfitOpen((v) => !v)}>
        <Text style={styles.sectionDesc}>한 개 팔 때마다 남기고 싶은 이익이에요. 하루 전체 목표 수익이 아니에요.</Text>
        <NumberInput testID="input-target-profit" label="1개당 목표 이익" value={targetProfitPerUnit} onChangeValue={setTargetProfitPerUnit} placeholder="0" />
        <TargetResultRow label="권장 판매가" value={formatWon(recommendedPrice)} testID="recommended-price-result" />
      </CollapsibleSection>

      <CollapsibleSection testID="fees-section" title="배달 / 플랫폼 수수료 추가" open={feesOpen} onToggle={() => setFeesOpen((v) => !v)}>
        <NumberInput testID="input-platform-fee" label="플랫폼 수수료" value={platformFeePercent} onChangeValue={setPlatformFeePercent} placeholder="25" />
        <NumberInput testID="input-payment-fee" label="결제 수수료" value={paymentFeePercent} onChangeValue={setPaymentFeePercent} placeholder="3" />
        <NumberInput testID="input-delivery-fee" label="배달비" value={deliveryFee} onChangeValue={setDeliveryFee} placeholder="0" />
        <View style={styles.feeResultGrid}>
          <ResultCard label="플랫폼 수수료" value={formatWon(feeBreakdown.platformFeeAmount)} />
          <ResultCard label="결제 수수료" value={formatWon(feeBreakdown.paymentFeeAmount)} />
        </View>
        <ResultCard testID="net-profit-result" label="실제 예상 수익" value={formatWon(feeBreakdown.netProfit)} emphasis={feeBreakdown.netProfit >= 0 ? 'success' : 'error'} />
      </CollapsibleSection>
    </CalculatorChrome>
  );
}

function CollapsibleSection({
  testID,
  title,
  open,
  onToggle,
  children,
}: {
  testID: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.advancedBlock}>
      <TouchableOpacity testID={`${testID}-toggle`} style={styles.advancedToggle} onPress={onToggle}>
        <Text style={styles.advancedToggleText}>{title}</Text>
        <Text style={styles.advancedToggleChevron}>{open ? '⌄' : '›'}</Text>
      </TouchableOpacity>
      {open ? (
        <View testID={`${testID}-body`} style={styles.advancedBody}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

function TargetResultRow({ label, value, testID }: { label: string; value: string; testID: string }) {
  return (
    <View testID={testID} style={styles.targetResultRow}>
      <Text style={styles.targetResultLabel}>{label}</Text>
      <Text style={[styles.targetResultValue, tabularNums]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { fontSize: fontSizes.caption, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 4 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginHorizontal: 20, marginBottom: 4 },
  sectionDesc: { fontSize: 12, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.secondaryText, marginRight: 8 },
  checkboxChecked: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  checkboxLabel: { fontSize: fontSizes.caption, color: colors.darkText, fontWeight: fontWeights.bold },
  vatBreakdown: { fontSize: 11, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 8 },
  emptyHint: { fontSize: 12.5, color: colors.secondaryText, marginHorizontal: 20, marginBottom: 8 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 20, marginBottom: 10 },
  suggestChip: { backgroundColor: colors.divider, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  suggestChipText: { fontSize: 12, color: colors.darkText, fontWeight: fontWeights.bold },
  addButton: {
    marginHorizontal: 20,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: colors.primaryBlue, fontSize: fontSizes.caption, fontWeight: fontWeights.bold },
  resultCard: { marginTop: 20, marginHorizontal: 20, backgroundColor: colors.lightBlueBackground, borderRadius: 18, padding: 18 },
  resultTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 12 },
  resultTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultHero: { flex: 1 },
  resultHeroRight: { alignItems: 'flex-end' },
  resultHeroLabel: { fontSize: 12, fontWeight: fontWeights.bold, color: colors.primaryBlue, marginBottom: 4 },
  resultHeroValue: { fontSize: 24, fontWeight: fontWeights.bold, color: colors.darkText },
  statusPill: { fontSize: 11, fontWeight: fontWeights.bold, marginTop: 6 },
  refNote: { fontSize: 10, color: colors.secondaryText, marginTop: 6 },
  resultSubGrid: { flexDirection: 'row', marginTop: 8 },
  resultSubGridItem: { flex: 1, paddingHorizontal: 4 },
  advancedBlock: { marginHorizontal: 20, marginTop: 12 },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  advancedToggleText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.darkText },
  advancedToggleChevron: { color: colors.secondaryText },
  advancedBody: { borderWidth: 1, borderTopWidth: 0, borderColor: colors.divider, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, padding: 16, paddingTop: 4 },
  targetResultRow: { marginTop: 8, backgroundColor: colors.divider, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetResultLabel: { fontSize: fontSizes.caption, color: colors.secondaryText, fontWeight: fontWeights.bold },
  targetResultValue: { fontSize: 18, fontWeight: fontWeights.bold, color: colors.primaryBlue },
  feeResultGrid: { flexDirection: 'row' },
});
