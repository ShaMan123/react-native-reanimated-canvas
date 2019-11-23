

import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import RCanvas, { RCanvasModule } from 'react-native-reanimated-canvas';
import { styles, useCanvasContext } from './common';

export default function Example() {
  const context = useCanvasContext();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 36 }}
        scrollEnabled={context.state.scrollEnabled}
      >
        <RCanvas
          text={[
            { text: 'Page 1', position: { x: 20, y: 20 }, fontSize: Platform.select({ ios: 24, android: 48 }) },
            { text: 'Signature', font: Platform.select({ ios: 'Zapfino', android: 'fonts/IndieFlower.ttf' }), position: { x: 20, y: 220 }, fontSize: Platform.select({ ios: 24, android: 48 }), fontColor: 'red' }
          ]}
          localSourceImage={{ filename: 'whale.png', directory: RCanvasModule.MAIN_BUNDLE, mode: 'AspectFit' }}
          style={styles.page}
          onStrokeStart={() => context.dispatch({ scrollEnabled: false })}
          onStrokeEnd={() => context.dispatch({ scrollEnabled: true })}
        />
        <RCanvas
          text={[{ text: 'Page 2', position: { x: 0.95, y: 0.05 }, anchor: { x: 1, y: 0 }, coordinate: 'Ratio', fontSize: Platform.select({ ios: 24, android: 48 }) }]}
          style={styles.page}
          onStrokeStart={() => context.dispatch({ scrollEnabled: false })}
          onStrokeEnd={() => context.dispatch({ scrollEnabled: true })}
        />
        <RCanvas
          text={[{ text: 'Page 3', position: { x: 0.5, y: 0.95 }, anchor: { x: 0.5, y: 1 }, coordinate: 'Ratio', fontSize: Platform.select({ ios: 24, android: 48 }) }]}
          style={styles.page}
          onStrokeStart={() => context.dispatch({ scrollEnabled: false })}
          onStrokeEnd={() => context.dispatch({ scrollEnabled: true })}
        />
        <RCanvas
          text={[{ text: 'Page 4', position: { x: 20, y: 20 }, fontSize: Platform.select({ ios: 24, android: 48 }) }]}
          style={styles.page}
          onStrokeStart={() => context.dispatch({ scrollEnabled: false })}
          onStrokeEnd={() => context.dispatch({ scrollEnabled: true })}
        />
      </ScrollView>
    </View>
  )
}