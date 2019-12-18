
import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { processColor } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { addPoint, endPath, pathIdMem, startPath, stringId } from './RACanvasModule';
import RCanvasBase, { processColorProp } from './RCanvasBase';
import { RCanvasProperties, RCanvasRef } from './types';

const { set, cond, add, block, eq, event, Value, useCode, not, View } = Animated;

function useValue(value: number | (() => number)) {
  return useMemo(() => new Value(typeof value === 'function' ? value() : value), []);
}

function RCanvas(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  const ref = useRef<RCanvasRef>();
  const panRef = useRef<RCanvasRef>();
  const tag = useValue(0);
  const id = useMemo(() => stringId(pathIdMem), [pathIdMem]);
  const x = useValue(0);
  const y = useValue(0);
  const isActive = useValue(0);
  const strokeColor = useValue(() => {
    const color = props.strokeColor;
    return color instanceof Animated.Node ? 0 : processColor(color || 'black');
  });
  const strokeWidth = useValue(() => {
    const width = props.strokeWidth;
    return width instanceof Animated.Node ? 0 : (width || 5);
  });
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
    set(strokeColor, processColorProp(props.strokeColor)),
    [props.strokeColor]
  );

  useCode(() =>
    set(strokeWidth, props.strokeWidth as Animated.Adaptable<number>),
    [props.strokeWidth]
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
              startPath(tag, id, strokeColor, strokeWidth),
              set(isActive, 1),
            ]
          ),
          addPoint(tag, id, x, y),
        ]
      ),
      cond(
        eq(oldState, State.ACTIVE),
        [
          endPath(tag, pathIdMem),
          set(isActive, 0)
        ]
      )
    ]),
    [tag, state, oldState, x, y, isActive, strokeColor, strokeWidth]
  )

  const onLayout = useCallback((e) => {
    tag.setValue(e.nativeEvent.target);
    props.onLayout && props.onLayout(e);
  }, [tag, props.onLayout]);

  useImperativeHandle(forwardedRef, () => {
    return _.assign(panRef.current, ref.current ? ref.current.module() : {})
  });

  return (
    <PanGestureHandler
      {..._.omit(props, 'style')}
      ref={panRef}
      enabled={!props.useNativeDriver}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      maxPointers={1}
      shouldCancelWhenOutside={false}
    >
      <View style={styles.default}>
        <RCanvasBase
          {...props}
          ref={ref}
          onLayout={onLayout}
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
ForwardedRCanvas.defaultProps = {
  useNativeDriver: false,
  hardwareAccelerated: true
} as RCanvasProperties;
export default ForwardedRCanvas;