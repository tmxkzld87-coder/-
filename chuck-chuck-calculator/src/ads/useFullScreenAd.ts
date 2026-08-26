// useFullScreenAd.ts
//
// 앱인토스(React Native, @apps-in-toss/framework) 전면형/보상형 광고를
// 공통으로 다루는 훅. 전면형과 보상형은 같은 API(loadFullScreenAd /
// showFullScreenAd)를 쓰고, adGroupId에 따라 콘솔에서 설정한 타입으로
// 자동 결정된다.
//
// 사용 규칙(정책 위반 방지):
// - load → loaded 이벤트 수신 → show 순서를 반드시 지킬 것
// - 보상은 'userEarnedReward' 이벤트가 떨어졌을 때만 지급할 것
//   ('dismissed'만 보고 보상을 주면 안 됨)
// - 광고가 닫히면(dismissed) 다음 노출을 위해 즉시 재로드할 것

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

interface UseFullScreenAdOptions {
  /** 앱인토스 콘솔에서 발급받은 광고 그룹 ID */
  adGroupId: string;
  /** 보상형 광고일 때만 사용: 실제 보상을 지급할 때 호출된다. */
  onRewardEarned?: (unitType: string, unitAmount: number) => void;
  /** 광고가 닫힌 뒤(성공/실패 무관) 호출된다. */
  onClosed?: () => void;
}

export function useFullScreenAd({ adGroupId, onRewardEarned, onClosed }: UseFullScreenAdOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    unregisterRef.current?.();

    const unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          setIsLoaded(true);
        }
      },
      onError: (error) => {
        console.warn(`[Ads] ${adGroupId} 로드 실패`, error);
        setIsLoaded(false);
      },
    });

    unregisterRef.current = unregister;
  }, [adGroupId]);

  useEffect(() => {
    load();
    return () => unregisterRef.current?.();
  }, [adGroupId]);

  const show = useCallback(() => {
    if (!isLoaded) {
      console.warn(`[Ads] ${adGroupId} 아직 로드되지 않아 노출을 건너뜁니다.`);
      return;
    }

    showFullScreenAd({
      options: { adGroupId },
      onEvent: (event) => {
        switch (event.type) {
          case 'userEarnedReward':
            onRewardEarned?.(event.data.unitType, event.data.unitAmount);
            break;
          case 'dismissed':
            setIsLoaded(false);
            onClosed?.();
            load();
            break;
          case 'failedToShow':
            setIsLoaded(false);
            load();
            break;
          default:
            break;
        }
      },
      onError: (error) => {
        console.warn(`[Ads] ${adGroupId} 노출 실패`, error);
        setIsLoaded(false);
        load();
      },
    });
  }, [adGroupId, isLoaded, load, onRewardEarned, onClosed]);

  return { isLoaded, show };
}
