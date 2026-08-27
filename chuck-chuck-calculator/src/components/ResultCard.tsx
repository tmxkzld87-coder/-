import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../theme/typography';

export type ResultCardProps = {
  label: string;
  value: string;
  emphasis?: 'default' | 'success' | 'error';
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

export function ResultCard({ label, value, emphasis = 'default', testID, style }: ResultCardProps) {
  return (
    <View testID={testID} style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          tabularNums,
          emphasis === 'success' && styles.successValue,
          emphasis === 'error' && styles.errorValue,
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 20 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 4 },
  value: { fontSize: fontSizes.resultLarge, fontWeight: fontWeights.bold, color: colors.darkText },
  successValue: { color: colors.success },
  errorValue: { color: colors.error },
});
