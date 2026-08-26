import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

export type NumberInputProps = {
  label: string;
  value: string;
  onChangeValue: (digitsOnly: string) => void;
  placeholder?: string;
  testID?: string;
};

export function NumberInput({ label, value, onChangeValue, placeholder, testID }: NumberInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={(text) => onChangeValue(text.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        keyboardType="number-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, paddingHorizontal: 20 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 6 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: fontSizes.body,
    color: colors.darkText,
  },
});
