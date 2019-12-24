import _ from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import Animated, { add, and, block, cond, eq, event, not, set, useCode, Value } from 'react-native-reanimated';
import { RCanvasModule, RCanvasRef } from 'react-native-reanimated-canvas';
import { styles } from './common';
import LegacyCanvas from './LegacyCanvas';

const { alloc, drawPoint, endInteraction, stringId, pathIdMem } = RCanvasModule;
const { View } = Animated;

function useValue(value: number | (() => number)) {
  return useMemo(() => new Value(typeof value === 'function' ? value() : value), []);
}

export default function Synced() {
  const ref = useRef<RCanvasRef>();
  const panRef = useRef<RCanvasRef>();
  const tagA = useValue(0);
  const tagB = useValue(0);
  const id = useMemo(() => stringId(pathIdMem), [pathIdMem]);
  const x = useValue(0);
  const y = useValue(0);
  const isActive = useValue(0);
  const stub = useValue();
  const state = useValue(State.UNDETERMINED);
  const oldState = useValue(State.UNDETERMINED);

  const onGestureEvent = useMemo(() =>
    event<PanGestureHandlerGestureEvent>([{
      nativeEvent: {
        x,
        y
      }
    }]),
    [x, y]
  );

  const onHandlerStateChange = useMemo(() =>
    event<PanGestureHandlerStateChangeEvent>([{
      nativeEvent: {
        x,
        y,
        state,
        oldState
      }
    }]),
    [
      x,
      y,
      state,
      oldState
    ]
  );

  useCode(() =>
    block([
      cond(
        eq(state, State.ACTIVE),
        [
          cond(
            not(isActive),
            [
              set(pathIdMem, add(pathIdMem, 1)),
              alloc(tagA, id, stub, stub),
              alloc(tagB, id, stub, stub),
              set(isActive, 1),
            ]
          ),
          drawPoint(tagA, id, x, y),
          drawPoint(tagB, id, x, y),
        ]
      ),
      cond(
        and(isActive, eq(oldState, State.ACTIVE)),
        [
          endInteraction(tagA, id),
          endInteraction(tagB, id),
          set(isActive, 0)
        ]
      )
    ]),
    [state, oldState, x, y, isActive]
  )

  const onLayoutA = useCallback((e) => {
    tagA.setValue(e.nativeEvent.target);
  }, []);

  const onLayoutB = useCallback((e) => {
    tagB.setValue(e.nativeEvent.target);
  }, []);

  const base = useCallback((onLayout: any) => (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      maxPointers={1}
      shouldCancelWhenOutside={false}
    >
      <View style={styles.default}>
        <LegacyCanvas
          enabled={false}
          onLayout={onLayout}
        />
      </View>
    </PanGestureHandler>
  ), []);

  return (
    <View style={styles.container}>
      {base(onLayoutA)}
      {base(onLayoutB)}
    </View>
  )
}
