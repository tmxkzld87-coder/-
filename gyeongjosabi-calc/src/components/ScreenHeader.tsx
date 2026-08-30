import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로가기">
            <Text style={styles.backArrow}>{'‹'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  side: {
    width: 32,
  },
  backArrow: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
