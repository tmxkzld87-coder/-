import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { SalaryScreen } from '../features/salary/SalaryScreen';

export const Route = createRoute('/salary', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return <SalaryScreen onBack={() => navigation.goBack()} />;
}
