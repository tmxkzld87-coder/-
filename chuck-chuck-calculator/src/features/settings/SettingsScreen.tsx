import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';
import { useFullScreenAd } from '../../ads/useFullScreenAd';
import { AD_GROUP_IDS } from '../../ads/adConfig';
import { getAdFreeUntil, grantAdFreeMinutes, AD_FREE_MINUTES } from '../../ads/adFreeSession';

export type SettingsScreenProps = {
  onBack: () => void;
};

function minutesRemaining(until: number): number {
  return Math.max(0, Math.ceil((until - Date.now()) / 60_000));
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [adFreeMinutesLeft, setAdFreeMinutesLeft] = useState(0);

  const refreshAdFreeStatus = useCallback(() => {
    getAdFreeUntil().then((until) => setAdFreeMinutesLeft(minutesRemaining(until)));
  }, []);

  useEffect(() => {
    refreshAdFreeStatus();
  }, [refreshAdFreeStatus]);

  const rewardedAd = useFullScreenAd({
    adGroupId: AD_GROUP_IDS.rewarded,
    onRewardEarned: () => {
      grantAdFreeMinutes(AD_FREE_MINUTES).then((until) => setAdFreeMinutesLeft(minutesRemaining(until)));
    },
  });

  const isAdFreeActiveNow = adFreeMinutesLeft > 0;

  const handleSubscribe = () => {
    Alert.alert('준비 중이에요', '구독 결제는 곧 만나보실 수 있어요.');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-button" onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.headerBack}>‹ 프리미엄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>구독</Text>
          <Text style={styles.description}>월 3,500원 구독하면 모든 계산기와 무제한 기록 저장을 이용할 수 있어요.</Text>
          <TouchableOpacity testID="subscribe-button" style={styles.button} onPress={handleSubscribe}>
            <Text style={styles.buttonText}>구독하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>광고 제거</Text>

          {isAdFreeActiveNow ? (
            <Text testID="ad-free-status" style={styles.statusText}>
              광고 없이 이용 중이에요 ({adFreeMinutesLeft}분 남음)
            </Text>
          ) : (
            <>
              <Text style={styles.description}>광고를 끝까지 보면 {AD_FREE_MINUTES}분 동안 배너·전면 광고 없이 이용할 수 있어요.</Text>
              <TouchableOpacity
                testID="watch-ad-for-ad-free"
                style={[styles.button, !rewardedAd.isLoaded && styles.buttonDisabled]}
                onPress={rewardedAd.show}
                disabled={!rewardedAd.isLoaded}
              >
                <Text style={styles.buttonText}>광고 보고 {AD_FREE_MINUTES}분 이용하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8 },
  headerBack: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 20, paddingTop: 12 },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.darkText, marginBottom: 8 },
  description: { fontSize: fontSizes.caption, color: colors.secondaryText, marginBottom: 12 },
  statusText: { fontSize: fontSizes.caption, color: colors.success, fontWeight: fontWeights.bold },
  button: { height: 48, borderRadius: 12, backgroundColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
