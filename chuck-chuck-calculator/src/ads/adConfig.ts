// adConfig.ts
//
// 앱인토스 콘솔에서 만든 광고 그룹의 adGroupId. 개발 중에는 반드시 테스트 ID를
// 사용하고, 실제 광고 ID로 직접 클릭/노출 테스트를 하면 정책 위반으로 이어질 수
// 있다. __DEV__는 React Native 전역 변수 — 인식되지 않는 빌드 환경이면
// process.env.NODE_ENV !== 'production' 등으로 바꿔서 써도 된다.
//
// 콘솔에 등록된 그룹(2026-08-26 기준, 전부 state: ENABLED 확인됨):
//   배너: 배너 광고 → ait.v2.live.ba0fd69ff1a1454c
//   전면형: 전면광고 → ait.v2.live.87b48f0186da4c73
//   보상형: 보상형 광고 (30분 보상) → ait.v2.live.112968c77c1e4436

export const AD_GROUP_IDS = {
  banner: __DEV__ ? 'ait-ad-test-banner-id' : 'ait.v2.live.ba0fd69ff1a1454c',
  interstitial: __DEV__ ? 'ait-ad-test-interstitial-id' : 'ait.v2.live.87b48f0186da4c73',
  rewarded: __DEV__ ? 'ait-ad-test-rewarded-id' : 'ait.v2.live.112968c77c1e4436',
} as const;
