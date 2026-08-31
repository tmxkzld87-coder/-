import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';
import { isMinVersionSupported } from '@apps-in-toss/native-modules';
import { colors, radius, spacing } from '../theme';

interface AdBannerProps {
  adGroupId: string;
}

// InlineAd는 토스 앱 5.241.0 미만에서는 빈 화면/오류를 유발할 수 있어 반드시 버전 가드가 필요하다.
// https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/rn-banner
const isInlineAdSupported = isMinVersionSupported({ android: '5.241.0', ios: '5.241.0' });

export function AdBanner({ adGroupId }: AdBannerProps) {
  if (!isInlineAdSupported) return null;

  return (
    <View style={styles.container}>
      <InlineAd adGroupId={adGroupId} theme="light" variant="card" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
});
