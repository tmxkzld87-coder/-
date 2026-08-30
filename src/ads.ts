import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// 개발 중에는 반드시 테스트 광고 ID를 써야 한다 — 실제 ID로 테스트하면 광고 정책 위반으로
// 간주될 수 있다. 실제 출시 전, 콘솔에서 발급받은 광고 그룹 ID로 교체해야 한다.
export const INTERSTITIAL_AD_GROUP_ID = 'ait-ad-test-interstitial-id';
export const RESULT_BANNER_AD_GROUP_ID = 'ait-ad-test-banner-id';
export const SELECT_BANNER_AD_GROUP_ID = 'ait-ad-test-banner-id';

type FullScreenAdEvent =
  | { type: 'requested' }
  | { type: 'show' }
  | { type: 'impression' }
  | { type: 'clicked' }
  | { type: 'dismissed' }
  | { type: 'failedToShow' }
  | { type: 'userEarnedReward'; data: { unitType: string; unitAmount: number } };

/** 광고를 미리 로드해둔다. 로드가 끝나면 onLoaded를 호출한다. 클린업 함수를 반환한다. */
export function preloadAd(adGroupId: string, onLoaded: () => void): () => void {
  if (!loadFullScreenAd.isSupported()) return () => {};
  return loadFullScreenAd({
    options: { adGroupId },
    onEvent: (event) => {
      if (event.type === 'loaded') onLoaded();
    },
    onError: () => {},
  });
}

interface ShowAdHandlers {
  onDismissed?: () => void;
  onFailed?: () => void;
}

/** 미리 로드해둔 전면 광고를 표시한다. 실패하거나 미지원 환경이면 onFailed를 호출한다. */
export function showAd(adGroupId: string, handlers: ShowAdHandlers): void {
  if (!showFullScreenAd.isSupported()) {
    handlers.onFailed?.();
    return;
  }
  showFullScreenAd({
    options: { adGroupId },
    onEvent: (event: FullScreenAdEvent) => {
      if (event.type === 'dismissed') handlers.onDismissed?.();
      if (event.type === 'failedToShow') handlers.onFailed?.();
    },
    onError: () => handlers.onFailed?.(),
  });
}
