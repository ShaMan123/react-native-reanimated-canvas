
import React, { useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, StyleSheet, ToastAndroid } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import LegacyCanvas from './LegacyCanvas';
import { styles } from './common';
const { cond, sub, add, divide, abs, set, Value, timing, color, modulo, useCode, lessThan, round, Text, View, Clock, multiply, not, clockRunning, block, startClock } = Animated;

function runTimingLoop(clock: Animated.Clock, value: Animated.Adaptable<number>, dest: Animated.Adaptable<number>) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  };

  const config = {
    toValue: new Value(0),
    duration: 2500,
    easing: Easing.linear,
  };

  const reset = [
    set(state.finished, 0),
    set(state.frameTime, 0),
    set(state.time, 0),
    set(state.position, not(value)),
    set(config.toValue, dest),
    startClock(clock),
  ]

  return [
    cond(clockRunning(clock), 0, reset),
    timing(clock, state, config),
    cond(state.finished, reset),
    state.position,
  ];
}

function match(condsAndResPairs, offset = 0) {
  if (condsAndResPairs.length - offset === 1) {
    return condsAndResPairs[offset];
  } else if (condsAndResPairs.length - offset === 0) {
    return undefined;
  }
  return cond(
    condsAndResPairs[offset],
    condsAndResPairs[offset + 1],
    match(condsAndResPairs, offset + 2)
  );
}

export function colorHSV(h /* 0 - 360 */, s /* 0 - 1 */, v /* 0 - 1 */) {
  // Converts color from HSV format into RGB
  // Formula explained here: https://www.rapidtables.com/convert/color/hsv-to-rgb.html
  const c = multiply(v, s);
  const hh = divide(h, 60);
  const x = multiply(c, sub(1, abs(sub(modulo(hh, 2), 1))));

  const m = sub(v, c);

  const colorRGB = (r, g, b) =>
    color(
      round(multiply(255, add(r, m))),
      round(multiply(255, add(g, m))),
      round(multiply(255, add(b, m)))
    );

  return match([
    lessThan(h, 60),
    colorRGB(c, x, 0),
    lessThan(h, 120),
    colorRGB(x, c, 0),
    lessThan(h, 180),
    colorRGB(0, c, x),
    lessThan(h, 240),
    colorRGB(0, x, c),
    lessThan(h, 300),
    colorRGB(x, 0, c),
    colorRGB(c, 0, x) /* else */,
  ]);
}

function useColor() {
  const animator = useMemo(() => new Value(1), []);
  const dest = useMemo(() => multiply(animator, 360), [animator]);
  const colorHue = useMemo(() => new Value(0), []);
  const clock = useMemo(() => new Clock(), []);
  const color = useMemo(() => colorHSV(colorHue, 0.9, 1), [colorHue]);

  useCode(() =>
    block([
      set(colorHue, runTimingLoop(clock, colorHue, dest)),
    ]),
    [colorHue, clock, dest, animator]
  );

  return color;
}

const simpsonsImage = 'https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/50/1512996015-simpsons.jpg?crop=0.718xw:1.00xh;0.156xw,0&resize=480:*';

function HelloSimpsons({ animate }: { animate?: boolean }) {
  const color = useColor();
  return (
    <View
      style={[styles.abs100]}
      pointerEvents='none'
      renderToHardwareTextureAndroid
    >
      <Text
        style={[styles.text, animate && { color, borderColor: color }]}
      >
        The Simpsons
          </Text>
    </View>
  )
}


export default function Variety() {
  const ref = useRef();
  const [animate, setAnimate] = useState(true);

  return (
    <View style={styles.container} renderToHardwareTextureAndroid>
      <ImageBackground
        source={{ uri: simpsonsImage }}
        style={styles.default}
      >
        <LegacyCanvas
          defaultStrokeWidth={25}
          strokeColor='#00000000'
          waitFor={ref}
          renderToHardwareTextureAndroid
        >
          <View style={styles.default} renderToHardwareTextureAndroid>
            <Image source={{ uri: simpsonsImage }} style={[styles.default, styles.centerContent]} />
            <View style={styles.abs100}>
              <HelloSimpsons animate={animate} />
            </View>
            <Text
              style={{ elevation: 5, maxHeight: 20, backgroundColor: 'pink', textAlign: 'center', opacity: 0.75 }}
            >
              I'm elevated. I should be erasable, shouldn't I?
            </Text>
            <RectButton
              ref={ref}
              rippleColor="red"
              style={[styles.functionButton, StyleSheet.absoluteFill, { width: 200, top: 50 }, { alignContent: 'center' }]}
              onPress={() => {
                ToastAndroid.show(
                  !animate ?
                    'Notice fps -> use hardwareAccelerated' :
                    'I\'m pressed, are you impressed? Try erasing me',
                  2500
                );
                setAnimate(!animate)
              }}>
              <Text style={[{ color: 'white' }]}>{!animate ? `Animate Text` : `Stop Animation`}</Text>
            </RectButton>
          </View>

        </LegacyCanvas>
        <HelloSimpsons animate />
      </ImageBackground>
    </View>
  )
}