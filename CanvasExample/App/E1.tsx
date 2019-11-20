
import React from 'react';
import { Text, View } from 'react-native';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { useCanvasContext, styles } from './common';


export default function Example() {
  const context = useCanvasContext();
  return (
    <RNSketchCanvas
      {...context.canvas}
      containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
      canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
      closeComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View>}
      undoComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Undo</Text></View>}
      onUndoPressed={(id) => {
        // Alert.alert('do something')
      }}
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
          folder: "RNSketchCanvas",
          filename: String(Math.ceil(Math.random() * 100000000)),
          transparent: false,
          imageType: "png"
        }
      }}
      onPathsChange={({ nativeEvent: { pathsCount } }) => {
        console.log('pathsCount', pathsCount)
      }}
    />
  )
}