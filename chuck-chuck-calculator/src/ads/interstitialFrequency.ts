// 계산기 화면에 들어갈 때마다 호출 — N번째 진입마다 true를 반환해 전면 광고를
// 그때만 띄우게 한다. 모듈 스코프 카운터라 앱 프로세스가 살아있는 동안(여러
// 계산기를 오가도) 유지되고, 앱을 완전히 종료했다 다시 열면 0부터 다시 센다.
const N = 5;
let visitCount = 0;

export function shouldShowInterstitial(): boolean {
  visitCount += 1;
  return visitCount % N === 0;
}

// 테스트에서 카운터를 초기 상태로 되돌리기 위한 헬퍼.
export function __resetInterstitialCounterForTests(): void {
  visitCount = 0;
}
