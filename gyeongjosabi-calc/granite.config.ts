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
        displayName: '경조사비 얼마낼까?',
        primaryColor: '#3182F6',
        icon: 'https://static.toss.im/appsintoss/77253/29fd6222-f04e-418c-b846-117a13e106ec.png',
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
