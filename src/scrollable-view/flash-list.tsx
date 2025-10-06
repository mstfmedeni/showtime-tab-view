import React, { useEffect, useMemo } from "react";
import type { FlashListProps } from "@shopify/flash-list";
import { FlashList as ShopifyFlashList } from "@shopify/flash-list";
import { Platform, StyleSheet } from "react-native";

import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { useHeaderTabContext } from "../context";

const AnimatePageView =
  Platform.OS === "web"
    ? ShopifyFlashList
    : Animated.createAnimatedComponent(ShopifyFlashList);

export type TabFlashListProps<T> = FlashListProps<T> & {
  index: number;
};

function FlashListComponent<T>(props: TabFlashListProps<T>, ref: any) {
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
