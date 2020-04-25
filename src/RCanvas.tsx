
import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import { add, and, block, cond, eq, event, not, set, useCode, Value } from 'react-native-reanimated';
import RCanvasBase from './RCanvasBase';
import { alloc, drawPoint, endInteraction, rPathID, createPathID } from './RCanvasModule';
import { RCanvasProperties, RCanvasRef } from './types';
import { useEventProp } from './util';

function useValue(value: number | (() => number)) {
  return useMemo(() => new Value(typeof value === 'function' ? value() : value), []);
}

function RCanvas(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef & PanGestureHandler>) {
  const ref = useRef<RCanvasRef>();
  const panRef = useRef<RCanvasRef>();
  const tag = useValue(0);
  const id = rPathID;
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
              createPathID(),
              alloc(tag, id, stub, stub),
              set(isActive, 1),
            ]
          ),
          drawPoint(tag, id, x, y),
        ]
      ),
      cond(
        and(isActive, eq(oldState, State.ACTIVE)),
        [
          endInteraction(tag, id),
          set(isActive, 0)
        ]
      )
    ]),
    [tag, state, oldState, x, y, isActive]
  )

  const onLayout = useCallback((e) => {
    tag.setValue(e.nativeEvent.target);
  }, [tag]);

  useImperativeHandle(forwardedRef, () => {
    return ref.current ? _.assign(panRef.current, ref.current.module()) : null;
  });

  const { style, ...passProps } = props;

  return (
    <PanGestureHandler
      {...passProps}
      ref={panRef}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      maxPointers={1}
      shouldCancelWhenOutside={false}
    >
      <RCanvasBase
        {...props}
        ref={ref}
        onLayout={useEventProp(onLayout, props.onLayout)}
      />
    </PanGestureHandler>
  );
}

const ForwardedRCanvas = forwardRef(RCanvas);
ForwardedRCanvas.displayName = 'Forwarded(RCanvas)';
ForwardedRCanvas.defaultProps = RCanvasBase.defaultProps as RCanvasProperties;
export default ForwardedRCanvas;