// BannerAd.tsx
//
// 화면 하단에 고정으로 두는 배너 광고. IOScrollView 밖에서 쓰이므로
// impressFallbackOnMount를 항상 켜서 노출(impression)이 정상 집계되게 한다.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';

interface BannerAdProps {
  adGroupId: string;
}

export function BannerAd({ adGroupId }: BannerAdProps) {
  return (
    <View testID="banner-ad" style={styles.container}>
      <InlineAd
        adGroupId={adGroupId}
        theme="auto"
        tone="blackAndWhite"
        variant="expanded"
        impressFallbackOnMount
        onNoFill={() => console.warn('[Ads] 배너 광고 없음(No Fill)')}
        onAdFailedToRender={(payload) => console.warn('[Ads] 배너 렌더 실패', payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 96, overflow: 'hidden' },
});
