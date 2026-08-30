import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchInput({ value, onChangeText }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="재료 검색 (예: 계란)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  input: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: colors.text,
  },
});
