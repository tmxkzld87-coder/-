import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

export const INTERSTITIAL_AD_GROUP_ID = 'ait.v2.live.238719d8b37f4a42';

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

// 결과 화면의 '다른 메뉴 추천' · '아무거나 골라줘'는 사용자가 마음에 드는 메뉴가 나올
// 때까지 연달아 누르는 액션이라, 누를 때마다 전면 광고를 띄우면 거슬린다.
// N번째로 누를 때만 광고를 보여준다.
const RESULT_ACTION_AD_INTERVAL = 3;
let resultActionPressCount = 0;

/** 결과 화면 액션 버튼을 누른 횟수를 센다. N번째 호출마다 true를 반환한다. */
export function shouldShowResultActionAd(): boolean {
  resultActionPressCount += 1;
  return resultActionPressCount % RESULT_ACTION_AD_INTERVAL === 0;
}

/** 테스트에서 카운터를 초기 상태로 되돌리기 위한 헬퍼. */
export function __resetResultActionAdCounterForTests(): void {
  resultActionPressCount = 0;
}
