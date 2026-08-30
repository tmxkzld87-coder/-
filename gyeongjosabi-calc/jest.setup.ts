import { setup } from '@granite-js/react-native/jest';

setup({ rootDir: __filename });

// @apps-in-toss/framework를 실제로 불러오면 네이티브 브릿지 초기화 코드가 jest 환경에서
// 바로 에러를 낸다. 화면 컴포넌트 테스트에서 필요해질 수 있는 최소한의 API만 메모리 기반으로
// 흉내 낸다. 다른 named export가 필요해지면 여기에 추가한다.
jest.mock('@apps-in-toss/framework', () => ({
  Storage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
    clearItems: async () => {},
  },
  loadFullScreenAd: Object.assign(() => () => {}, { isSupported: () => false }),
  showFullScreenAd: Object.assign(() => () => {}, { isSupported: () => false }),
  InlineAd: () => null,
  AppsInToss: {
    registerApp: (Component: unknown) => Component,
  },
}));
