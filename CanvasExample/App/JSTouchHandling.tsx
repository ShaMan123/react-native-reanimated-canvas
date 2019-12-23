
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, processColor } from 'react-native';
import { PanGestureHandler, RectButton } from 'react-native-gesture-handler';
import CanvasBase, { RCanvasPath, RCanvasRef, useCanvasGestureHandler, useCanvasPanResponder, generatePathId } from 'react-native-reanimated-canvas/base';
import { styles } from './common';
import _ from 'lodash';

const points = new Array(200).fill(0).map((v, i) => ({ x: i, y: i }));

export default function CustomTouchHandling() {
  const refA = useRef<RCanvasRef>();
  const refB = useRef<RCanvasRef>();
  const refC = useRef<RCanvasRef>();
  const [show, setShow] = useState(true);
  const [mixed, setMixed] = useState(false);

  useEffect(() => {
    const p = setTimeout(() => {
      setShow(!show);
    }, 2500);
    return () => clearImmediate(p);
  }, []);

  const [gh, ghGo] = useState(false);


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
      {React.cloneElement(base, { ref: refA, ...useCanvasPanResponder(true, mixed ? refB : refA) })}
      {React.cloneElement(base, { ref: refB, ...useCanvasPanResponder(true, mixed ? refA : refB) })}
    </View>
  );

  const GHElements = (
    <View style={styles.container}>
      <PanGestureHandler
        {...useCanvasGestureHandler({ enabled: true }, mixed ? refB : refA)}
      >
        {React.cloneElement(base, { ref: refA })}
      </PanGestureHandler>
      <PanGestureHandler
        {...useCanvasGestureHandler({ enabled: true }, mixed ? refA : refB)}
      >
        {React.cloneElement(base, { ref: refB })}
      </PanGestureHandler>
    </View>
  );

  return (
    <>
      {gh ? GHElements : PRElements}
      <RectButton onPress={() => ghGo(!gh)} rippleColor="blue">
        <Text style={styles.caption}>{`Change to ${gh ? 'PanResponder' : 'PanGestureHandler'} Touch Handling`}</Text>
      </RectButton>
      <RectButton onPress={() => setMixed(!mixed)} rippleColor="blue">
        <Text style={styles.caption}>{mixed ? 'RESTORE' : 'MIX UP'}</Text>
      </RectButton>
    </>
  )
}

