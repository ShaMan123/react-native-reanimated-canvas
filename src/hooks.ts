'use strict';

import React, { MutableRefObject, useCallback, useMemo } from 'react';
import { PanResponder } from 'react-native';
import { SketchCanvasProperties } from '../index';

export function useSketchCanvasResponder(props: SketchCanvasProperties, ref: MutableRefObject<any>) {
  const { touchEnabled } = props;
  const grant = useCallback((evt) =>
    touchEnabled ? evt.nativeEvent.touches.length === 1 : false,  //gestureState.numberActiveTouches === 1;
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

function useSketchCanvasHandler(props: SketchCanvasProperties, ref: MutableRefObject<any>) {
  const { touchEnabled } = props;
  /*
  const onHandlerStateChange = useCallback((e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state === GHState.BEGAN) this.startPath(e.nativeEvent.x, e.nativeEvent.y);
    if (e.nativeEvent.oldState === GHState.ACTIVE) this.endPath();
  }

  onGestureEvent = (e) => {
    this.addPoint(e.nativeEvent.x, e.nativeEvent.y);
    this.props.onGestureEvent && this.props.onGestureEvent(e);
  }
  */

 
  return useMemo(() => {

    return {
      enabled: touchEnabled,
      maxPointers: 1,
      onGestureEvent,
      onHandlerStateChange
    }
  }, [])
}