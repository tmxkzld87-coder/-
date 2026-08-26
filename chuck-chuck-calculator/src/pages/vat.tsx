import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { VatScreen } from '../features/vat/VatScreen';

export const Route = createRoute('/vat', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <VatScreen onBack={() => navigation.goBack()} />;
}
