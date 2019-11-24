
import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { RAnimatedCanvasModule, generatePathId, RCanvasRef } from 'react-native-reanimated-canvas';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useRefGetter } from './common';
import _ from 'lodash';
const { cond, eq, sub, add, divide, abs, call, set, Value, event, concat, timing, color, modulo, invoke, dispatch, diff, useCode, lessThan, greaterThan, or, Code, map, callback, round, neq, createAnimatedComponent, Text, View, ScrollView, and, proc, Clock, multiply, onChange, not, defined, clockRunning, block, startClock, stopClock, spring } = Animated;


export default function SyncedCanvases() {
  const tagB = useMemo(() => new Value(0), []);
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b, b] = useRefGetter<RCanvasRef>();

  const onStrokeStartA = useMemo(() =>
    event([{
      nativeEvent: ({ x, y, id, width, color }) => RAnimatedCanvasModule.startPath(tagB, id, color, width, x, y)
    }]),
    [tagB]
  );

  const onStrokeA = useMemo(() =>
    event([{
      nativeEvent: ({ x, y, id }) => RAnimatedCanvasModule.addPoint(tagB, id, x, y)
    }]),
    [tagB]
  );

  const onStrokeEndA = useMemo(() =>
    event([{
      nativeEvent: ({ id }) => RAnimatedCanvasModule.endPath(tagB, id)
    }]),
    [tagB]
  );

  return (
    <View style={styles.container}>
      <RNSketchCanvas
        ref={_a}
        onStrokeStart={onStrokeStartA}
        onStrokeChange={onStrokeA}
        onStrokeEnd={onStrokeEndA}
      />
      <RNSketchCanvas
        onLayout={(e) => tagB.setValue(e.nativeEvent.target)}
        ref={_b}
        onStrokeEnd={(e) => {
          a().addPath(_.set(e.nativeEvent, 'id', generatePathId()));
        }}
      />
    </View>
  )
}