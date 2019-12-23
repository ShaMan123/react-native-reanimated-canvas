
import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { RACanvasModule, RCanvasRef, StrokeEndEvent, StrokeEvent, StrokeStartEvent } from 'react-native-reanimated-canvas';
import { styles, useRefGetter } from './common';
import LegacyCanvas from './LegacyCanvas';
import { concat } from 'lodash';
const { Value, event, View, cond, neq, block, and, set, eq, debug, onChange } = Animated;


export default function SyncedCanvases() {
  const tagB = useMemo(() => new Value(0), []);
  const currentId = useMemo(() => new Value(-1), []);
  const [_a, a] = useRefGetter<RCanvasRef>();
  const [_b, b] = useRefGetter<RCanvasRef>();

  const onStrokeStartA = useMemo(() =>
    event<StrokeStartEvent>([{
      nativeEvent: ({ id, strokeColor, strokeWidth }) =>
        onChange(id,
          cond(
            neq(id, 0),
            [
              set(currentId, id),
              RACanvasModule.alloc(tagB, currentId, strokeColor, strokeWidth),
            ]
          )
        )
    }]),
    []
  );

  const onStrokeA = useMemo(() =>
    event<StrokeEvent>([{
      nativeEvent: ({ x, y, id }) => block([
        cond(and(eq(currentId, id), neq(id, -1)), RACanvasModule.drawPoint(tagB, id, x, y))
      ])
    }]),
    []
  );

  const onStrokeEndA = useMemo(() =>
    event<StrokeEndEvent>([{
      nativeEvent: {
        id: id => block([
          cond(neq(id, 0), RACanvasModule.endInteraction(tagB, id)),
          set(currentId, -1)
        ])
      }
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
        onLayout={(e) => {
          tagB.setValue(e.nativeEvent.target);
        }}
        ref={_b}
        onStrokeEnd={(e) => {
          const path = e.nativeEvent;
          const has = a().getPaths().findIndex((p) => p.id === path.id) > -1;
          //console.log(a().getPaths().map(({ id }) => id), b().getPaths().map(({ id }) => id), has)
          //a().startPath(0, 0);
          //a().addPoint(500, 11)
          //a().endPath();
          //b().setPathAttributes(path.id, { width: path.width * 1.5, /*color: processColor('red')*/ });
        }}
      />
    </View>
  )
}