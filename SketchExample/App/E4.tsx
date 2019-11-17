
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Example() {
  const context = useCanvasContext();

  return (
    context.state.photoPath === "" ?
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={context.camera.ref}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          permissionDialogTitle={'Permission to use camera'}
          permissionDialogMessage={'We need your permission to use your camera phone'}
          captureAudio={false}
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center', }}>
          <TouchableOpacity
            onPress={context.camera.takePicture}
            style={styles.capture}
          >
            <Text style={{ fontSize: 14 }}> SNAP </Text>
          </TouchableOpacity>
        </View>
      </View>
      :
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <RNSketchCanvas
          {...context.canvas}
          localSourceImage={{ filename: context.state.photoPath, directory: null, mode: 'AspectFit' }}
          containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
          canvasStyle={{ backgroundColor: 'transparent', flex: 1 }}
          onStrokeEnd={data => {
          }}
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
              folder: 'RNSketchCanvas',
              filename: String(Math.ceil(Math.random() * 100000000)),
              transparent: false,
              imageType: 'png',
              transparent: false,
              includeImage: true,
              cropToImageSize: false,
            }
          }}
          onPathsChange={(pathsCount) => {
            console.log('pathsCount', pathsCount)
          }}
        />
      </View>
  );
}