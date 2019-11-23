
import React, { useRef } from 'react';
import { Alert, Image, ImageBackground, Text, View, StyleSheet } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import RNSketchCanvas from '../App/RNSketchCanvas';
import { styles, useCanvasContext } from './common';


export default function Variety() {
  const context = useCanvasContext();
  const ref = useRef();

  return (
    <View style={styles.container}>
      <ImageBackground source={{ uri: 'https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/50/1512996015-simpsons.jpg?crop=0.718xw:1.00xh;0.156xw,0&resize=480:*' }} style={{ flex: 1 }}>
        <RNSketchCanvas
          {...context.canvas}
          containerStyle={{ backgroundColor: 'transparent', flex: 1 }}
          canvasStyle={{ backgroundColor: 'red', flex: 1 }}
          clearComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Clear</Text></View>}
          onClearPressed={() => {
            // Alert.alert('do something')
          }}
          eraseComponent={<View style={styles.functionButton}><Text style={{ color: 'white' }}>Eraser</Text></View>}
          strokeComponent={color => (
            <View style={[{ backgroundColor: color }, styles.strokeColorButton]} />
          )}
          strokeSelectedComponent={(color, index, changed) => {
            return (
              <View style={[{ backgroundColor: color, borderWidth: 2 }, styles.strokeColorButton]} />
            )
          }}
          strokeWidthComponent={(w) => {
            return (<View style={styles.strokeWidthButton}>
              <View style={{
                backgroundColor: 'white', marginHorizontal: 2.5,
                width: Math.sqrt(w / 3) * 10, height: Math.sqrt(w / 3) * 10, borderRadius: Math.sqrt(w / 3) * 10 / 2
              }} />
            </View>
            )
          }}
          defaultStrokeIndex={0}
          defaultStrokeWidth={5}
          waitFor={ref}
          strokeColor='transparent'
        >
          <Image source={{ uri: 'https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/50/1512996015-simpsons.jpg?crop=0.718xw:1.00xh;0.156xw,0&resize=480:*' }} style={{ flex: 1, width: 480, height: 480 }} />
          <Text style={[styles.text, styles.abs100]}>hello simpsons</Text>
          <RectButton
            ref={ref}
            style={[styles.functionButton, { backgroundColor: 'black', width: 90 }, StyleSheet.absoluteFill]}
            onPress={() => {
              Alert.alert('I\'m pressed, are you impressed? Try erasing me')
            }}>
            <Text style={{ color: 'white' }}>Get Paths</Text>
          </RectButton>
        </RNSketchCanvas>
        <View
          style={[styles.abs100]}
          pointerEvents='none'
        >
          <Text
            style={[styles.text]}
          >
            hello simpsons
          </Text>
        </View>
      </ImageBackground>
    </View>
  )
}