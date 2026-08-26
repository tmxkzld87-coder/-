import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { ShippingFeeScreen } from '../features/shipping-fee/ShippingFeeScreen';

export const Route = createRoute('/shipping-fee', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <ShippingFeeScreen onBack={() => navigation.goBack()} />;
}
