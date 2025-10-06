import React, { useEffect, useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { useHeaderTabContext } from "../context";

// Dynamic import for FlashList to handle optional dependency
let FlashList: any;

try {
  const flashListModule = require("@shopify/flash-list");
  FlashList = flashListModule.FlashList;
} catch (e) {
  // FlashList is optional, will be undefined if not installed
}

const AnimatePageView = FlashList
  ? Platform.OS === "web"
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)
  : null;

export type TabFlashListProps<T> = {
  index: number;
  data: readonly T[] | null | undefined;
  renderItem: any;
  estimatedItemSize?: number;
  [key: string]: any;
};

function FlashListComponent<T>(props: TabFlashListProps<T>, ref: any) {
  if (!AnimatePageView) {
    throw new Error(
      "TabFlashList requires @shopify/flash-list to be installed. Please run: yarn add @shopify/flash-list"
    );
  }

  const { index, onScroll, contentContainerStyle, ...restProps } = props;

  const flashListRef = useAnimatedRef<any>();
  const { shareAnimatedValue, updateSceneInfo, scrollViewPaddingTop } =
    useHeaderTabContext();

  const scrollY = useSharedValue(0);

  const onScrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;
        shareAnimatedValue.value = event.contentOffset.y;
        if (onScroll) {
          runOnJS(onScroll as any)({ nativeEvent: event });
        }
      },
    },
    [onScroll]
  );

  useEffect(() => {
    if (flashListRef?.current) {
      updateSceneInfo({
        scrollRef: flashListRef,
        index,
        scrollY,
      });
    }
  }, [flashListRef, index, scrollY, updateSceneInfo]);

  const mergedRefs = (instance: any) => {
    if (flashListRef) {
      (flashListRef as any).current = instance;
    }
    if (ref) {
      if (typeof ref === "function") {
        ref(instance);
      } else {
        ref.current = instance;
      }
    }
  };

  const mergedContentContainerStyle = useMemo(
    () => [
      contentContainerStyle,
      {
        paddingTop: scrollViewPaddingTop,
      },
    ],
    [contentContainerStyle, scrollViewPaddingTop]
  );

  return (
    <AnimatePageView
      {...(restProps as any)}
      ref={mergedRefs}
      onScroll={onScrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={mergedContentContainerStyle}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export const TabFlashList = React.forwardRef(FlashListComponent) as <T>(
  props: TabFlashListProps<T> & {
    ref?: React.Ref<any>;
  }
) => React.ReactElement;
