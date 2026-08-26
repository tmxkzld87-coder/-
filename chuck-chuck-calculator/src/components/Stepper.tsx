import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights, tabularNums } from '../theme/typography';

export type StepperProps = {
  testID: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  suffix?: string;
};

export function Stepper({ testID, label, value, onChange, min = 1, suffix }: StepperProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity testID={`${testID}-decrement`} style={styles.button} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={styles.buttonText}>-</Text>
        </TouchableOpacity>
        <Text testID={`${testID}-value`} style={[styles.value, tabularNums]}>
          {value}
          {suffix ? suffix : ''}
        </Text>
        <TouchableOpacity testID={`${testID}-increment`} style={styles.button} onPress={() => onChange(value + 1)}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 16 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  button: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lightBlueBackground, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: fontSizes.body, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  value: { width: 48, textAlign: 'center', fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
});
