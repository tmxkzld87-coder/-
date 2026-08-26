import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { SplitBillScreen } from '../features/split-bill/SplitBillScreen';

export const Route = createRoute('/split-bill', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <SplitBillScreen onBack={() => navigation.goBack()} />;
}
