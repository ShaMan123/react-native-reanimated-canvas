
import React, { useRef, useMemo, useEffect, useState } from 'react';
import LegacyCanvas from './LegacyCanvas';
import { TapGestureHandler, BorderlessButton, LongPressGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import { styles } from './common';
import Animated, { Easing } from 'react-native-reanimated';
import { RCanvasPath, RAnimatedCanvasModule, RCanvasModule, PathIntersectionResponse } from 'react-native-reanimated-canvas';
import { UIManager } from 'react-native';
const { View, cond, not, set, sub, greaterOrEq, block, and, clockRunning, startClock, stopClock, debug, spring, Value, useCode, Clock, round, onChange, timing, min, event, neq, call, invoke, callback, map, DirectManipulationHelper, intercept } = Animated;

function runSpring(clock: Animated.Clock, value: Animated.Adaptable<number>, dest: Animated.Adaptable<number>) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };

  const config = {
    toValue: new Value(0),
    damping: 10,
    mass: 5,
    stiffness: 101.6,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.velocity, 0),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    spring(clock, state, config),
    cond(state.finished, debug('stop clock', stopClock(clock))),
    state.position,
  ]);
}

function runTiming(clock: Animated.Clock, value: Animated.Adaptable<number>, dest: Animated.Adaptable<number>) {
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
    set(state.position, value),
    set(config.toValue, dest),
    startClock(clock),
  ]

  return [
    cond(clockRunning(clock), 0, reset),
    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ];
}

export default function Basic() {
  const tap = useRef();
  const button = useRef();
  const longPress = useRef();
  const clock = useMemo(() => new Clock(), []);
  const delayClock = useMemo(() => new Clock(), []);
  const animator = useMemo(() => new Value(0), []);
  const points = useMemo(() => new Array(200).fill(0).map((v, i) => ({ x: i, y: i })), []);
  const index = useMemo(() => min(round(animator), points.length - 1), [animator, points]);
  const tag = useMemo(() => new Value(0), []);
  const path = useMemo(() => new Value(0), []);
  const error = useMemo(() => new Value(), []);
  const delayClockStart = useMemo(() => new Value(0), []);
  const runDraw = useMemo(() => new Value(0), []);

  const x = useMemo(() => new Value(0), []);
  const y = useMemo(() => new Value(0), []);

  const [pip, setPip] = useState(0);

  const onTap = useMemo(() =>
    event<TapGestureHandlerStateChangeEvent>([{
      nativeEvent: { x, y }
    }]),
    [x, y]
  );

  useCode(() =>
    block([
      cond(
        not(clockRunning(delayClock)),
        [
          startClock(delayClock),
          set(delayClockStart, delayClock)
        ]
      ),
      cond(
        greaterOrEq(sub(delayClock, delayClockStart), 1500),
        [
          set(runDraw, 1),
          stopClock(delayClock)
        ]
      )
    ]),
    [delayClock]
  );

  useCode(() =>
    block([
      cond(
        and(neq(tag, 0), runDraw),
        set(animator, runSpring(clock, animator, points.length - 1))
      )
    ]),
    [clock, animator, points, runDraw]
  );

  const width = useMemo(() => new Value(0), []);
  useCode(() =>
    block([
      //RAnimatedCanvasModule.isPointOnPath(tag, x, y, path, error),
      intercept('didUpdateDimensions', { windowPhysicalPixels: { width } }),
      call([path, width], console.log)
    ]),
    [tag, x, y]
  );

  return (
    <TapGestureHandler
      ref={tap}
      waitFor={[button, longPress]}
      onHandlerStateChange={onTap}
    //enabled={false}
    >
      <View collapsable={false} style={styles.default}>
        <LongPressGestureHandler
          waitFor={button}
          //enabled={false}
          onHandlerStateChange={onTap}
        >
          <View collapsable={false} style={styles.default}>
            <BorderlessButton
              style={styles.default}
              ref={button}
            >
              <LegacyCanvas
                onLayout={(e) => {
                  tag.setValue(e.nativeEvent.target)
                  setPip(e.nativeEvent.target)
                }}
                defaultStrokeWidth={20}
              >
                <RCanvasPath
                  points={points}
                  strokeWidth={20}
                  strokeColor='pink'
                  animate
                  index={index}
                />
                <RCanvasPath
                  points={points.slice(50, 150)}
                  strokeWidth={20}
                  strokeColor='blue'
                  animate
                  index={min(index, 99)}
                />
              </LegacyCanvas>
            </BorderlessButton>
          </View>
        </LongPressGestureHandler>

      </View>

    </TapGestureHandler >

  )
}