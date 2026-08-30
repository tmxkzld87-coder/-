import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';
import { colors, radius, spacing } from '../theme';

interface AdBannerProps {
  adGroupId: string;
}

/** 광고가 로드되지 않아도(onNoFill/onAdFailedToRender) InlineAd는 스스로 아무것도 렌더링하지 않으므로
 * 핵심 기능 흐름에는 영향을 주지 않는다. */
export function AdBanner({ adGroupId }: AdBannerProps) {
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
