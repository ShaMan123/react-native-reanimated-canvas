
import React, { MutableRefObject, PropsWithChildren, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { Alert, Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { RCanvasRef } from '../../src/types';


export async function takePicture(camera: MutableRefObject<any>, onSuccess: (uri: string) => void) {
  if (camera.current) {
    const options = { quality: 0.5, base64: true };
    const data = await camera.current.takePictureAsync(options);
    onSuccess(data.uri.replace('file://', ''));
  } else {
    throw new Error('no camera');
  }
};

export function saveCanvasEventBuilder(setURI: (uri: string) => void) {
  const cb = (e) => {
    console.log(e.nativeEvent)
    const { success, path } = e.nativeEvent;
    Alert.alert(success ? 'Image saved!' : 'Failed to save image!', path);
    if (success) {
      setURI(path);
    }
  };

  return cb;
}

export function useRefGetter<T, R = T>(initialValue?: T, action: (ref: T) => R = (current) => (current as unknown as R)) {
  const ref = useRef(initialValue);
  const getter = useCallback(() =>
    action(ref.current as T),
    [ref, action]
  );
  const defaultGetter = useCallback(() =>
    ref.current,
    [ref]
  );

  return [ref, getter, defaultGetter] as [typeof ref, typeof getter, typeof defaultGetter];
}

export function ImageModal() {
  const context = useCanvasContext();
  const close = useCallback(() => context.dispatch({ modalVisible: false }), [context]);
  const uri = `file://${context.state.uri}`;
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={context.state.modalVisible}
      onRequestClose={close}
    >
      <View style={{ marginTop: 22 }}>
        <Text>Displaying image: {uri}</Text>
        <Image
          source={{ uri }}
          style={{ width: 200, height: 200 }}
        />
        <Button
          title="close"
          onPress={close}
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
  return useReducer((nextState, action) => nextState, initialState);
}

const Context = React.createContext(null);

export function useCanvasContext() {
  const context = useContext(Context);
  if (context === null) {
    throw new Error('Failed to initialize App Context');
  }
  return context;
}

function useCanvasContextFactory() {
  const canvas = useRef();
  const camera = useRef();
  const [state, dispatch] = useCanvasReducer();
  return useMemo(() => ({
    state,
    dispatch,
    get _canvas() {
      return this.canvas.ref.current;
    },
    canvas: {
      ref: canvas
    },
    camera: {
      ref: camera,
      takePicture: () => {
        takePicture(camera, (uri) => dispatch({ photoPath: uri }))
      }
    }
  }), [state]);
}

export default function CommonExample({ children }: PropsWithChildren<any>) {
  const context = useCanvasContextFactory();
  return (
    <Context.Provider value={context}>
      <ImageModal />
      {children}
    </Context.Provider>
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
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'darkblue'
  },
  abs100: {
    ...StyleSheet.absoluteFillObject,
    top: 100
  }
});
