
import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { RAnimatedCanvasModule, generatePathId, RCanvasRef, StrokeEndEvent, StrokeStartEvent, StrokeEvent } from 'react-native-reanimated-canvas';
import LegacyCanvas from './LegacyCanvas';
import { styles, useRefGetter } from './common';
import _ from 'lodash';
const { Value, event, View, cond, neq, block, and, set, eq, debug } = Animated;


export default function SyncedCanvases() {
  const tagB = useMemo(() => new Value(0), []);
  const currentId = useMemo(() => new Value(-1), []);
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b] = useRefGetter<RCanvasRef>();

  const onStrokeStartA = useMemo(() =>
    event<StrokeStartEvent>([{
      nativeEvent: ({ id, width, color }) => cond(
        neq(id, 0),
        [
          set(currentId, id),
          RAnimatedCanvasModule.startPath(tagB, currentId, color, width),
          debug('?????', currentId),

        ]
      )
    }]),
    []
  );

  const onStrokeA = useMemo(() =>
    event<StrokeEvent>([{
      nativeEvent: ({ x, y, id }) => block([
        debug('!!!!!!!!!!!!!', currentId),
        cond(and(eq(currentId, id), neq(id, -1)), RAnimatedCanvasModule.addPoint(tagB, currentId, x, y))
      ])
    }]),
    []
  );

  const onStrokeEndA = useMemo(() =>
    event<StrokeEndEvent>([{
      nativeEvent: ({ id }) => block([
        RAnimatedCanvasModule.endPath(tagB, id),
        set(currentId, -1)
      ])
    }]),
    []
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
          if (path.id.match('CanvasPath').length === 1) {
            //a().addPath(path);
          }
          //b().setPathAttributes(path.id, { width: path.width * 1.5, /*color: processColor('red')*/ });
        }}
      />
    </View>
  )
}