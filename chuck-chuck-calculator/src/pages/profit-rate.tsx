import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { ProfitRateScreen } from '../features/profit-rate/ProfitRateScreen';

export const Route = createRoute('/profit-rate', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <ProfitRateScreen onBack={() => navigation.goBack()} />;
}
