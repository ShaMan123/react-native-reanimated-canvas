

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { styles } from './common';
import RNSketchCanvas from './RNSketchCanvas';

export default function Example() {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [defaultScroll, setScroller] = useState(false);
  const onStrokeStart = useCallback(() => defaultScroll && setScrollEnabled(false), [defaultScroll, setScrollEnabled]);
  const onStrokeEnd = useCallback(() => defaultScroll && setScrollEnabled(true), [defaultScroll, setScrollEnabled]);
  const ref = useRef();
  const refs = useMemo(() => new Array(5).map((v, i) => React.createRef()), [])
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
      data={refs}
      renderItem={renderItem}
      keyExtractor={(item, index) => `WilliWoonka${index}`}
      renderScrollComponent={(props) => <ScrollView {...props} ref={ref} simultaneousHandlers={refs} />}
    />
  );

}