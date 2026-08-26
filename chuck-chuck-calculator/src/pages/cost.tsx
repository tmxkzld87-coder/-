import { createRoute } from '@granite-js/react-native';
import { CostScreen } from '../features/cost/CostScreen';

export const Route = createRoute('/cost', {
  component: CostScreen,
});
