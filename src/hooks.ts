'use strict';

import { MutableRefObject, useCallback, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { RCanvasProperties, RCanvasRef } from './types';

export function useCanvasPanResponder(touchEnabled: boolean, ref: MutableRefObject<RCanvasRef>) {
  const grant = useCallback((evt) =>
    touchEnabled && evt.nativeEvent.touches.length === 1,  //gestureState.numberActiveTouches === 1;
    [touchEnabled]
  );

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: grant,
      onStartShouldSetPanResponderCapture: grant,
      onMoveShouldSetPanResponder: grant,
      onMoveShouldSetPanResponderCapture: grant,
      onPanResponderGrant: (evt, gestureState) => {
        const e = evt.nativeEvent;
        ref.current.startPath(e.locationX, e.locationY);
      },
      onPanResponderMove: (evt, gestureState) => {
        ref.current.addPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        ref.current.endPath();
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      }
    }), [grant, ref]);

  return panResponder.panHandlers;
}

export function useCanvasGestureHandler(props: RCanvasProperties, ref: MutableRefObject<RCanvasRef>) {
  const { PanGestureHandlerStateChangeEvent, State } = require('react-native-gesture-handler');
  const onHandlerStateChange = useCallback((e: PanGestureHandlerStateChangeEvent) => {
    switch (e.nativeEvent.state) {
      case State.BEGAN:
        ref.current.startPath(e.nativeEvent.x, e.nativeEvent.y);
        break;
      case State.END:
        ref.current.endPath();
        break;
    }
    props.onHandlerStateChange && props.onHandlerStateChange(e);
  }, [ref, props.onHandlerStateChange]);

  const onGestureEvent = useCallback((e) => {
    ref.current.addPoint(e.nativeEvent.x, e.nativeEvent.y);
    props.onGestureEvent && props.onGestureEvent(e);
  }, [ref, props.onGestureEvent]);

  return useMemo(() => {
    return {
      enabled: props.touchEnabled || props.enabled,
      maxPointers: 1,
      onGestureEvent,
      onHandlerStateChange
    }
  }, [props.touchEnabled, props.enabled, onHandlerStateChange, onGestureEvent]);
}
