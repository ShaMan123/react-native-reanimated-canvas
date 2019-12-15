
import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { RAnimatedCanvasModule, generatePathId, RCanvasRef, StrokeEndEvent, StrokeStartEvent, StrokeEvent } from 'react-native-reanimated-canvas';
import LegacyCanvas from './LegacyCanvas';
import { styles, useRefGetter } from './common';
import _ from 'lodash';
const { Value, event, View } = Animated;


export default function SyncedCanvases() {
  const tagB = useMemo(() => new Value(0), []);
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b] = useRefGetter<RCanvasRef>();

  const onStrokeStartA = useMemo(() =>
    event<StrokeStartEvent>([{
      nativeEvent: ({ id, width, color }) => RAnimatedCanvasModule.startPath(tagB, id, color, width)
    }]),
    [tagB]
  );

  const onStrokeA = useMemo(() =>
    event<StrokeEvent>([{
      nativeEvent: ({ x, y, id }) => RAnimatedCanvasModule.addPoint(tagB, id, x, y)
    }]),
    [tagB]
  );

  const onStrokeEndA = useMemo(() =>
    event<StrokeEndEvent>([{
      nativeEvent: ({ id }) => RAnimatedCanvasModule.endPath(tagB, id)
    }]),
    [tagB]
  );

  return (
    <View style={styles.container}>
      <LegacyCanvas
        ref={_a}
        onStrokeStart={onStrokeStartA}
        onStrokeChange={onStrokeA}
        onStrokeEnd={onStrokeEndA}
      />
      <LegacyCanvas
        onLayout={(e) => tagB.setValue(e.nativeEvent.target)}
        ref={_b}
        onStrokeEnd={(e) => {
          const path = e.nativeEvent;
          console.log(_a.current.addPath)
          _a.current.addPath(_.set(path, 'id', generatePathId()));
          path.id.includes('RCanvasPath') && a().addPaths([_.set(path, 'id', generatePathId())]);
        }}
      />
    </View>
  )
}