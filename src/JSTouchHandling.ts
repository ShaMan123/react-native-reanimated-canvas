'use strict';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { RCanvasProperties, RCanvasRef } from './types';
import { generatePathId, useRefGetter } from './util';
import { PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';

export function useCanvasPanResponder(touchEnabled: boolean, ref: MutableRefObject<RCanvasRef>) {
  const grant = useCallback((evt) =>
    touchEnabled && evt.nativeEvent.touches.length === 1,  //gestureState.numberActiveTouches === 1;
    [touchEnabled]
  );

  const currentPathId = useRefGetter<number>();

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: grant,
      onStartShouldSetPanResponderCapture: grant,
      onMoveShouldSetPanResponder: grant,
      onMoveShouldSetPanResponderCapture: grant,
      onPanResponderGrant: (evt, gestureState) => {
        currentPathId.set(generatePathId());
        ref.current.alloc(currentPathId.value());
      },
      onPanResponderMove: (evt, gestureState) => {
        const { locationX: x, locationY: y } = evt.nativeEvent
        ref.current.drawPoint(currentPathId.value(), { x, y });
      },
      onPanResponderRelease: (evt, gestureState) => {
        ref.current.endInteraction(currentPathId.value());
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      }
    }), [grant, ref, currentPathId]);

  return panResponder.panHandlers;
}

export function useCanvasGestureHandler(props: RCanvasProperties, ref: MutableRefObject<RCanvasRef>) {
  const currentPathId = useRefGetter<number>();
  const onHandlerStateChange = useCallback((e: PanGestureHandlerStateChangeEvent) => {
    switch (e.nativeEvent.state) {
      case State.BEGAN:
        currentPathId.set(generatePathId());
        ref.current.alloc(currentPathId.value());
        break;
      case State.END:
        ref.current.endInteraction(currentPathId.value());
        break;
    }
    props.onHandlerStateChange && props.onHandlerStateChange(e);
  }, [ref, props.onHandlerStateChange, currentPathId]);

  const onGestureEvent = useCallback((e) => {
    const { x, y } = e.nativeEvent
    ref.current.drawPoint(currentPathId.value(), { x, y });
    props.onGestureEvent && props.onGestureEvent(e);
  }, [ref, props.onGestureEvent, currentPathId]);

  return useMemo(() => {
    return {
      enabled: props.enabled,
      maxPointers: 1,
      onGestureEvent,
      onHandlerStateChange
    }
  }, [props.enabled, onHandlerStateChange, onGestureEvent]);
}
