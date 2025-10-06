import { TabView } from "react-native-tab-view";

import { createCollapsibleTabsComponent } from "./create-collapsible-tabs";

export {
  TabFlatList,
  TabScrollView,
  TabSectionList,
  TabFlashList,
} from "./scrollable-view";

export * from "./create-collapsible-tabs";
export * from "./scene";
export * from "./types";
export type {
  TabScrollViewProps,
  TabFlatListProps,
  TabSectionListProps,
  TabFlashListProps,
} from "./scrollable-view";
export { useHeaderTabContext } from "./context";
export const CollapsibleTabView = createCollapsibleTabsComponent(TabView);
