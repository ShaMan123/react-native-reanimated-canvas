
import React from 'react';
import { Text, View } from 'react-native';
import RCanvas from 'react-native-reanimated-canvas';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Example() {
  const context = useCanvasContext();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <RNSketchCanvas
        {...context.canvas}
        localSourceImage={{ filename: 'whale.png', directory: RCanvas.MAIN_BUNDLE, mode: 'AspectFit' }}
        // localSourceImage={{ filename: 'bulb.png', directory: RNSketchCanvas.MAIN_BUNDLE }}
        containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
        canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
        closeComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View>}
        undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
        clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
        onClearPressed={() => {
          // Alert.alert('do something')
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
            includeImage: true,
            cropToImageSize: false,
            imageType: 'jpg'
          }
        }}
      />
    </View>
  )
}