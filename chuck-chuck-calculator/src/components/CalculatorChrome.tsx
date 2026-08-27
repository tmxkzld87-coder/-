import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BannerAd } from '../ads/BannerAd';
import { useFullScreenAd } from '../ads/useFullScreenAd';
import { AD_GROUP_IDS } from '../ads/adConfig';
import { isAdFreeActive } from '../ads/adFreeSession';
import { shouldShowInterstitial } from '../ads/interstitialFrequency';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';
import { getHistory, saveHistoryEntry, MAX_FREE_ENTRIES, MAX_SUBSCRIBED_ENTRIES, type CalculatorHistoryEntry } from '../storage/history';
import { isSubscribed } from '../subscription/subscriptionStatus';
import type { CalculatorId } from '../data/calculators';

export type CalculatorChromeProps = {
  testIDPrefix: string;
  title: string;
  onBack?: () => void;
  calculatorType: CalculatorId;
  onReset: () => void;
  getSaveValidationError: () => string | null;
  getSaveSummary: () => string;
  titlePlaceholder?: string;
  children: React.ReactNode;
};

// Shared bottom chrome for every calculator screen (header, 새로운 계산/기록 저장
// actions, save + 최근 계산 sheets, fixed ad banner) so each SPEC_*.md's per-screen
// UI only has to implement its own inputs/results as `children`.
export function CalculatorChrome({
  testIDPrefix,
  title,
  onBack,
  calculatorType,
  onReset,
  getSaveValidationError,
  getSaveSummary,
  titlePlaceholder = '예: 이름 없는 계산',
  children,
}: CalculatorChromeProps) {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<CalculatorHistoryEntry[]>([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');

  const [isAdFree, setIsAdFree] = useState<boolean | null>(null);
  const shouldShowInterstitialRef = useRef<boolean | null>(null);
  const interstitialShownRef = useRef(false);
  const interstitialAd = useFullScreenAd({ adGroupId: AD_GROUP_IDS.interstitial });

  useEffect(() => {
    shouldShowInterstitialRef.current = shouldShowInterstitial();
    isAdFreeActive().then(setIsAdFree);
  }, []);

  useEffect(() => {
    if (interstitialShownRef.current || !shouldShowInterstitialRef.current || isAdFree !== false) {
      return;
    }
    if (interstitialAd.isLoaded) {
      interstitialShownRef.current = true;
      interstitialAd.show();
    }
  }, [isAdFree, interstitialAd.isLoaded]);

  const openHistory = async () => {
    const all = await getHistory();
    setHistoryEntries(all.filter((entry) => entry.calculatorType === calculatorType));
    setHistoryVisible(true);
  };

  const openSaveModal = () => {
    const error = getSaveValidationError();
    if (error) {
      Alert.alert(error);
      return;
    }
    setSaveTitle('');
    setSaveModalVisible(true);
  };

  const confirmSave = async () => {
    const subscribed = await isSubscribed();
    await saveHistoryEntry(
      {
        calculatorType,
        title: saveTitle.trim() || '이름 없는 계산',
        summary: getSaveSummary(),
      },
      subscribed ? MAX_SUBSCRIBED_ENTRIES : MAX_FREE_ENTRIES,
    );
    setSaveModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity testID={`${testIDPrefix}-back-button`} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.headerBack}>‹ {title}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`${testIDPrefix}-open-history`} onPress={openHistory}>
          <Text style={styles.headerHistoryLink}>최근 계산</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        {children}

        <View style={styles.actionRow}>
          <TouchableOpacity testID="reset-button" style={styles.ghostButton} onPress={onReset}>
            <Text style={styles.ghostButtonText}>새로운 계산</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="save-button" style={styles.solidButton} onPress={openSaveModal}>
            <Text style={styles.solidButtonText}>기록 저장</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isAdFree === false ? <BannerAd adGroupId={AD_GROUP_IDS.banner} /> : null}

      <Modal visible={saveModalVisible} transparent animationType="fade" onRequestClose={() => setSaveModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>기록 저장</Text>
            <TextInput
              testID="save-title-input"
              style={styles.modalInput}
              value={saveTitle}
              onChangeText={setSaveTitle}
              placeholder={titlePlaceholder}
              placeholderTextColor={colors.secondaryText}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity testID="save-cancel" style={styles.ghostButton} onPress={() => setSaveModalVisible(false)}>
                <Text style={styles.ghostButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="save-confirm" style={styles.solidButton} onPress={confirmSave}>
                <Text style={styles.solidButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={historyVisible} transparent animationType="fade" onRequestClose={() => setHistoryVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>최근 계산</Text>
            {historyEntries.length === 0 ? (
              <Text style={styles.emptyHint}>저장된 계산이 없어요.</Text>
            ) : (
              historyEntries.map((entry) => (
                <View key={entry.id} style={styles.historyItem}>
                  <Text style={styles.historyItemTitle}>{entry.title}</Text>
                  <Text style={styles.historyItemSummary}>{entry.summary}</Text>
                </View>
              ))
            )}
            <TouchableOpacity testID="history-close" style={[styles.ghostButton, styles.historyCloseButton]} onPress={() => setHistoryVisible(false)}>
              <Text style={styles.ghostButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerBack: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  headerHistoryLink: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.secondaryText },
  scroll: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 20, marginBottom: 4 },
  ghostButton: { flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  ghostButtonText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.darkText },
  solidButton: { flex: 1, height: 46, borderRadius: 12, backgroundColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center' },
  solidButtonText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.background },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,18,22,0.42)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 28 },
  modalTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 14 },
  modalInput: { height: 44, borderWidth: 1, borderColor: colors.divider, borderRadius: 10, paddingHorizontal: 12, fontSize: fontSizes.body, color: colors.darkText, marginBottom: 14 },
  emptyHint: { fontSize: 12.5, color: colors.secondaryText, marginBottom: 8 },
  historyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  historyItemTitle: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.darkText },
  historyItemSummary: { fontSize: 12, color: colors.secondaryText, marginTop: 2 },
  historyCloseButton: { marginTop: 8 },
});
