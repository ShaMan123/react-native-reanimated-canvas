

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { styles } from './common';
import LegacyCanvas from './LegacyCanvas';

export default function Example() {
  const ref = useRef();
  const refs = useMemo(() => new Array(5).map((v, i) => React.createRef()), [])
  const renderItem = useCallback(({ item, index }: { item: React.RefObject<any>, index: number }) => {
    const useNativeDriver = index === 0;
    return (
      <LegacyCanvas
        containerStyle={styles.page}
        ref={item}
        //waitFor={ref}
        //activeOffsetY={1}
        shouldCancelWhenOutside
      >
      </LegacyCanvas>
    );
  }, [ref]);

  return (
    <FlatList
      style={styles.default}
      data={refs}
      renderItem={renderItem}
      keyExtractor={(item, index) => `WilliWoonka${index}`}
      renderScrollComponent={(props) => <ScrollView {...props} ref={ref} waitFor={refs} />}
      ListHeaderComponent={<Text>swipe 2 fingers to scroll</Text>}
    />
  );

}