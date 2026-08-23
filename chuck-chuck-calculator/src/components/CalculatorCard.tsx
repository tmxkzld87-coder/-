import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import type { CalculatorMeta } from '../data/calculators';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type CalculatorCardProps = {
  calculator: CalculatorMeta;
  onPress: () => void;
};

export function CalculatorCard({ calculator, onPress }: CalculatorCardProps) {
  return (
    <TouchableOpacity testID={`calculator-card-${calculator.id}`} style={styles.card} onPress={onPress}>
      <View style={styles.iconBadge}>
        <Text style={styles.iconText}>{calculator.icon}</Text>
      </View>
      <Text style={styles.name}>{calculator.name}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {calculator.description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: { fontSize: 18 },
  name: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 2 },
  description: { fontSize: fontSizes.caption, color: colors.secondaryText },
});
