import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  Dimensions,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  type NativeGesture,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { SceneRendererProps } from "react-native-tab-view";

import { useRefreshDerivedValue } from "./hooks/use-refresh-value";
import { useSceneInfo } from "./hooks/use-scene-info";
import { HeaderTabContext } from "./context";
import RefreshControlContainer from "./refresh-control";
import type { GestureContainerProps, Route } from "./types";
import { _ScrollTo, animateToRefresh, isIOS } from "./utils";

const { width } = Dimensions.get("window");

export type GestureContainerRef = {
  setCurrentIndex: (index: number) => void;
} | null;

export const GestureContainer = React.forwardRef<
  GestureContainerRef,
  GestureContainerProps<Route>
>(function GestureContainer(
  {
    refreshHeight = 65,
    pullExtendedCoefficient = 0.1,
    overflowPull = 50,
    overflowHeight = 0,
    scrollEnabled = true,
    minHeaderHeight = 0,
    isRefreshing: isRefreshingProp = false,
    initialPage,
    onStartRefresh,
    initTabbarHeight = 49,
    initHeaderHeight = 0,
    renderScrollHeader,
    overridenShareAnimatedValue,
    overridenTranslateYValue,
    renderTabView,
    renderRefreshControl: renderRefreshControlProp,
    animationHeaderPosition,
    animationHeaderHeight,
    panHeaderMaxOffset,
    onPullEnough,
    refreshControlColor,
    refreshControlTop = 0,
    emptyBodyComponent,
    navigationState,
    renderSceneHeader: renderSceneHeaderProp,
    enableGestureRunOnJS = false,
  },
  forwardedRef
) {
  //#region animation value
  const defaultShareAnimatedValue = useSharedValue(0);
  const shareAnimatedValue =
    overridenShareAnimatedValue || defaultShareAnimatedValue;
  const defaultTranslateYValue = useSharedValue(0);
  const translateYValue = overridenTranslateYValue || defaultTranslateYValue;
  const curIndexValue = useSharedValue(initialPage);
  const isSlidingHeader = useSharedValue(false);
  const slideIndex = useSharedValue(curIndexValue.value);
  const headerTrans = useSharedValue(0);
  const opacityValue = useSharedValue(initHeaderHeight === 0 ? 0 : 1);
  /* pull-refresh */
  const isDragging = useSharedValue(false);
  const tabsTrans = useSharedValue(0);
  const tabsRefreshTrans = useSharedValue(refreshHeight);
  const isRefreshing = useSharedValue(false);
  const isStartRefreshing = useSharedValue(false);
  const isRefreshingWithAnimation = useSharedValue(false);
  const basyY = useSharedValue(0);
  const startY = useSharedValue(0);
  const isPullEnough = useSharedValue(false);
  const headerTransStartY = useSharedValue(0);
  const dragIndex = useSharedValue(curIndexValue.value);
  //#endregion

  //#region hooks
  const { childScrollRef, childScrollYTrans, sceneIsReady, updateSceneInfo } =
    useSceneInfo(curIndexValue);
  //#endregion

  //#region state
  const [tabbarHeight, setTabbarHeight] = useState(initTabbarHeight);
  const [tabviewHeight, setTabviewHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(
    initHeaderHeight - overflowHeight
  );
  const [scrollStickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const [childGestures, setChildRefs] = useState<NativeGesture[]>([]);
  //#endregion

  const calcHeight = useMemo(
    () => headerHeight - minHeaderHeight,
    [headerHeight, minHeaderHeight]
  );

  //#region methods
  const animateTabsToRefresh = useCallback(
    (isToRefresh: boolean) => {
      "worklet";

      if (isToRefresh) {
        animateToRefresh({
          transRefreshing: tabsRefreshTrans,
          isRefreshing: isRefreshing,
          isRefreshingWithAnimation: isRefreshingWithAnimation,
          destPoi: 0,
          isToRefresh,
          onStartRefresh,
        });
      } else {
        const destPoi =
          tabsRefreshTrans.value > refreshHeight
            ? tabsRefreshTrans.value + refreshHeight
            : refreshHeight;
        animateToRefresh({
          transRefreshing: tabsRefreshTrans,
          isRefreshing: isRefreshing,
          isRefreshingWithAnimation: isRefreshingWithAnimation,
          destPoi,
          isToRefresh,
        });
      }
    },
    [
      tabsRefreshTrans,
      isRefreshing,
      isRefreshingWithAnimation,
      onStartRefresh,
      refreshHeight,
    ]
  );

  const stopScrollView = useCallback(() => {
    "worklet";
    if (!sceneIsReady.value[curIndexValue.value]) return;
    const scrollY = childScrollYTrans[curIndexValue.value]?.value;
    if (scrollY === undefined) return;
    _ScrollTo(
      childScrollRef[curIndexValue.value] as never,
      0,
      scrollY + 0.1,
      false
    );
  }, [curIndexValue, childScrollRef, childScrollYTrans, sceneIsReady]);

  const onTabsStartRefresh = useCallback(() => {
    "worklet";
    animateTabsToRefresh(true);
  }, [animateTabsToRefresh]);

  const onTabsEndRefresh = useCallback(() => {
    "worklet";
    animateTabsToRefresh(false);
  }, [animateTabsToRefresh]);

  const stopAllAnimation = useCallback(() => {
    "worklet";

    if (!sceneIsReady.value[curIndexValue.value]) return;

    cancelAnimation(headerTrans);
    slideIndex.value = -1;
    dragIndex.value = -1;

    const handleSceneSync = (index: number) => {
      const scrollY = childScrollYTrans[index]?.value;
      if (scrollY === undefined) return;

      const syncPosition = Math.min(shareAnimatedValue.value, calcHeight);

      if (scrollY >= calcHeight && shareAnimatedValue.value >= calcHeight)
        return;

      _ScrollTo(childScrollRef[index] as never, 0, syncPosition, false);
    };

    for (const key in childScrollRef) {
      if (Object.prototype.hasOwnProperty.call(childScrollRef, key)) {
        if (Number.parseInt(key, 10) === curIndexValue.value) continue;
        handleSceneSync(Number.parseInt(key, 10));
      }
    }
  }, [
    calcHeight,
    childScrollRef,
    childScrollYTrans,
    curIndexValue,
    sceneIsReady,
    shareAnimatedValue,
    dragIndex,
    slideIndex,
    headerTrans,
  ]);

  const refHasChanged = useCallback(
    (ref: NativeGesture) => {
      if (!ref) return;
      const findItem = childGestures.find((item) => item === ref);
      if (findItem) return;
      setChildRefs((prechildRefs) => {
        return [...prechildRefs, ref];
      });
    },
    [childGestures, setChildRefs]
  );

  const headerOnLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      const height = layout.height - overflowHeight;
      setHeaderHeight(height);
      if (animationHeaderHeight) {
        animationHeaderHeight.value = Math.abs(calcHeight - minHeaderHeight);
      }
      opacityValue.value = withTiming(1);
    },
    [
      animationHeaderHeight,
      calcHeight,
      minHeaderHeight,
      opacityValue,
      overflowHeight,
      setHeaderHeight,
    ]
  );

  const tabbarOnLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => {
      if (overflowHeight > height) {
        console.warn("overflowHeight preferably less than the tabbar height");
      }
      if (Math.abs(tabbarHeight - height) < 1) return;
      setTabbarHeight(height);
    },
    [overflowHeight, tabbarHeight, setTabbarHeight]
  );

  const containerOnLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setTabviewHeight(event.nativeEvent.layout.height);
    },
    [setTabviewHeight]
  );
  //#endregion

  //#region gesture handler
  const gestureHandlerHeader = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .shouldCancelWhenOutside(false)
        .enabled(scrollEnabled !== false)
        .onBegin(() => {
          if (isRefreshing.value) return;
          stopScrollView();
        })
        .onUpdate((event) => {
          if (!sceneIsReady.value[curIndexValue.value]) return;

          if (isSlidingHeader.value === false) {
            slideIndex.value = curIndexValue.value;
            const scrollY = childScrollYTrans[curIndexValue.value]?.value;
            if (scrollY === undefined) return;
            headerTransStartY.value = scrollY + event.translationY;

            isSlidingHeader.value = true;
          }
          headerTrans.value = Math.max(
            -event.translationY + headerTransStartY.value,
            0
          );
        })
        .onEnd((event) => {
          if (!sceneIsReady.value[curIndexValue.value]) return;
          if (isSlidingHeader.value === false) return;

          headerTransStartY.value = 0;
          headerTrans.value = withDecay(
            {
              velocity: -event.velocityY,
              clamp: [
                0,
                panHeaderMaxOffset ??
                  headerHeight - minHeaderHeight + overflowHeight,
              ],
            },
            () => {
              isSlidingHeader.value = false;
            }
          );
        })
        .runOnJS(enableGestureRunOnJS),
    [
      enableGestureRunOnJS,
      headerHeight,
      headerTrans,
      isRefreshing,
      sceneIsReady,
      stopScrollView,
      curIndexValue,
      childScrollYTrans,
      isSlidingHeader,
      slideIndex,
      panHeaderMaxOffset,
      minHeaderHeight,
      headerTransStartY,
      overflowHeight,
      scrollEnabled,
    ]
  );

  const gestureHandler = useMemo(
    () =>
      Gesture.Pan()
        .simultaneousWithExternalGesture(gestureHandlerHeader, ...childGestures)
        .shouldCancelWhenOutside(false)
        .enabled(scrollEnabled)
        .activeOffsetX([-width, width])
        .activeOffsetY([-10, 10])
        .onBegin(() => {
          stopAllAnimation();
        })
        .onStart(() => {
          isPullEnough.value = false;
        })
        .onUpdate((event) => {
          if (
            !sceneIsReady.value[curIndexValue.value] ||
            !onStartRefresh ||
            childScrollYTrans[curIndexValue.value]?.value === undefined
          )
            return;

          if (isRefreshing.value !== isRefreshingWithAnimation.value) return;

          // Handle refreshing state
          if (isRefreshing.value) {
            if (event.translationY < 0) {
              // If scrolling down, end refresh immediately
              isRefreshing.value = false;
              isRefreshingWithAnimation.value = false;
              tabsRefreshTrans.value = refreshHeight;
              return;
            }
            if (!isDragging.value) {
              startY.value =
                refreshHeight -
                tabsTrans.value +
                (childScrollYTrans[curIndexValue.value]?.value ?? 0);
              isDragging.value = true;
            }
            // Very stiff resistance
            const pullAmount = -event.translationY + startY.value;
            const resistance = Math.min(
              1,
              Math.max(0.96, 1 - pullAmount / (refreshHeight * 0.4))
            );
            tabsRefreshTrans.value = Math.max(pullAmount * resistance, 0);
            return;
          }

          // Handle pull to refresh
          if (shareAnimatedValue.value > 0 || event.translationY <= 0) return;

          if (!isDragging.value) {
            dragIndex.value = curIndexValue.value;
            basyY.value = event.translationY;
            isDragging.value = true;
            return;
          }

          const pullDistance = event.translationY - basyY.value;
          // Very high resistance and quick ramp-up
          const resistance = Math.min(
            1,
            Math.max(0.96, 1 - Math.abs(pullDistance) / (refreshHeight * 0.4))
          );
          tabsRefreshTrans.value = refreshHeight - pullDistance * resistance;

          if (
            !isPullEnough.value &&
            pullDistance > refreshHeight &&
            onPullEnough
          ) {
            isPullEnough.value = true;
            runOnJS(onPullEnough)();
          }
        })
        .onEnd((event) => {
          if (!sceneIsReady.value[curIndexValue.value] || !onStartRefresh)
            return;
          if (!onStartRefresh) return;

          if (isDragging.value === false) return;
          isDragging.value = false;
          if (isRefreshing.value !== isRefreshingWithAnimation.value) return;
          if (isRefreshing.value) {
            startY.value = 0;
            tabsRefreshTrans.value = withSpring(0, {
              mass: 1.4,
              stiffness: 180,
              damping: 25,
              velocity: -event.velocityY * 0.7,
            });
          } else {
            tabsRefreshTrans.value < 0
              ? onTabsStartRefresh()
              : onTabsEndRefresh();
          }
        })
        .runOnJS(enableGestureRunOnJS),
    [
      basyY,
      childScrollYTrans,
      curIndexValue,
      dragIndex,
      isDragging,
      isPullEnough,
      isRefreshing,
      isRefreshingWithAnimation,
      onPullEnough,
      onStartRefresh,
      sceneIsReady,
      shareAnimatedValue,
      startY,
      stopAllAnimation,
      tabsRefreshTrans,
      tabsTrans,
      scrollEnabled,
      onTabsEndRefresh,
      onTabsStartRefresh,
      gestureHandlerHeader,
      childGestures,
      refreshHeight,
      enableGestureRunOnJS,
    ]
  );

  //#endregion

  useEffect(() => {
    animateTabsToRefresh(isRefreshingProp);
  }, [isRefreshingProp, animateTabsToRefresh]);

  // render Refresh component
  const renderRefreshControl = useCallback(() => {
    if (!onStartRefresh) return;
    return (
      <RefreshControlContainer
        top={refreshControlTop}
        refreshHeight={refreshHeight}
        overflowPull={overflowPull}
        refreshValue={tabsTrans}
        opacityValue={opacityValue}
        isRefreshing={isRefreshing}
        isRefreshingWithAnimation={isRefreshingWithAnimation}
        pullExtendedCoefficient={pullExtendedCoefficient}
        renderContent={renderRefreshControlProp}
        refreshControlColor={refreshControlColor}
      />
    );
  }, [
    renderRefreshControlProp,
    isRefreshing,
    isRefreshingWithAnimation,
    onStartRefresh,
    opacityValue,
    overflowPull,
    pullExtendedCoefficient,
    refreshControlColor,
    refreshControlTop,
    refreshHeight,
    tabsTrans,
  ]);

  //#region animation hooks
  useAnimatedReaction(
    () => {
      return tabsRefreshTrans.value;
    },
    (mTrans) => {
      const nextTabsTrans = Math.max(refreshHeight - mTrans, 0);
      if (tabsTrans.value !== nextTabsTrans) {
        tabsTrans.value = nextTabsTrans;
        // Sync scroll position when tabs position changes
        if (childScrollRef[curIndexValue.value]) {
          const scrollY = childScrollYTrans[curIndexValue.value]?.value;
          if (scrollY !== undefined) {
            if (mTrans > refreshHeight) {
              _ScrollTo(
                childScrollRef[curIndexValue.value] as never,
                0,
                mTrans - refreshHeight,
                false
              );
            } else if (mTrans < refreshHeight && scrollY > 0) {
              _ScrollTo(
                childScrollRef[curIndexValue.value] as never,
                0,
                0,
                false
              );
            }
          }
        }
      }
    }
  );

  useAnimatedReaction(
    () => {
      return shareAnimatedValue.value;
    },
    (scrollY) => {
      // for scrollview bounces effect on iOS
      if (isIOS && animationHeaderPosition && scrollY < calcHeight) {
        animationHeaderPosition.value = -scrollY;
      }
    }
  );

  // slide header
  useAnimatedReaction(
    () => {
      return (
        headerTrans &&
        slideIndex.value === curIndexValue.value &&
        isSlidingHeader.value
      );
    },
    (start) => {
      if (!start) return;
      if (!childScrollRef[curIndexValue.value]) return;
      const scrollY = childScrollYTrans[curIndexValue.value]?.value;
      if (scrollY === undefined) return;
      if (scrollY === headerTrans.value) return;

      _ScrollTo(
        childScrollRef[curIndexValue.value] as never,
        0,
        headerTrans.value || 0,
        false
      );
    }
  );

  const headerTransValue = useDerivedValue(() => {
    const headerTransY = interpolate(
      shareAnimatedValue.value,
      [0, calcHeight],
      [0, -calcHeight],
      Extrapolation.CLAMP
    );
    if (isIOS) {
      return shareAnimatedValue.value > 0
        ? headerTransY
        : -shareAnimatedValue.value;
    }
    if (animationHeaderPosition && headerTransY < calcHeight) {
      animationHeaderPosition.value = headerTransY;
    }
    return headerTransY;
  });

  const tabbarAnimateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: headerTransValue.value,
        },
      ],
    };
  });

  useRefreshDerivedValue(translateYValue, {
    animatedValue: tabsTrans,
    refreshHeight,
    overflowPull,
    pullExtendedCoefficient,
  });

  const animateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateYValue.value,
        },
      ],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacityValue.value,
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: headerTransValue.value,
        },
      ],
    };
  });
  //#endregion

  const renderTabBarContainer = useCallback(
    (children: React.ReactElement) => {
      return (
        <Animated.View style={[styles.tabbarStyle, tabbarAnimateStyle]}>
          <GestureDetector gesture={gestureHandlerHeader}>
            <Animated.View style={styles.container}>
              {renderScrollHeader && (
                <View onLayout={headerOnLayout}>{renderScrollHeader()}</View>
              )}
              {navigationState?.routes.length === 0 && emptyBodyComponent ? (
                <View style={{ marginTop: tabbarHeight }}>
                  {emptyBodyComponent}
                </View>
              ) : (
                <Animated.View
                  style={{ transform: [{ translateY: -overflowHeight }] }}
                  onLayout={tabbarOnLayout}
                >
                  {children}
                </Animated.View>
              )}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      );
    },
    [
      emptyBodyComponent,
      gestureHandlerHeader,
      headerOnLayout,
      navigationState,
      overflowHeight,
      renderScrollHeader,
      tabbarHeight,
      tabbarOnLayout,
      tabbarAnimateStyle,
    ]
  );

  const renderSceneHeader = useCallback(
    (
      children: React.ReactElement,
      props: SceneRendererProps & { route: Route }
    ) => {
      return (
        <View style={styles.header}>
          {children}
          <Animated.View
            onLayout={({
              nativeEvent: {
                layout: { height },
              },
            }) => {
              setStickyHeaderHeight(height);
            }}
            style={[
              {
                top: headerHeight + tabbarHeight,
                ...styles.tabbarStyle,
              },
              headerStyle,
            ]}
          >
            {renderSceneHeaderProp?.(props.route)}
          </Animated.View>
        </View>
      );
    },
    [
      headerHeight,
      tabbarHeight,
      headerStyle,
      renderSceneHeaderProp,
      setStickyHeaderHeight,
    ]
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      setCurrentIndex: (index: number) => {
        curIndexValue.value = index;
      },
    }),
    [curIndexValue]
  );

  return (
    <HeaderTabContext.Provider
      value={{
        shareAnimatedValue,
        headerTrans,
        tabbarHeight,
        expectHeight: Math.floor(
          headerHeight + tabviewHeight - minHeaderHeight
        ),
        headerHeight,
        refreshHeight,
        overflowPull,
        pullExtendedCoefficient,
        refHasChanged,
        curIndexValue,
        minHeaderHeight,
        updateSceneInfo,
        isSlidingHeader,
        isStartRefreshing,
        scrollStickyHeaderHeight,
        scrollViewPaddingTop:
          tabbarHeight + headerHeight + scrollStickyHeaderHeight,
      }}
    >
      <GestureDetector gesture={gestureHandler}>
        <Animated.View style={[styles.container, opacityStyle]}>
          <Animated.View
            style={[styles.container, animateStyle]}
            onLayout={containerOnLayout}
          >
            {renderTabView({
              renderTabBarContainer: renderTabBarContainer,
              renderSceneHeader: renderSceneHeader,
            })}
          </Animated.View>
          {renderRefreshControl()}
        </Animated.View>
      </GestureDetector>
    </HeaderTabContext.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  header: {
    flex: 1,
  },
  tabbarStyle: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
});
