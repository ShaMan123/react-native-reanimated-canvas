
import React from 'react';
import { Text, View } from 'react-native';
import { RCanvasRef } from '../../src/types';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext, useRefGetter } from './common';


export default function SyncedCanvases() {
  const context = useCanvasContext();
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b, b] = useRefGetter<RCanvasRef>();

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <RNSketchCanvas
        {...context.canvas}
        ref={_a}
        onStrokeEnd={(e) => {
          console.log(e.nativeEvent.color)
          b().addPath(e.nativeEvent)
        }}
      />
      <RNSketchCanvas
        {...context.canvas}
        ref={_b}
        onStrokeEnd={(e) => {
          a().addPath(e.nativeEvent)
        }}
      />
    </View>
  )
}