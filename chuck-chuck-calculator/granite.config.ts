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
        icon: '', // 앱인토스 콘솔에 앱 등록 후 아이콘 URL로 교체 (이 플랜 범위 밖)
      },
      permissions: [],
    }),
  ],
});
