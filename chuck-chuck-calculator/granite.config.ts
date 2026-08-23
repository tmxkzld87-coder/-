import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'chuck-chuck-calculator',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '척척 계산기',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/77253/002ba768-3022-49ff-aebf-0afcacb9a3e1.png', // 임시 플레이스홀더 아이콘 (콘솔 miniAppId 67877) — 실제 로고로 교체 필요
      },
      permissions: [],
    }),
  ],
});
