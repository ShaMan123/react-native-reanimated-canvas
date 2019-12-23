
import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';

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

export const styles = StyleSheet.create({
  default: {
    flex: 1
  },
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
    //elevation: 5 // causes the button to be above the canvas
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
    textAlign: 'center',
    borderWidth: 2,
    margin: 15,
    backgroundColor: 'rgba(255,255,255,0.6)'
  },
  abs100: {
    ...StyleSheet.absoluteFillObject,
    top: 100
  },
  flexStart: { flexDirection: 'row', flex: 1, justifyContent: 'flex-start' },
  flexEnd: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
  row: { flexDirection: 'row' },
  util: {
    position: 'absolute',
    top: 0,
  },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  caption: { minHeight: 50, textAlign: 'center', textAlignVertical: 'center' }
});
