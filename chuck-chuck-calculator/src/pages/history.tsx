import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { HistoryScreen } from '../features/history/HistoryScreen';

export const Route = createRoute('/history', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return (
    <HistoryScreen
      onBack={() => navigation.goBack()}
      onOpenCalculator={(route) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation.navigate(route as any);
      }}
    />
  );
}
