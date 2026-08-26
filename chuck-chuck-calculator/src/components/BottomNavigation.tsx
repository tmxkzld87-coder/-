import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type BottomTab = 'home' | 'history' | 'settings';

export type BottomNavigationProps = {
  activeTab: BottomTab;
  onTabPress: (tab: BottomTab) => void;
};

const TABS: { id: BottomTab; label: string }[] = [
  { id: 'home', label: '홈' },
  { id: 'history', label: '기록' },
  { id: 'settings', label: '설정' },
];

export function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          testID={`bottom-nav-${tab.id}`}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}>
          <Text style={[styles.label, tab.id === activeTab && styles.labelActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText },
  labelActive: { color: colors.primaryBlue, fontWeight: fontWeights.bold },
});
