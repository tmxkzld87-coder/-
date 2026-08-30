import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// 앱인토스 콘솔에 등록된 실제 광고 지면(placement group) ID다 (miniAppId 70746).
export const BANNER_AD_GROUP_ID = 'ait.v2.live.36c16f82a784464d';
export const INTERSTITIAL_AD_GROUP_ID = 'ait.v2.live.b698abc47fe14e15';

/** 전면 광고를 미리 로드해둔다. 로드가 끝나면 onLoaded를 호출한다. 클린업 함수를 반환한다. */
export function preloadInterstitialAd(onLoaded: () => void): () => void {
  if (!loadFullScreenAd.isSupported()) return () => {};
  return loadFullScreenAd({
    options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
    onEvent: (event) => {
      if (event.type === 'loaded') onLoaded();
    },
    onError: () => {},
  });
}

interface ShowInterstitialHandlers {
  onDismissed?: () => void;
  onFailed?: () => void;
}

/** 미리 로드해둔 전면 광고를 표시한다. 미지원이거나 실패하면 onFailed를 호출한다. */
export function showInterstitialAd(handlers: ShowInterstitialHandlers): void {
  if (!showFullScreenAd.isSupported()) {
    handlers.onFailed?.();
    return;
  }
  showFullScreenAd({
    options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
    onEvent: (event) => {
      if (event.type === 'dismissed') handlers.onDismissed?.();
      if (event.type === 'failedToShow') handlers.onFailed?.();
    },
    onError: () => handlers.onFailed?.(),
  });
}

const INTERSTITIAL_INTERVAL = 3;
let calculationsSinceInterstitial = 0;

/**
 * 결과 화면에 도달할 때마다 호출한다. 연속으로 여러 번 계산했을 때만 전면 광고를 보여주기 위한
 * 카운터로, 계산 흐름 자체를 막지는 않는다. 세션 동안만 유지되며 앱을 다시 켜면 초기화된다.
 */
export function shouldShowInterstitial(): boolean {
  calculationsSinceInterstitial += 1;
  if (calculationsSinceInterstitial >= INTERSTITIAL_INTERVAL) {
    calculationsSinceInterstitial = 0;
    return true;
  }
  return false;
}
