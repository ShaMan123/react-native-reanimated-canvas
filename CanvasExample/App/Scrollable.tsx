

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Platform, ScrollView as RNScrollView, View, Text, FlatList } from 'react-native';
import RCanvas, { RCanvasModule } from 'react-native-reanimated-canvas';
import { styles, useCanvasContext } from './common';
import { PanGestureHandler, ScrollView } from 'react-native-gesture-handler';
import RNSketchCanvas from './RNSketchCanvas';

export default function Example() {
  const context = useCanvasContext();
  const [defaultScroll, setScroller] = useState(false);
  const dispatchScroll = useCallback((value: boolean) => defaultScroll && context.dispatch({ scrollEnabled: value }), [defaultScroll]);
  const onStrokeStart = useCallback(() => dispatchScroll(false), [dispatchScroll]);
  const onStrokeEnd = useCallback(() => dispatchScroll(true), [dispatchScroll]);
  const ref = useRef();
  const data = useMemo(() => new Array(5).map((v, i) => React.createRef()), [])
  const renderItem = useCallback(({ item, index }: { item: React.RefObject<any>, index: number }) => {
    const useNativeDriver = index === 0;
    return (
      <RNSketchCanvas
        containerStyle={styles.page}
        useNativeDriver={useNativeDriver}
        ref={item}
        onStrokeStart={onStrokeStart}
        onStrokeEnd={onStrokeEnd}
        //waitFor={ref}
        //activeOffsetY={1}
        shouldCancelWhenOutside
      >
        <Text>{`Page ${index + 1}`}</Text>
        {useNativeDriver && <Text>useNativeDrive = true</Text>}
      </RNSketchCanvas>
    );
  }, [onStrokeStart, onStrokeEnd, ref]);

  return (
    <FlatList
      style={styles.default}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) => `WilliWoonka${index}`}
      renderScrollComponent={(props) => <ScrollView {...props} ref={ref} />}
    />
  );

}