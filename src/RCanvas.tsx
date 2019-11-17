
import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useMemo } from 'react';
import { findNodeHandle } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import RCanvasBase from './RCanvasBase';
import { VIEW_MANAGER } from './RCanvasModule';
import { Commands, RCanvasProperties, RCanvasRef } from './types';

const { and, set, cond, add, block, eq, acc, event, Value, proc, neq, invoke, dispatch, concat, useCode, color, map, View, call } = Animated;


const stringId = proc((id) => concat('rPath', id));
const flatPoint = proc((x, y) => map([x, y]));
//const args = proc((id, color, width, x, y) => map([[id, color, width, [x, y]]]));

const safeDispatch = proc((tag, node) => cond(neq(tag, 0), node));

const startPath = proc((tag, id, color, width, x, y) => {
  //const args = proc((id, color, width, x, y) => map([id, color, width, [x, y]]));
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.startPath, tag, stringId(id), color, width));
});

const addPoint = proc((tag, id, x, y) => {
  const args = proc((x, y) => map([x, y]));
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.addPoint, tag, x, y));
});

const endPath = proc((tag, id) => safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.endPath, tag)));


function RCanvas(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  const tag = new Value(0);
  const n = new Value(0);
  const x = new Value(0);
  const y = new Value(0);
  const isActive = new Value(0);
  const pathColor = new Value(0);
  const state = new Value(State.UNDETERMINED);
  const oldState = new Value(State.UNDETERMINED);

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
    set(pathColor, color(255, 0, 0, 1)),
    []
  );

  useCode(() =>
    block([
      cond(
        eq(state, State.BEGAN),
        [
          set(n, add(n, 1)),
          startPath(tag, n, pathColor, 5, x, y),
          set(isActive, 1)

        ]
      ),
      cond(
        and(eq(state, State.ACTIVE), isActive),
        [

          addPoint(tag, n, x, y),
          //endPath()

        ]
      ),
      cond(
        eq(oldState, State.ACTIVE),
        [
          endPath(tag, n),
          set(isActive, 0)
        ]
      ),
      call([tag, n, x, y, state, isActive], console.log)
    ]),
    [tag, state, oldState, x, y, isActive]
  )

  const refHandler = useCallback((ref: RCanvasRef) => {
    if (_.has(forwardedRef, 'current')) {
      forwardedRef.current = ref;
    } else if (typeof forwardedRef === 'function') {
      forwardedRef(ref);
    } else {
      forwardedRef = ref;
    }

    tag.setValue(findNodeHandle(ref) || 0);
  }, [tag, forwardedRef])

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      maxPointers={1}
      shouldCancelWhenOutside={false}
    >
      <View style={styles.default}>
        <RCanvasBase
          {...props}
          touchEnabled={false}
          ref={refHandler}
        />
      </View>

    </PanGestureHandler>
  );
}

const styles = {
  default: {
    flex: 1
  }
};

const ForwardedRCanvas = forwardRef(RCanvas);
export default ForwardedRCanvas;