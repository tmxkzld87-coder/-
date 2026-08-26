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
        icon: 'https://static.toss.im/appsintoss/77253/fcbd7514-aee6-44a9-abc8-309d138805e8.png', // 재구성 아이콘 (콘솔 miniAppId 67877) — 콘솔 쪽은 최초 검토(IN_REVIEW) 완료 후 반영 예정
      },
      permissions: [],
    }),
  ],
});
