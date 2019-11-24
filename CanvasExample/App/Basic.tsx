
import React from 'react';
import { Text, View } from 'react-native';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Basic() {
  const context = useCanvasContext();

  return (
    <RNSketchCanvas
      {...context.canvas}
    />
  )
}