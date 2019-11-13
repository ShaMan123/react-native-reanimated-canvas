import SketchCanvas from 'react-native-reanimated-canvas';
import React, { Component } from 'react';
import { Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { createNativeWrapper, LongPressGestureHandler, State, TapGestureHandler, PinchGestureHandler, RectButton, PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const { set, cond, add, block, eq, acc, event, Value } = Animated;

export default function Canvas() {
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
      x, y, state, oldState
    }
  });
 return null;
}