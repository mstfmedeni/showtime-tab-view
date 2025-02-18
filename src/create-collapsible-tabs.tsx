import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import {
  type NavigationState,
  type SceneRendererProps,
  TabBar,
  type TabDescriptor,
  type TabView,
  type TabViewProps,
} from "react-native-tab-view";

import {
  GestureContainer,
  type GestureContainerRef,
} from "./gesture-container";
import type {
  CollapsibleHeaderProps,
  Route,
  TabViewCustomRenders,
} from "./types";

export type CollapsibleTabViewRef = object;
export type CollapsibleTabViewProps<T extends Route> = Partial<
  TabViewProps<T>
> &
  Pick<TabViewProps<T>, "onIndexChange" | "navigationState" | "renderScene"> &
  CollapsibleHeaderProps<T>;

export type ForwardTabViewProps<T extends Route> =
  CollapsibleTabViewProps<T> & {
    forwardedRef: React.ForwardedRef<CollapsibleTabViewRef>;
    Component: React.PropsWithRef<typeof TabView>;
  };

export function createCollapsibleTabsComponent<T extends Route>(
  Component: React.PropsWithRef<typeof TabView>
) {
  return React.forwardRef<CollapsibleTabViewRef, CollapsibleTabViewProps<T>>(
    function tabView(props, ref) {
      return (
        <CollapsibleHeaderTabView
          {...props}
          forwardedRef={ref}
          Component={Component}
        />
      );
    }
  );
}

function CollapsibleHeaderTabView<T extends Route>({
  forwardedRef,
  ...props
}: ForwardTabViewProps<T>) {
  const gestureContainerRef = useRef<GestureContainerRef>(null);
  const initialPageRef = useRef(props.navigationState.index);

  useEffect(() => {
    gestureContainerRef.current?.setCurrentIndex(props.navigationState.index);
  }, [props.navigationState.index]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      // Todo: add snapTo tab view content method
    }),
    []
  );
  const renderTabBar = useCallback(
    (
      tabbarProps: SceneRendererProps & {
        navigationState: NavigationState<T>;
        options: Record<string, TabDescriptor<T>> | undefined;
      }
    ) => {
      return props?.renderTabBar ? (
        props.renderTabBar(tabbarProps)
      ) : (
        <TabBar {...tabbarProps} />
      );
    },
    [props]
  );

  const renderTabView = (e: TabViewCustomRenders) => {
    const { Component, renderScene, ...restProps } = props;

    return (
      <Component
        {...restProps}
        renderTabBar={(
          tabbarProps: SceneRendererProps & {
            navigationState: NavigationState<T>;
            options: Record<string, TabDescriptor<T>> | undefined;
          }
        ) => e.renderTabBarContainer(renderTabBar(tabbarProps))}
        renderScene={(props) => e.renderSceneHeader(renderScene(props), props)}
      />
    );
  };

  return (
    // @ts-expect-error Needs fixing
    <GestureContainer
      ref={gestureContainerRef}
      initialPage={initialPageRef.current}
      renderTabView={renderTabView}
      {...props}
    />
  );
}
