

import React, { useRef } from 'react';
import { Text } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import RCanvas from 'react-native-reanimated-canvas';
import { styles } from './common';

export default function Example() {
  const ref = useRef();
  const panRef = useRef();

  return (
    <ScrollView
      style={styles.default}
      ref={ref}
      waitFor={panRef}
      stickyHeaderIndices={[0]}
    >
      <Text>swipe 2 fingers to scroll</Text>
      <RCanvas style={{ width: '100%', height: 2000 }} renderToHardwareTextureAndroid />
    </ScrollView>
  );

}