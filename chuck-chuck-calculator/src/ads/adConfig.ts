// adConfig.ts
//
// 앱인토스 콘솔에서 만든 광고 그룹의 adGroupId. 개발 중에는 반드시 테스트 ID를
// 사용하고, 실제 광고 ID로 직접 클릭/노출 테스트를 하면 정책 위반으로 이어질 수
// 있다. __DEV__는 React Native 전역 변수 — 인식되지 않는 빌드 환경이면
// process.env.NODE_ENV !== 'production' 등으로 바꿔서 써도 된다.
//
// 콘솔에 등록된 그룹(2026-08-26 기준, 구글 반영 대기 중 — 최대 약 2시간):
//   배너: 배너 광고
//   전면형: 전면광고
//   보상형: 보상형 광고 (30분 보상)

export const AD_GROUP_IDS = {
  banner: __DEV__ ? 'ait-ad-test-banner-id' : 'REPLACE_WITH_REAL_BANNER_AD_GROUP_ID',

  interstitial: __DEV__ ? 'ait-ad-test-interstitial-id' : 'REPLACE_WITH_REAL_INTERSTITIAL_AD_GROUP_ID',

  // 생성 직후 응답은 곧바로 ENABLED로 왔지만 iaa_placement_group_list 재조회에서는
  // 다른 그룹들과 같이 REGISTERING(구글 반영 대기)으로 나왔다 — 반영 전에는 이
  // ID를 넣어도 광고가 나오지 않을 수 있으니, 배포 전 iaa_placement_group_list로
  // state가 ENABLED인지 한 번 더 확인할 것.
  rewarded: __DEV__ ? 'ait-ad-test-rewarded-id' : 'ait.v2.live.112968c77c1e4436',
} as const;
