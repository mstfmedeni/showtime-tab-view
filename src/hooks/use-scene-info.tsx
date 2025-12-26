import { useCallback, useEffect, useRef, useState } from "react";

import type { SharedValue } from "react-native-reanimated";
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";

import type { UpdateSceneInfoParams } from "../types";

export const useSceneInfo = (curIndexValue: SharedValue<number>) => {
  // Are all the fields on the scene ready
  const sceneIsReady = useSharedValue<{ [index: number]: boolean }>({});

  // Use refs instead of state so worklets can access the latest values
  const childScrollYTransRef = useRef<{
    [index: number]: SharedValue<number>;
  }>({});
  const childScrollRefRef = useRef<{
    [index: number]: any;
  }>({});

  // State to trigger re-renders when refs update
  const [updateCounter, setUpdateCounter] = useState(0);

  const updateSceneInfo = useCallback(
    ({ index, scrollRef, scrollY }: UpdateSceneInfoParams) => {
      let didUpdate = false;

      if (scrollRef && childScrollRefRef.current[index] !== scrollRef) {
        childScrollRefRef.current[index] = scrollRef;
        didUpdate = true;
      }

      if (scrollY && childScrollYTransRef.current[index] !== scrollY) {
        childScrollYTransRef.current[index] = scrollY;
        didUpdate = true;
      }

      if (didUpdate) {
        setUpdateCounter((c) => c + 1);
      }
    },
    []
  );

  const updateIsReady = useCallback(() => {
    const mIndex = curIndexValue.value;
    const hasRef = Object.prototype.hasOwnProperty.call(
      childScrollRefRef.current,
      mIndex
    );
    const hasScrollY = Object.prototype.hasOwnProperty.call(
      childScrollYTransRef.current,
      mIndex
    );
    const isReady = hasRef && hasScrollY;

    if (isReady) {
      sceneIsReady.value = {
        ...sceneIsReady.value,
        [mIndex]: isReady,
      };
    }
  }, [curIndexValue, sceneIsReady]);

  // We should call function updateIsReady when the refs update
  useEffect(() => {
    updateIsReady();
  }, [updateIsReady, updateCounter]);

  /**
   * If all of the elements in the Aarray have changed, the tabIndex is switched.
   * At this point the above useEffect will not be called again,
   * and we will have to call the updateisReady function again.
   */
  useAnimatedReaction(
    () => {
      return curIndexValue.value;
    },
    () => {
      runOnJS(updateIsReady)();
    },
    [updateIsReady]
  );

  return {
    childScrollRef: childScrollRefRef.current,
    childScrollYTrans: childScrollYTransRef.current,
    sceneIsReady,
    updateSceneInfo,
  };
};
