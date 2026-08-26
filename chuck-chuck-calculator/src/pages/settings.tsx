import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { SettingsScreen } from '../features/settings/SettingsScreen';

export const Route = createRoute('/settings', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <SettingsScreen onBack={() => navigation.goBack()} />;
}
