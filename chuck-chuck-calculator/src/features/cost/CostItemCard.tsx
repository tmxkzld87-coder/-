import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { calculateItemCost, UNITS, type CostItem, type Unit } from './calc';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../../theme/typography';

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function nextUnit(current: Unit): Unit {
  const index = UNITS.indexOf(current);
  return UNITS[(index + 1) % UNITS.length]!;
}

function missingFieldHint(item: CostItem): string | null {
  if (item.purchasePrice <= 0) return '구매 가격을 입력해주세요.';
  if (item.purchaseQuantity <= 0) return '총 구매량을 입력해주세요.';
  if (item.usedQuantity <= 0) return '1회 사용량을 입력해주세요.';
  return null;
}

export type CostItemCardProps = {
  item: CostItem;
  namePlaceholder: string;
  onChange: (patch: Partial<CostItem>) => void;
  onRemove: () => void;
};

export function CostItemCard({ item, namePlaceholder, onChange, onRemove }: CostItemCardProps) {
  const cost = calculateItemCost(item);
  const hint = item.name || item.purchasePrice || item.purchaseQuantity || item.usedQuantity ? missingFieldHint(item) : null;

  return (
    <View testID={`cost-item-card-${item.id}`} style={styles.card}>
      <View style={styles.head}>
        <TextInput
          testID={`cost-item-name-${item.id}`}
          style={styles.nameInput}
          value={item.name}
          onChangeText={(text) => onChange({ name: text })}
          placeholder={namePlaceholder}
          placeholderTextColor={colors.secondaryText}
        />
        <TouchableOpacity testID={`cost-item-remove-${item.id}`} style={styles.removeButton} onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <QuantityField
        testIDPrefix={`cost-item-purchase-price-${item.id}`}
        label="구매 가격"
        value={item.purchasePrice}
        onChangeValue={(v) => onChange({ purchasePrice: v })}
        suffix="원"
      />
      <QuantityField
        testIDPrefix={`cost-item-purchase-qty-${item.id}`}
        label="총 구매량"
        value={item.purchaseQuantity}
        onChangeValue={(v) => onChange({ purchaseQuantity: v })}
        unit={item.purchaseUnit}
        onCycleUnit={() => onChange({ purchaseUnit: nextUnit(item.purchaseUnit) })}
      />
      <QuantityField
        testIDPrefix={`cost-item-used-qty-${item.id}`}
        label="1회 사용량"
        value={item.usedQuantity}
        onChangeValue={(v) => onChange({ usedQuantity: v })}
        unit={item.usedUnit}
        onCycleUnit={() => onChange({ usedUnit: nextUnit(item.usedUnit) })}
      />

      {hint ? (
        <Text testID={`cost-item-hint-${item.id}`} style={styles.hint}>
          {hint}
        </Text>
      ) : null}

      <View style={styles.costLine}>
        <Text style={styles.costLineLabel}>사용 원가</Text>
        <Text testID={`cost-item-cost-${item.id}`} style={[styles.costLineValue, tabularNums]}>
          {formatWon(cost)}
        </Text>
      </View>
    </View>
  );
}

function QuantityField({
  testIDPrefix,
  label,
  value,
  onChangeValue,
  suffix,
  unit,
  onCycleUnit,
}: {
  testIDPrefix: string;
  label: string;
  value: number;
  onChangeValue: (value: number) => void;
  suffix?: string;
  unit?: Unit;
  onCycleUnit?: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          testID={`${testIDPrefix}-input`}
          style={styles.fieldInput}
          value={value === 0 ? '' : String(value)}
          onChangeText={(text) => {
            const digits = text.replace(/[^0-9]/g, '');
            onChangeValue(digits === '' ? 0 : Number(digits));
          }}
          placeholder="0"
          placeholderTextColor={colors.secondaryText}
          keyboardType="number-pad"
        />
        {suffix ? <Text style={styles.fieldSuffix}>{suffix}</Text> : null}
        {unit ? (
          <TouchableOpacity testID={`${testIDPrefix}-unit`} style={styles.unitButton} onPress={onCycleUnit}>
            <Text style={styles.unitButtonText}>{unit}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 10, padding: 14, borderRadius: 14, backgroundColor: colors.divider },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nameInput: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: colors.background },
  removeButton: { paddingLeft: 8 },
  removeButtonText: { color: colors.secondaryText, fontSize: fontSizes.body },
  fieldWrap: { marginBottom: 8 },
  fieldLabel: { fontSize: 11, color: colors.secondaryText, marginBottom: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10 },
  fieldInput: { flex: 1, height: 40, fontSize: fontSizes.caption, color: colors.darkText },
  fieldSuffix: { fontSize: 11, color: colors.secondaryText },
  unitButton: { marginLeft: 6, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.lightBlueBackground },
  unitButtonText: { fontSize: 11, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  hint: { fontSize: 11, color: colors.error, marginBottom: 6 },
  costLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.background },
  costLineLabel: { fontSize: 11, color: colors.secondaryText },
  costLineValue: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primaryBlue },
});
