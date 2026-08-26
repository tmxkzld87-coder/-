import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

export type BottomTab = 'home' | 'history' | 'settings';

export type BottomNavigationProps = {
  activeTab: BottomTab;
  onTabPress: (tab: BottomTab) => void;
};

const TABS: { id: BottomTab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'history', label: '기록', icon: '🕘' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

// 토스 미니앱 브랜딩 가이드의 플로팅 탭바 형태: 화면 좌우·하단에서 띄운 알약형
// 바(border-radius, 그림자)로 구현한다 — 화면 가장자리에 붙는 일반 탭바는
// 토스 메인 화면의 기본 하단 탭과 헷갈릴 수 있어 허용되지 않는다.
export function BottomNavigation({ activeTab, onTabPress }: BottomNavigationProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity key={tab.id} testID={`bottom-nav-${tab.id}`} style={styles.tab} onPress={() => onTabPress(tab.id)}>
              <Text style={styles.icon}>{tab.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20, backgroundColor: colors.background },
  pill: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    ...Platform.select({
      ios: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18, marginBottom: 2 },
  label: { fontSize: fontSizes.caption, color: colors.secondaryText },
  labelActive: { color: colors.primaryBlue, fontWeight: fontWeights.bold },
});
