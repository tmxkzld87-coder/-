import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd } from '../../ads/BannerAd';
import { AD_GROUP_IDS } from '../../ads/adConfig';
import { isAdFreeActive } from '../../ads/adFreeSession';
import { isSubscribed } from '../../subscription/subscriptionStatus';
import { getHistory, deleteHistoryEntry, MAX_FREE_ENTRIES, type CalculatorHistoryEntry } from '../../storage/history';
import { findCalculator } from '../../data/calculators';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';

export type HistoryScreenProps = {
  onBack: () => void;
  onOpenCalculator: (route: string) => void;
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function HistoryScreen({ onBack, onOpenCalculator }: HistoryScreenProps) {
  const [entries, setEntries] = useState<CalculatorHistoryEntry[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [isAdFree, setIsAdFree] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    getHistory().then(setEntries);
    isSubscribed().then(setIsPro);
  }, []);

  useEffect(() => {
    refresh();
    isAdFreeActive().then(setIsAdFree);
  }, [refresh]);

  const handleDelete = (id: string) => {
    deleteHistoryEntry(id).then(setEntries);
  };

  const handleUpgrade = () => {
    Alert.alert('준비 중이에요', '구독 결제는 곧 만나보실 수 있어요.');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity testID="history-back-button" onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.headerBack}>‹ 기록</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {!isPro ? (
          <TouchableOpacity testID="upgrade-banner" style={styles.upgradeBanner} onPress={handleUpgrade}>
            <Text style={styles.upgradeText}>무료로 최근 {MAX_FREE_ENTRIES}개까지 저장돼요. 구독하면 무제한으로 저장할 수 있어요.</Text>
            <Text style={styles.upgradeLink}>구독하기 ›</Text>
          </TouchableOpacity>
        ) : null}

        {entries.length === 0 ? (
          <Text style={styles.emptyText}>아직 저장한 계산이 없어요.</Text>
        ) : (
          entries.map((entry) => {
            const calculator = findCalculator(entry.calculatorType);
            return (
              <View key={entry.id} style={styles.row}>
                <TouchableOpacity testID={`history-entry-${entry.id}`} style={styles.rowMain} onPress={() => onOpenCalculator(calculator.route)}>
                  <View style={styles.iconBadge}>
                    <Text style={styles.iconText}>{calculator.icon}</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.calculatorName}>{calculator.name}</Text>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    <Text style={styles.entrySummary}>{entry.summary}</Text>
                    <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity testID={`history-delete-${entry.id}`} style={styles.deleteButton} onPress={() => handleDelete(entry.id)}>
                  <Text style={styles.deleteText}>삭제</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {isAdFree === false ? <BannerAd adGroupId={AD_GROUP_IDS.banner} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8 },
  headerBack: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  scroll: { flex: 1 },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.lightBlueBackground,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
  },
  upgradeText: { flex: 1, fontSize: fontSizes.caption, color: colors.darkText, marginRight: 8 },
  upgradeLink: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primaryBlue },
  emptyText: { textAlign: 'center', color: colors.secondaryText, fontSize: fontSizes.body, marginTop: 60 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightBlueBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: { fontSize: 18 },
  textContainer: { flex: 1 },
  calculatorName: { fontSize: fontSizes.caption, color: colors.secondaryText },
  entryTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginTop: 2 },
  entrySummary: { fontSize: fontSizes.caption, color: colors.secondaryText, marginTop: 2 },
  entryDate: { fontSize: 11, color: colors.secondaryText, marginTop: 4 },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { fontSize: fontSizes.caption, color: colors.error },
});
