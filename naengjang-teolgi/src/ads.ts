import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

export const INTERSTITIAL_AD_GROUP_ID = 'ait.v2.live.238719d8b37f4a42';
export const RESULT_BANNER_AD_GROUP_ID = 'ait.v2.live.a2462babec214468';
export const SELECT_BANNER_AD_GROUP_ID = 'ait.v2.live.a2462babec214468';

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
