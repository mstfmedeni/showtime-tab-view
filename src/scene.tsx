import { useCallback, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useSyncInitialPosition } from "./hooks/use-sync-initial-position";
import { useHeaderTabContext } from "./context";
import type { SceneProps } from "./types";

function mergeRefs<T>(
  ...inputRefs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
  const filteredInputRefs = inputRefs.filter(Boolean);

  if (filteredInputRefs.length <= 1) {
    const firstRef = filteredInputRefs[0];

    return firstRef || null;
  }

  return function mergedRefs(ref) {
    for (const inputRef of filteredInputRefs) {
      if (typeof inputRef === "function") {
        inputRef(ref);
      } else if (inputRef) {
        (inputRef as React.MutableRefObject<T | null>).current = ref;
      }
    }
  };
}

export function SceneComponent<P extends object>({
  index,
  onScroll: propOnScroll,
  onContentSizeChange,
  ContainerView,
  contentContainerStyle,
  scrollIndicatorInsets,
  forwardedRef,
  useExternalScrollView = false,
  ...restProps
}: SceneProps<P>) {
  //#region refs
  const nativeGestureRef = useRef(Gesture.Native());
  const scollViewRef = useAnimatedRef<Animated.ScrollView>();
  //#endregion

  //#region hooks
  const {
    shareAnimatedValue,
    expectHeight,
    curIndexValue,
    refHasChanged,
    updateSceneInfo,
    scrollViewPaddingTop,
  } = useHeaderTabContext();
  //#endregion

  //#region animations/style
  const scrollY = useSharedValue(0);
  const { opacityValue, initialPosition } =
    useSyncInitialPosition(scollViewRef);
  const sceneStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacityValue.value),
    };
  }, [opacityValue]);

  //#endregion

  //#region methods
  const onScrollAnimateEvent = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        const moveY = e.contentOffset.y;
        scrollY.value = moveY;
        if (curIndexValue.value !== index) return;
        shareAnimatedValue.value = moveY;
        if (propOnScroll) {
          runOnJS(propOnScroll as never)({ nativeEvent: e });
        }
      },
    },
    []
  );

  // adjust the scene size
  const _onContentSizeChange = useCallback(
    (contentWidth: number, contentHeight: number) => {
      onContentSizeChange?.(contentWidth, contentHeight);
      if (Math.ceil(contentHeight) >= expectHeight) {
        initialPosition(shareAnimatedValue.value);
      }
    },
    [onContentSizeChange, initialPosition, expectHeight, shareAnimatedValue]
  );
  //#endregion

  useEffect(() => {
    refHasChanged?.(nativeGestureRef.current);
  }, [refHasChanged]);
  useEffect(() => {
    if (scollViewRef?.current) {
      updateSceneInfo({
        scrollRef: scollViewRef,
        index,
        scrollY,
      });
    }
  }, [scollViewRef, index, scrollY, updateSceneInfo]);

  return (
    <Animated.View style={[styles.container, sceneStyle]}>
      <GestureDetector gesture={nativeGestureRef.current}>
        <ContainerView
          {...restProps}
          ref={mergeRefs(scollViewRef, forwardedRef)}
          scrollEventThrottle={16}
          directionalLockEnabled
          contentContainerStyle={[
            contentContainerStyle,
            {
              paddingTop: useExternalScrollView ? 0 : scrollViewPaddingTop,
              minHeight: expectHeight,
            },
          ]}
          onContentSizeChange={_onContentSizeChange}
          onScroll={onScrollAnimateEvent}
          scrollIndicatorInsets={{
            top: scrollViewPaddingTop,
            ...scrollIndicatorInsets,
          }}
          // bounces={false}
        />
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
