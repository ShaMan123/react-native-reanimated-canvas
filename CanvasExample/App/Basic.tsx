
import React, { useRef } from 'react';
import LegacyCanvas from './LegacyCanvas';
import { TapGestureHandler, BorderlessButton, LongPressGestureHandler } from 'react-native-gesture-handler';
import { styles } from './common';
import Animated from 'react-native-reanimated';
const { View } = Animated;


export default function Basic() {
  const tap = useRef();
  const button = useRef();
  const longPress = useRef();
  return (
    <TapGestureHandler
      ref={tap}
      waitFor={[button, longPress]}
      onHandlerStateChange={e => console.log(e.nativeEvent)}
    //enabled={false}
    >
      <View collapsable={false} style={styles.default}>
        <LongPressGestureHandler
          onHandlerStateChange={e => console.log('long', e.nativeEvent)}
          waitFor={button}
        >
          <BorderlessButton
            style={styles.default}
            ref={button}
          >
            <LegacyCanvas canvasStyle={{ flex: 1, backgroundColor: 'red' }} />
          </BorderlessButton>
        </LongPressGestureHandler>

      </View>

    </TapGestureHandler>

  )
}