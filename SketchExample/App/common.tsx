/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component, useCallback, useState, useRef, useReducer, useContext } from 'react';
import {
  Alert, AppRegistry, Button, Image, Modal, Platform,
  //TouchableOpacity,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import RCanvas from 'react-native-reanimated-canvas';
import RNSketchCanvas from '../App/RNSketchCanvas';
import Example8 from './Example8';
import Animated from 'react-native-reanimated';


export function useCamera(camera: any, onSuccess: (uri: string) => void) {
  const takePictureAsync = useCallback(async () => {
    if (camera) {
      const options = { quality: 0.5, base64: true };
      const data = await camera.takePictureAsync(options);
      onSuccess(data.uri.replace('file://', ''));
    } else {
      throw new Error('no camera');
    }
  }, [])

  return takePictureAsync;
};

export function useSaveCanvas(setURI: (uri: string) => void) {
  const cb = useCallback((e) => {
    console.log(e.nativeEvent)
    const { success, path } = e.nativeEvent;
    Alert.alert(success ? 'Image saved!' : 'Failed to save image!', path);
    if (success) {
      setURI(path);
    }
  }, []);

  return cb;
}

export function ImageModal(props: { uri: string, visible: boolean, onClose: () => void }) {
  const uri = `file://${props.uri}`;
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={props.visible}
      onRequestClose={props.onClose}
    >
      <View style={{ marginTop: 22 }}>
        <Text>Displaying image: {uri}</Text>
        <Image
          source={{ uri }}
          style={{ width: 200, height: 200 }}
        />
        <Button
          title="close"
          onPress={props.onClose}
        />
      </View>
    </Modal>
  );
}

const initialState = {
  example: 0,
  color: '#FF0000',
  thickness: 5,
  message: '',
  photoPath: "",
  scrollEnabled: true,
  touchState: 'draw',
  modalVisible: false,
  uri: ""
}

export function useCanvasReducer() {
  const [reducer, dispatch] = useReducer((nextState, action) => nextState, initialState);

}

const Context = React.createContext({
  state: initialState,
  dispatch: (updates: Partial<typeof initialState>) => { }
});

export default function CommonExample(props) {
  const { state, dispatch } = useContext(Context);
  const onSave = useSaveCanvas((uri) => dispatch({ uri }));
  const camera = useRef();
  const takePicture = useCamera(camera, (uri) => dispatch({ photoPath: uri }));

  return (
    <>
      <
      <ImageModal
        uri={state.uri}
        visible={state.modalVisible}
        onClose={() => dispatch({ modalVisible: false })}
      />
      {props.children}
    </>
  )
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  strokeColorButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  strokeWidthButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#39579A'
  },
  functionButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    height: 30,
    width: 60,
    backgroundColor: '#39579A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    alignSelf: 'stretch'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20
  },
  page: {
    flex: 1,
    height: 300,
    elevation: 2,
    marginVertical: 8,
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 2
  }
});
