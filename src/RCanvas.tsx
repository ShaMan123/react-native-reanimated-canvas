
import React, { Component, Ref, forwardRef } from 'react';
import { Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { createNativeWrapper, LongPressGestureHandler, State, TapGestureHandler, PinchGestureHandler, RectButton, PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { VIEW_MANAGER } from './RCanvasModule';
import { Commands, RCanvasProperties, RCanvasRef } from './types';
import RCanvasBase from './RCanvasBase';

const { set, cond, add, block, eq, acc, event, Value, proc, invoke, dispatch, concat, useCode, color, map } = Animated;

const stringId = proc((id) => concat('rPath', id));
//const startPath = proc((id, color, width, x, y) => dispatch(VIEW_MANAGER, 'addPath', [stringId(id), color, width, [x, y]]));
//const addPoint = proc((id, color, width, x, y) => dispatch(VIEW_MANAGER, Commands.addPoint, [stringId(id), [x, y]]));
const endPath = proc((map) => dispatch(VIEW_MANAGER, Commands.endPath, map));

function RCanvas(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  const n = new Value(0);
  const x = new Value(0);
  const y = new Value(0);
  const state = new Value(State.UNDETERMINED);
  const oldState = new Value(State.UNDETERMINED);
  const onGestureEvent = event<PanGestureHandlerGestureEvent>([{
    nativeEvent: {
      x,
      y
    }
  }]);
  const onHandlerStateChange = event<PanGestureHandlerStateChangeEvent>([{
    nativeEvent: {
      x,
      y,
      state,
      oldState
    }
  }]);

  useCode(() =>
    cond(
      eq(state, State.BEGAN),
      [
        set(n, add(n, 1)),
        //startPath(n, color(255, 0 ,0),360,x,y),
        //endPath()

      ]
    ),
    []
  )

  return <RCanvasBase {...props} ref={forwardedRef} />;
}

const ForwardedRCanvas = forwardRef(RCanvas);
export default ForwardedRCanvas;