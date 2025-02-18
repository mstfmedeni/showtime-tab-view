import React, { useCallback } from 'react'

import { type LegendListRef } from '@legendapp/list'

import {
  InfiniteScrollList,
  type InfiniteScrollListProps,
} from '../infinite-scroll-list/infinite-scroll-list'
import { useHeaderTabContext } from './context'

import { type ScrollViewProps } from 'react-native'
import { TabFlashListScrollView } from './tab-flash-list-scroll-view'

export type TabInfiniteScrollListProps<T> = Omit<
  InfiniteScrollListProps<T>,
  'renderScrollComponent'
> & {
  index: number
}

function TabInfiniteScrollListComponent<T>(
  props: TabInfiniteScrollListProps<T>,
  ref: React.Ref<LegendListRef>
) {
  const { scrollViewPaddingTop } = useHeaderTabContext()

  const renderScrollComponent = useCallback(
    (restProps: ScrollViewProps) => {
      return <TabFlashListScrollView {...restProps} index={props.index} />
    },
    [props.index]
  )

  return (
    <InfiniteScrollList
      maintainVisibleContentPosition
      {...props}
      renderScrollComponent={renderScrollComponent}
      contentContainerStyle={{ paddingTop: scrollViewPaddingTop }}
      ref={ref}
    />
  )
}

export const TabInfiniteScrollList = React.forwardRef(TabInfiniteScrollListComponent) as <T>(
  props: TabInfiniteScrollListProps<T> & {
    ref?: React.Ref<LegendListRef>
  }
) => React.ReactElement
