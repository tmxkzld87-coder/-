import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { DiscountScreen } from '../features/discount/DiscountScreen';

export const Route = createRoute('/discount', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <DiscountScreen onBack={() => navigation.goBack()} />;
}
