<img align="right" width="160" alt="showtime tab view logo" src="./example/assets/icon.png" />
<div >
  <h1>Showtime Tab View</h1>
</div>

A React Native component that supports a collapsible header and custom refresh control, powered by [Reanimated v2](https://docs.swmansion.com/react-native-reanimated/) and [GestureHandler V2](https://docs.swmansion.com/react-native-gesture-handler/docs/).
<video align="right" width="160" alt="This library helped you? Consider sponsoring!" src="https://user-images.githubusercontent.com/37520667/212389901-764422ef-cf1b-48fc-87af-cfbe7ad1f6e2.mp4" />

## What

This is a React Native tab view component that wraps gestures and animations on top of [react-native-tab-view](https://github.com/react-navigation/react-navigation/tree/main/packages/react-native-tab-view#readme). The source code can be found [here](https://github.com/showtime-xyz/showtime-frontend/tree/staging/packages/design-system/collapsible-tab-view). You can see this [context on Twitter](https://twitter.com/alan_toa/status/1564429150152458241).

## Features

- Collapsible header.
- Support for [FlashList](https://shopify.github.io/flash-list/). \*(see [this](./example/src/tab-flash-list/index.tsx))
- Custom refresh control.
- Bounce effect support on iOS.
- Support for iOS, Android, and Web.
- Zoom header when pulling to refresh. \*(see this [thread](https://github.com/showtime-xyz/showtime-frontend/discussions/1471))

## Installation

Before installing this package, you should first follow the installation instructions for:

- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [react-native-gesture-handler v2](https://docs.swmansion.com/react-native-gesture-handler/)
- [react-native-pager-view](https://docs.expo.dev/versions/latest/sdk/view-pager/)

FlashList is not a required dependency, but for optimal performance, it is recommended to use FlashList instead of the standard FlatList implementation

- [FlashList by Shopify](https://shopify.github.io/flash-list/docs/)

And then, you can install the package using the following command:

```sh
yarn add @showtime-xyz/tab-view
```

## Examples

- [Basic Example](./example//src/example.tsx)
- [Zoom Effect with Pull-To-Refresh](https://github.com/Daavidaviid/showtime-scrollview-with-zoom-pull-to-refresh)
- [Showtime Profile Example](https://github.com/showtime-xyz/showtime-frontend/tree/staging/packages/app/components/profile)
- ...more to come!

## Usage

The API for this package is similar to [react-native-tab-view](https://github.com/react-navigation/react-navigation/tree/main/packages/react-native-tab-view#readme), with extended props. A basic usage example is shown below:

```tsx
import React, { useCallback, useState } from "react";
import { StatusBar, Text, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import {
  CollapsibleTabView,
  Route,
  TabFlashList,
  TabFlatList,
  TabScrollView,
  TabSectionList,
} from "@showtime-xyz/tab-view";

const StatusBarHeight = StatusBar.currentHeight ?? 0;

const TabScene = ({ route }: any) => {
  return (
    <TabFlashList
      index={route.index}
      data={new Array(20).fill(0)}
      estimatedItemSize={60}
      renderItem={({ index }) => {
        return (
          <View
            style={{
              height: 60,
              backgroundColor: "#fff",
              marginBottom: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text>{`${route.title}-Item-${index}`}</Text>
          </View>
        );
      }}
    />
  );
};

export function Example() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [routes] = useState<Route[]>([
    { key: "like", title: "Like", index: 0 },
    { key: "owner", title: "Owner", index: 1 },
    { key: "created", title: "Created", index: 2 },
  ]);
  const [index, setIndex] = useState(0);
  const animationHeaderPosition = useSharedValue(0);
  const animationHeaderHeight = useSharedValue(0);

  const renderScene = useCallback(({ route }: any) => {
    switch (route.key) {
      case "like":
        return <TabScene route={route} index={0} />;
      case "owner":
        return <TabScene route={route} index={1} />;
      case "created":
        return <TabScene route={route} index={2} />;
      default:
        return null;
    }
  }, []);

  const onStartRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      console.log("onStartRefresh");
      setIsRefreshing(false);
    }, 300);
  };

  const renderHeader = () => (
    <View style={{ height: 300, backgroundColor: "#000" }}></View>
  );

  return (
    <CollapsibleTabView
      onStartRefresh={onStartRefresh}
      isRefreshing={isRefreshing}
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      lazy
      renderScrollHeader={renderHeader}
      minHeaderHeight={44 + StatusBarHeight}
      animationHeaderPosition={animationHeaderPosition}
      animationHeaderHeight={animationHeaderHeight}
    />
  );
}
```

## API

### Components

#### `CollapsibleTabView`

The main component that provides a tab view with a collapsible header. All props from [react-native-tab-view](https://github.com/react-navigation/react-navigation/tree/main/packages/react-native-tab-view#readme) are supported, plus additional props for header behavior.

#### Scrollable Components

All scrollable components require an `index` prop to identify the tab.

##### `TabScrollView`

A wrapper around React Native's `ScrollView` with collapsible header support.

```tsx
import { TabScrollView } from "@showtime-xyz/tab-view";

<TabScrollView index={0}>{/* Your content */}</TabScrollView>;
```

##### `TabFlatList`

A wrapper around React Native's `FlatList` with collapsible header support.

```tsx
import { TabFlatList } from "@showtime-xyz/tab-view";

<TabFlatList
  index={0}
  data={data}
  renderItem={({ item }) => <Item item={item} />}
  keyExtractor={(item) => item.id}
/>;
```

##### `TabSectionList`

A wrapper around React Native's `SectionList` with collapsible header support.

```tsx
import { TabSectionList } from "@showtime-xyz/tab-view";

<TabSectionList
  index={0}
  sections={sections}
  renderItem={({ item }) => <Item item={item} />}
  renderSectionHeader={({ section }) => <Header title={section.title} />}
/>;
```

##### `TabFlashList`

A wrapper around Shopify's `FlashList` with collapsible header support. For optimal performance, especially with large lists.

**Note:** You need to install `@shopify/flash-list` separately:

```sh
yarn add @shopify/flash-list
```

**Usage:**

```tsx
import { TabFlashList } from "@showtime-xyz/tab-view";

<TabFlashList
  index={0}
  data={data}
  renderItem={({ item }) => <Item item={item} />}
  estimatedItemSize={100} // Optional in FlashList v2
/>;
```

**FlashList v2 Features:**

TabFlashList supports all FlashList v2 features including:

- `masonry` - Enable masonry layout for grid-like interfaces
- `onStartReached` - Callback for loading older content
- `maintainVisibleContentPosition` - Maintain scroll position when content changes (enabled by default)
- All FlashList hooks: `useLayoutState`, `useRecyclingState`, `useMappingHelper`

Example with FlashList v2 features:

```tsx
<TabFlashList
  index={0}
  data={data}
  renderItem={({ item }) => <Item item={item} />}
  masonry
  numColumns={2}
  onStartReached={() => loadOlderContent()}
  maintainVisibleContentPosition={{
    autoscrollToBottomThreshold: 0.2,
  }}
/>
```

For more details, see the [FlashList documentation](https://shopify.github.io/flash-list/).

## Contributing

To learn how to contribute to this repository and understand the development workflow, please refer to the [contributing guide](CONTRIBUTING.md).

## Shoutout

Special thanks to [@Daavidaviid](https://github.com/Daavidaviid) for experimenting with the [zoom header effect with pull-to-refresh](https://github.com/showtime-xyz/showtime-frontend/discussions/1471).

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
