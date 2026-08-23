import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { CalculatorMeta } from '../data/calculators';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type CalculatorListItemProps = {
  calculator: CalculatorMeta;
  onPress: () => void;
};

export function CalculatorListItem({ calculator, onPress }: CalculatorListItemProps) {
  return (
    <TouchableOpacity
      testID={`calculator-list-item-${calculator.id}`}
      style={styles.row}
      onPress={onPress}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{calculator.icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{calculator.name}</Text>
        <Text style={styles.description}>{calculator.description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 18 },
  textContainer: { flex: 1 },
  name: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  description: { fontSize: fontSizes.caption, color: colors.secondaryText, marginTop: 2 },
  arrow: { fontSize: fontSizes.title, color: colors.secondaryText },
});
