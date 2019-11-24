
import React from 'react';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Example() {
  const context = useCanvasContext();

  console.log(context.state)
  return (
    context.state.photoPath === "" ?
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={context.camera.ref}
          style={styles.preview}
          type="back"
          flashMode="auto"
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera phone',
          }}
          captureAudio={false}
          trackingEnabled
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center', }}>
          <TouchableOpacity
            onPress={() => context.camera.takePicture()}
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
        >
          <Image source={{ uri: context.state.photoPath }} />
        </RNSketchCanvas>
      </View>
  );
}