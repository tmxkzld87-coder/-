import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = '어떤 계산을 할까요?' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        testID="search-bar-input"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: colors.lightBlueBackground,
    paddingHorizontal: 16,
  },
  input: { height: 44, fontSize: fontSizes.body, color: colors.darkText },
});
