import * as React from 'react';
import { Insets, NativeSyntheticEvent, StyleProp, ViewProps, ViewStyle } from "react-native";
import { PanGestureHandlerProperties } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import * as Types from './src/types'

declare module 'react-native-reanimated-canvas' {
  export var Commands: Types.Commands;
  export var RCanvasProps: Types.RCanvasProps;
  export var RCanvasProperties: Types.RCanvasProperties;
  export var RCanvasRef: Types.RCanvasRef;
  export var TouchStates: Types.TouchStates;
  export var PathData: Types.PathData;
  export var NativeStrokeEvent: Types.NativeStrokeEvent;
}

declare module 'react-native-reanimated-canvas/base' {
  export var Commands: Types.Commands;
  export var RCanvasProps: Types.RCanvasProps;
  export var RCanvasProperties: Types.RCanvasProperties;
  export var RCanvasRef: Types.RCanvasRef;
  export var TouchStates: Types.TouchStates;
  export var PathData: Types.PathData;
  export var NativeStrokeEvent: Types.NativeStrokeEvent;
}
