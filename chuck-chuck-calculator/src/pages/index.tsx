import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { HomeScreen } from '../features/home/HomeScreen';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  return (
    <HomeScreen
      onNavigateToCalculator={(route) => {
        // '/cost' isn't registered in router.gen.ts until Task 8 adds src/pages/cost.tsx —
        // see this plan's Global Constraints on the router.gen.ts regeneration gotcha.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation.navigate(route as any);
      }}
    />
  );
}
