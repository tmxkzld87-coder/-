import { setup } from '@granite-js/react-native/jest';

setup({ rootDir: __filename });

// @apps-in-toss/framework를 실제로 불러오면 네이티브 브릿지 초기화 코드가 jest 환경에서
// 바로 에러를 낸다("MiniAppModule_onSendEvent is not available"). 테스트에서 쓰는 Storage만
// 메모리 기반으로 흉내 낸 간단한 목으로 대체한다. 다른 named export가 필요해지면 여기에 추가한다.
jest.mock('@apps-in-toss/framework', () => {
  const store = new Map<string, string>();
  return {
    Storage: {
      getItem: async (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clearItems: async () => {
        store.clear();
      },
    },
  };
});
