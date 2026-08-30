import { appsInToss } from '@apps-in-toss/framework/plugins';
import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  scheme: 'intoss',
  appName: 'naengjang-teolgi',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      brand: {
        displayName: '냉장고 털기',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/77253/4d6ec939-5161-4187-9a0c-b8845d285eee.png',
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
