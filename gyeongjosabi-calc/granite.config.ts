import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'gyeongjosabi-calc',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '경조사비 계산기',
        primaryColor: '#3182F6',
        // TODO: 실제 배포 전, 콘솔에서 발급받은 아이콘 이미지 URL로 교체해야 한다.
        icon: 'https://static.toss.im/appsintoss/icon-placeholder.png',
      },
      appType: 'general',
      navigationBar: {
        withBackButton: true,
        withTitle: true,
        theme: 'light',
      },
      permissions: [],
    }),
  ],
});
