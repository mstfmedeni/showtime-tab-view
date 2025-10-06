import React, {
  type ComponentClass,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import Animated from "react-native-reanimated";
import { SceneComponent } from "./scene";

export function createCollapsibleScrollView<P extends object>(
  Component: ComponentClass<P>
) {
  // Use type assertion here if you're sure about the compatibility
  const AnimatePageView = Animated.createAnimatedComponent(
    Component as unknown as ComponentClass<object>
  );

  type CollapsibleScrollViewProps = P & {
    index: number;
  };

  return React.forwardRef<
    ForwardRefExoticComponent<
      CollapsibleScrollViewProps & RefAttributes<ComponentClass<P>>
    >,
    CollapsibleScrollViewProps
  >(function TabViewScene(props, ref) {
    return (
      <SceneComponent
        {...props}
        forwardedRef={ref}
        ContainerView={AnimatePageView}
      />
    );
  });
}
