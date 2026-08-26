// adConfig.ts
//
// 앱인토스 콘솔에서 만든 광고 그룹의 adGroupId. 실제 발급 ID만 넣는다 —
// 토스 심사가 배포 번들에 테스트 ID 문자열이 남아 있는지(도달 가능 여부와
// 무관하게) 직접 검사하므로, __DEV__ 삼항식으로 테스트 ID를 죽은 코드로만
// 남겨두는 것도 반려 사유가 된다. 로컬에서 광고 클릭/노출을 직접 테스트해야
// 한다면, 이 파일을 임시로 테스트 ID로 바꿔 쓰고 커밋 전에 되돌릴 것.
//
// 콘솔에 등록된 그룹(2026-08-26 기준, 전부 state: ENABLED):
//   배너: 배너 광고 → ait.v2.live.ba0fd69ff1a1454c
//   전면형: 전면광고 → ait.v2.live.87b48f0186da4c73
//   보상형: 보상형 광고 (30분 보상) → ait.v2.live.112968c77c1e4436

export const AD_GROUP_IDS = {
  banner: 'ait.v2.live.ba0fd69ff1a1454c',
  interstitial: 'ait.v2.live.87b48f0186da4c73',
  rewarded: 'ait.v2.live.112968c77c1e4436',
} as const;
