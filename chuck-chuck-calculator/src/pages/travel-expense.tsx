import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { TravelExpenseScreen } from '../features/travel-expense/TravelExpenseScreen';

export const Route = createRoute('/travel-expense', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <TravelExpenseScreen onBack={() => navigation.goBack()} />;
}
