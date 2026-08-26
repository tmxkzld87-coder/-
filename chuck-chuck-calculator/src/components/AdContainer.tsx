import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InlineAd } from '@apps-in-toss/framework';

// 콘솔에서 발급받은 배너 광고 그룹 ID. iaa_placement_group_list 조회 시 state가
// REGISTERING인 동안은 groupId가 null이라 테스트 ID를 써야 한다(실 ID로 테스트하면
// 정책 위반으로 간주될 수 있음) — 구글 반영 완료(약 2시간) 후 실제 groupId로 교체할 것.
const AD_GROUP_ID = 'ait-ad-test-banner-id';

// 항상 화면 하단에 고정, 스크롤 끝에는 노출하지 않는다(PLAN_척척계산기.md 5절).
// 새로운 계산/기록 저장 등 버튼 클릭에 새로고침을 연동하지 않는다 — SDK 자체 주기에만 맡긴다.
export function AdContainer() {
  return (
    <View testID="ad-container" style={styles.container}>
      <InlineAd
        adGroupId={AD_GROUP_ID}
        impressFallbackOnMount
        onNoFill={(payload) => console.warn('배너 광고 재고 없음', payload)}
        onAdFailedToRender={(payload) => console.warn('배너 광고 렌더 실패', payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 96, overflow: 'hidden' },
});
