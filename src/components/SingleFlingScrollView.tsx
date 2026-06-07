import { requireNativeComponent, ViewProps } from 'react-native';

interface SingleFlingScrollViewProps extends ViewProps {
  cardWidth?: number;
  cardPaddingStart?: number;
}

export const SingleFlingScrollView =
  requireNativeComponent<SingleFlingScrollViewProps>('SingleFlingScrollView');
