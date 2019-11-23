
import React from 'react';
import { Text, View } from 'react-native';
import { RCanvasRef } from '../../src/types';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext, useRefGetter } from './common';


export default function Example() {
  const context = useCanvasContext();
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b, b] = useRefGetter<RCanvasRef>();

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <RNSketchCanvas
        {...context.canvas}
        ref={_a}
        user={'user1'}
        containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
        canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
        closeComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View>}
        undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
        onUndoPressed={(id) => {
          b().deletePath(id)
        }}
        clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
        onClearPressed={() => {
          b().clear()
        }}
        eraseComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Eraser</Text></View>}
        strokeComponent={color => (
          <View style={[{ backgroundColor: color }, styles.strokeColorButton]} />
        )}
        strokeSelectedComponent={(color, index, changed) => {
          return (
            <View style={[{ backgroundColor: color, borderWidth: 2 }, styles.strokeColorButton]} />
          )
        }}
        strokeWidthComponent={(w) => {
          return (<View style={styles.strokeWidthButton}>
            <View style={{
              backgroundColor: 'white', marginHorizontal: 2.5,
              width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2
            }} />
          </View>
          )
        }}
        defaultStrokeIndex={0}
        defaultStrokeWidth={5}
        saveComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Save</Text></View>}
        savePreference={() => {
          return {
            folder: 'RNSketchCanvas',
            filename: String(Math.ceil(Math.random() * 100000000)),
            transparent: true,
            imageType: 'jpg'
          }
        }}
        onStrokeEnd={(e) => {
          console.log(e.nativeEvent.color)
          b().addPath(e.nativeEvent)
        }}
      />
      <RNSketchCanvas
        {...context.canvas}
        ref={_b}
        user={'user2'}
        containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
        canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
        undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
        onUndoPressed={(id) => {
          a().deletePath(id)
        }}
        clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
        onClearPressed={() => {
          a().clear()
        }}
        eraseComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Eraser</Text></View>}
        strokeComponent={color => (
          <View style={[{ backgroundColor: color }, styles.strokeColorButton]} />
        )}
        strokeSelectedComponent={(color, index, changed) => {
          return (
            <View style={[{ backgroundColor: color, borderWidth: 2 }, styles.strokeColorButton]} />
          )
        }}
        strokeWidthComponent={(w) => {
          return (<View style={styles.strokeWidthButton}>
            <View style={{
              backgroundColor: 'white', marginHorizontal: 2.5,
              width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2
            }} />
          </View>
          )
        }}
        defaultStrokeIndex={0}
        defaultStrokeWidth={5}
        saveComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Save</Text></View>}
        savePreference={() => {
          return {
            folder: 'RNSketchCanvas',
            filename: String(Math.ceil(Math.random() * 100000000)),
            transparent: true,
            imageType: 'jpg'
          }
        }}
        onStrokeEnd={(e) => {
          a().addPath(e.nativeEvent)
        }}
      />
    </View>
  )
}