
import React, { useEffect, useMemo, useRef, useState } from 'react';
import CanvasBase, { RCanvasPath, RCanvasRef, useCanvasPanResponder, useCanvasGestureHandler } from 'react-native-reanimated-canvas/base';
import LegacyCanvas from './LegacyCanvas';
import { styles } from './common';
import { View, Text } from 'react-native';
import { PanGestureHandler, RectButton } from 'react-native-gesture-handler';


export default function CustomTouchHandling(props: any) {
  const refA = useRef<RCanvasRef>();
  const refB = useRef<RCanvasRef>();
  const refC = useRef<RCanvasRef>();
  const [show, setShow] = useState(true);
  useEffect(() => {
    const p = setTimeout(() => {
      setShow(!show);
    }, 2500);
    return () => clearImmediate(p);
  }, []);

  const [gh, ghGo] = useState(false);

  const points = useMemo(() => new Array(200).fill(0).map((v, i) => ({ x: i, y: i })), []);

  const base = (
    <CanvasBase
      style={styles.default}
      defaultStrokeWidth={20}
      hitSlop={20}
    >
      <RCanvasPath
        points={points}
        strokeWidth={20}
        strokeColor='pink'
      />
      {
        show &&
        <RCanvasPath
          points={points.slice(50, 150)}
          strokeWidth={20}
          strokeColor='blue'
        />
      }
    </CanvasBase>
  );

  const PRElements = (
    <View style={styles.container}>
      {React.cloneElement(base, { ref: refA, ...useCanvasPanResponder(true, refB) })}
      {React.cloneElement(base, { ref: refB, ...useCanvasPanResponder(true, refA) })}
    </View>
  );

  const GHElements = (
    <View style={styles.container}>
      <PanGestureHandler
        {...useCanvasGestureHandler({ enabled: true }, refB)}
      >
        {React.cloneElement(base, { ref: refA })}
      </PanGestureHandler>
      <PanGestureHandler
        {...useCanvasGestureHandler({ enabled: true }, refA)}
      >
        {React.cloneElement(base, { ref: refB })}
      </PanGestureHandler>
    </View>
  );

  return (
    <>
      {gh ? GHElements : PRElements}
      <RectButton onPress={() => ghGo(!gh)} rippleColor="blue">
        <Text style={{ minHeight: 50, textAlign: 'center', textAlignVertical: 'center' }}>{`Change to ${gh ? 'PanResponder' : 'PanGestureHandler'} Touch Handling`}</Text>
      </RectButton>
    </>
  )
}