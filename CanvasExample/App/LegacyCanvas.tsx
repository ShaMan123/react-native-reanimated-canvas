import React, { Component, forwardRef, useCallback, useState, useRef, useImperativeHandle, useEffect } from 'react';
import { FlatList, View, processColor, Text } from 'react-native';
import RCanvas, { RCanvasProperties, RCanvasRef } from 'react-native-reanimated-canvas';
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler';
import { styles } from './common';


function LegacyCanvasBase(props: any, ref: React.Ref<RCanvasRef>) {
  const [color, setColor] = useState(props.strokeColor || props.strokeColors[props.defaultStrokeIndex].color);
  const [strokeWidth, setStrokeWidth] = useState(props.defaultStrokeWidth);
  const [alpha, setAlpha] = useState('FF');
  const alphaStep = useRef(-1);
  const strokeWidthStep = useRef(-1);

  const _ref = useRef();
  useImperativeHandle(ref, () => _ref.current);

  const nextStrokeWidth = useCallback(() => {
    if ((strokeWidth >= props.maxStrokeWidth && strokeWidthStep.current > 0) ||
      (strokeWidth <= props.minStrokeWidth && strokeWidthStep.current < 0))
      strokeWidthStep.current = -strokeWidthStep.current
    setStrokeWidth(strokeWidth + strokeWidthStep.current);
  }, [props]);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableOpacity style={{ marginHorizontal: 2.5 }} onPress={() => {
      if (color === item.color) {
        const index = props.alphlaValues.indexOf(alpha)
        if (alphaStep.current < 0) {
          alphaStep.current = index === 0 ? 1 : -1
          setAlpha(props.alphlaValues[index + alphaStep.current]);
        } else {
          alphaStep.current = index === props.alphlaValues.length - 1 ? -1 : 1
          setAlpha(props.alphlaValues[index + alphaStep.current]);
        }
      } else {
        setColor(item.color);
      }
    }}>
      {color !== item.color && props.strokeComponent && props.strokeComponent(item.color)}
      {color === item.color && props.strokeSelectedComponent && props.strokeSelectedComponent(item.color + alpha, index)}
    </TouchableOpacity>
  ), [props, color, strokeWidth, alpha]);

  return (
    <View style={props.containerStyle}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-start' }}>
          {props.eraseComponent && (
            <TouchableOpacity onPress={() => { setColor('#00000000') }}>
              {props.eraseComponent}
            </TouchableOpacity>)
          }
        </View>
        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end' }}>
          {props.strokeWidthComponent && (
            <TouchableOpacity onPress={() => nextStrokeWidth()}>
              {props.strokeWidthComponent(strokeWidth)}
            </TouchableOpacity>)
          }

          {props.clearComponent && (
            <TouchableOpacity onPress={() => {
              _ref.current.clear();
              props.onClearPressed()
            }}>
              {props.clearComponent}
            </TouchableOpacity>)
          }

        </View>
      </View>
      <RCanvas
        {...props}
        ref={_ref}
        style={props.canvasStyle}
        strokeColor={color + (color.length === 9 ? '' : alpha)}
        strokeWidth={strokeWidth}
      //useNativeDriver
      />
      <View style={{ flexDirection: 'row' }}>
        <FlatList
          data={props.strokeColors}
          keyExtractor={(item, index) => `@@@${index}`}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const LegacyCanvas = React.forwardRef(LegacyCanvasBase);
LegacyCanvas.defaultProps = {
  onStrokeStart: () => { },
  onStrokeChanged: () => { },
  onStrokeEnd: () => { },
  onClosePressed: () => { },
  onUndoPressed: () => { },
  onClearPressed: () => { },
  onPathsChange: ({ nativeEvent }) => {
    console.log('paths', nativeEvent.paths);
  },
  user: null,

  strokeColors: [
    { color: '#000000' },
    { color: '#FF0000' },
    { color: '#00FFFF' },
    { color: '#0000FF' },
    { color: '#0000A0' },
    { color: '#ADD8E6' },
    { color: '#800080' },
    { color: '#FFFF00' },
    { color: '#00FF00' },
    { color: '#FF00FF' },
    { color: '#FFFFFF' },
    { color: '#C0C0C0' },
    { color: '#808080' },
    { color: '#FFA500' },
    { color: '#A52A2A' },
    { color: '#800000' },
    { color: '#008000' },
    { color: '#808000' }],
  alphlaValues: ['33', '77', 'AA', 'FF'],
  defaultStrokeIndex: 0,
  defaultStrokeWidth: 5,

  minStrokeWidth: 3,
  maxStrokeWidth: 15,
  strokeWidthStep: 3,

  text: null,
  localSourceImage: null,

  permissionDialogTitle: '',
  permissionDialogMessage: '',

  containerStyle: styles.default,
  canvasStyle: styles.default,
  closeComponent: <View style={styles.functionButton}><Text style={{ color: 'white' }}>Close</Text></View >,
  clearComponent: <View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View >,
  eraseComponent: <View style={styles.functionButton}><Text style={{ color: 'white' }}>Eraser</Text></View >,
  strokeComponent: (color) => (
    <View style={[{ backgroundColor: color }, styles.strokeColorButton]} />
  ),
  strokeSelectedComponent: (color: string, index: number) => {
    return (
      <View style={[{ backgroundColor: color, borderWidth: 2 }, styles.strokeColorButton]} />
    )
  },
  strokeWidthComponent: (w) => {
    return (<View style={styles.strokeWidthButton}>
      <View style={{
        backgroundColor: 'white', marginHorizontal: 2.5,
        width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2
      }} />
    </View>
    )
  },

} as RCanvasProperties;

export default LegacyCanvas;