import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import RCanvas, { RCanvasProperties, RCanvasRef } from 'react-native-reanimated-canvas';
import { styles } from './common';

const { divide, sqrt, multiply } = Animated;

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
      <RCanvas
        {...props}
        ref={_ref}
        style={props.canvasStyle}
        strokeColor={color + (color.length === 9 ? '' : alpha)}
        strokeWidth={strokeWidth}
      //useNativeDriver
      />
      <View
        style={[styles.util, styles.row]}
        pointerEvents="box-none"
      >
        <View style={styles.flexStart} pointerEvents="box-none">
          {props.eraseComponent && (
            <TouchableOpacity onPress={() => { setColor('#00000000') }}>
              {props.eraseComponent}
            </TouchableOpacity>)
          }
        </View>
        <View style={styles.flexEnd} pointerEvents="box-none">
          <TouchableOpacity onPress={() => nextStrokeWidth()}>
            <StrokeWidthButton strokeWidth={strokeWidth} />
          </TouchableOpacity>

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

      <View style={styles.row}>
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
    //console.log('paths', nativeEvent.paths);
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
} as RCanvasProperties;

function StrokeWidthButton({ strokeWidth }: { strokeWidth: Animated.Adaptable<number> }) {
  const value = useMemo(() => multiply(sqrt(divide(strokeWidth, 3)), 10), [strokeWidth]);

  return (
    <View style={styles.strokeWidthButton}>
      <Animated.View
        style={{
          backgroundColor: 'white',
          marginHorizontal: 2.5,
          width: value, height: value, borderRadius: multiply(value, 0.5)
        }}
      />
    </View>
  )
}

export default LegacyCanvas;