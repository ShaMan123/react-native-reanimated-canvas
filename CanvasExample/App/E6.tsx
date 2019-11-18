
import React from 'react';
import { Text, View } from 'react-native';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Example() {
  const context = useCanvasContext();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <RNSketchCanvas
        {...context.canvas}
        text={[
          { text: 'Welcome to my GitHub', font: 'fonts/IndieFlower.ttf', fontSize: 30, position: { x: 0, y: 0 }, anchor: { x: 0, y: 0 }, coordinate: 'Absolute', fontColor: 'red' },
          { text: 'Center\nMULTILINE', fontSize: 25, position: { x: 0.5, y: 0.5 }, anchor: { x: 0.5, y: 0.5 }, coordinate: 'Ratio', overlay: 'SketchOnText', fontColor: 'black', alignment: 'Center', lineHeightMultiple: 1 },
          { text: 'Right\nMULTILINE', fontSize: 25, position: { x: 1, y: 0.25 }, anchor: { x: 1, y: 0.5 }, coordinate: 'Ratio', overlay: 'TextOnSketch', fontColor: 'black', alignment: 'Right', lineHeightMultiple: 1 },
          { text: 'Signature', font: 'Zapfino', fontSize: 40, position: { x: 0, y: 1 }, anchor: { x: 0, y: 1 }, coordinate: 'Ratio', overlay: 'TextOnSketch', fontColor: '#444444' }
        ]}
        containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
        canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
        closeComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View>}
        undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
        clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
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
            includeImage: false,
            includeText: true,
            cropToImageSize: false,
            imageType: 'jpg'
          }
        }}

      />
    </View>
  )
}