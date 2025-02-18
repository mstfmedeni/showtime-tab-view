import React from "react";
import type { ScrollViewProps } from "react-native";

import Animated from "react-native-reanimated";
import { SceneComponent } from "./scene";

type TabScrollViewProps = ScrollViewProps & {
  index: number;
};

function TabFlashListScrollViewComponent(
  props: TabScrollViewProps,
  ref: React.Ref<unknown>
) {
  return (
    <SceneComponent
      {...props}
      forwardedRef={ref}
      ContainerView={Animated.ScrollView}
    />
  );
}

export const TabFlashListScrollView = React.forwardRef(
  TabFlashListScrollViewComponent
);
