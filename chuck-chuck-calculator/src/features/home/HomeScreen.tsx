import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { CalculatorCard } from '../../components/CalculatorCard';
import { CalculatorListItem } from '../../components/CalculatorListItem';
import { BottomNavigation, type BottomTab } from '../../components/BottomNavigation';
import { BannerAd } from '../../ads/BannerAd';
import { AD_GROUP_IDS } from '../../ads/adConfig';
import { isAdFreeActive } from '../../ads/adFreeSession';
import { searchCalculators, findCalculator, FREQUENTLY_USED_IDS } from '../../data/calculators';
import { getRecentUsage, recordUsage, type UsageEntry } from '../../storage/usage';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export type HomeScreenProps = {
  onNavigateToCalculator: (route: string) => void;
  onOpenSettings: () => void;
};

export function HomeScreen({ onNavigateToCalculator, onOpenSettings }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentUsage, setRecentUsage] = useState<UsageEntry[]>([]);
  const [isAdFree, setIsAdFree] = useState<boolean | null>(null);

  useEffect(() => {
    getRecentUsage().then(setRecentUsage);
    isAdFreeActive().then(setIsAdFree);
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const filteredCalculators = useMemo(() => searchCalculators(searchQuery), [searchQuery]);
  const frequentlyUsed = useMemo(() => FREQUENTLY_USED_IDS.map(findCalculator), []);

  const handlePressCalculator = async (calculatorId: string) => {
    const calculator = findCalculator(calculatorId as Parameters<typeof findCalculator>[0]);
    if (!calculator.implemented) {
      Alert.alert('준비 중이에요', `${calculator.name} 계산기는 곧 만나보실 수 있어요.`);
      return;
    }
    const updated = await recordUsage(calculator.id);
    setRecentUsage(updated);
    onNavigateToCalculator(calculator.route);
  };

  const handleTabPress = (tab: BottomTab) => {
    if (tab === 'home') {
      return;
    }
    if (tab === 'settings') {
      onOpenSettings();
      return;
    }
    Alert.alert('준비 중이에요', '해당 탭은 곧 만나보실 수 있어요.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Header title="척척 계산기" subtitle="필요한 계산, 한 번에" />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {!isSearching && recentUsage.length > 0 ? (
          <ScrollView horizontal style={styles.recentRow} showsHorizontalScrollIndicator={false}>
            {recentUsage.map((entry) => {
              const calculator = findCalculator(entry.calculatorId as Parameters<typeof findCalculator>[0]);
              return (
                <TouchableOpacity
                  key={entry.calculatorId}
                  testID={`recent-usage-chip-${entry.calculatorId}`}
                  style={styles.chip}
                  onPress={() => handlePressCalculator(entry.calculatorId)}>
                  <Text style={styles.chipText}>{calculator.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {!isSearching ? (
          <View style={styles.frequentGrid}>
            {frequentlyUsed.map((calculator) => (
              <CalculatorCard
                key={calculator.id}
                calculator={calculator}
                onPress={() => handlePressCalculator(calculator.id)}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.fullListSection}>
          {filteredCalculators.map((calculator) => (
            <CalculatorListItem
              key={calculator.id}
              calculator={calculator}
              onPress={() => handlePressCalculator(calculator.id)}
            />
          ))}
        </View>
      </ScrollView>
      {isAdFree === false ? <BannerAd adGroupId={AD_GROUP_IDS.banner} /> : null}
      <BottomNavigation activeTab="home" onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  recentRow: { paddingLeft: 20, marginBottom: 16 },
  chip: {
    backgroundColor: colors.lightBlueBackground,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: { fontSize: fontSizes.caption, color: colors.primaryBlue, fontWeight: fontWeights.bold },
  frequentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  fullListSection: { marginTop: 8 },
});
