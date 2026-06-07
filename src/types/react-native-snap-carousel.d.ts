declare module 'react-native-snap-carousel' {
  import React from 'react';
  import { ScrollViewProps, StyleProp, ViewStyle } from 'react-native';

  interface CarouselProps<T> extends ScrollViewProps {
    data: T[];
    renderItem: (data: { item: T; index: number }) => React.ReactNode;
    sliderWidth: number;
    itemWidth: number;
    onSnapToItem?: (index: number) => void;
    containerCustomStyle?: StyleProp<ViewStyle>;
    contentContainerCustomStyle?: StyleProp<ViewStyle>;
    layout?: 'default' | 'stack' | 'tinder';
    activeSlideOffset?: number;
    apparitionDelay?: number;
    autoplay?: boolean;
    autoplayDelay?: number;
    autoplayInterval?: number;
    callbackOffsetMargin?: number;
    enableMomentum?: boolean;
    enableSnap?: boolean;
    firstItem?: number;
    hasParallaxImages?: boolean;
    inactiveSlideOpacity?: number;
    inactiveSlideScale?: number;
    inactiveSlideShift?: number;
    loop?: boolean;
    loopClonesPerSide?: number;
    scrollEnabled?: boolean;
    scrollEndDragDebounceValue?: number;
    shouldOptimizeUpdates?: boolean;
    slideStyle?: StyleProp<ViewStyle>;
    swipeThreshold?: number;
    useScrollView?: boolean;
  }

  export default class Carousel<T = any> extends React.Component<CarouselProps<T>> {
    snapToPrev(animated?: boolean): void;
    snapToNext(animated?: boolean): void;
    snapToItem(index: number, animated?: boolean, fireCallback?: boolean, initial?: boolean): void;
  }
}
