
import React, { useRef, useMemo, useEffect, useState } from 'react';
import LegacyCanvas from './LegacyCanvas';
import { TapGestureHandler, BorderlessButton, LongPressGestureHandler, TapGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import { styles } from './common';
import Animated, { Easing } from 'react-native-reanimated';
import { RCanvasPath, RAnimatedCanvasModule, RCanvasModule, PathIntersectionResponse, PathData } from 'react-native-reanimated-canvas';
import { UIManager, StatusBar } from 'react-native';
const { View, cond, eq, add, or, not, set, sub, greaterOrEq, greaterThan, block, and, clockRunning, startClock, stopClock, debug, spring, Value, useCode, Clock, round, onChange, timing, min, event, neq, call, invoke, callback, map, DirectManipulationHelper, intercept } = Animated;
//StatusBar.setHidden(true)
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

function runDelayed(node: Animated.Node<any>, delay: Animated.Adaptable<number> = 1500) {
  const delayClock = new Clock();
  const delayClockStart = new Value(0);
  return block([
    cond(
      not(clockRunning(delayClock)),
      [
        startClock(delayClock),
        set(delayClockStart, delayClock)
      ]
    ),
    cond(
      greaterOrEq(sub(delayClock, delayClockStart), delay),
      [
        node,
        stopClock(delayClock)
      ]
    )
  ])
}

export default function Basic() {
  const tap = useRef();
  const button = useRef();
  const longPress = useRef();
  const clock = useMemo(() => new Clock(), []);

  const [show, setShow] = useState(true);
  useEffect(() => {
    const p = setTimeout(() => {
      setShow(!show);
    }, 2500);
    return () => clearImmediate(p);
  }, [])

  const animator = useMemo(() => new Value(0), []);
  const points = useMemo(() => new Array(200).fill(0).map((v, i) => ({ x: i, y: i })), []);
  const index = useMemo(() => min(round(animator), points.length - 1), [animator, points]);
  const tag = useMemo(() => new Value(0), []);
  const path = useMemo(() => new Value(0), []);
  const error = useMemo(() => new Value(), []);

  const runDraw = useMemo(() => new Value(0), []);

  const x = useMemo(() => new Value(0), []);
  const y = useMemo(() => new Value(0), []);

  const strokeWidth = useMemo(() => new Value(0), []);
  const bip = useMemo(() => new Value(0), []);

  const [pip, setPip] = useState(0);

  const onTap = useMemo(() =>
    event<TapGestureHandlerStateChangeEvent>([{
      nativeEvent: ({ x: _x, y: _y, oldState }) => cond(
        eq(oldState, State.ACTIVE),
        [
          set(x, _x),
          set(y, _y),
          set(path, -1),
          set(bip, 0),
          set(strokeWidth, 0)
        ]
      )
    }]),
    [x, y]
  );

  useCode(() =>
    runDelayed(set(runDraw, 1)),
    [runDraw]
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
      RAnimatedCanvasModule.isPointOnPath(tag, x, y, path, error),

      intercept('didUpdateDimensions', { windowPhysicalPixels: { width } }),

      call([path, x, y], console.log)
    ]),
    [x, y]
  );

  useCode(() =>
    cond(
      and(neq(path, -1), neq(path, 0)),
      [
        onChange(
          path,
          cond(
            eq(bip, 0),
            RAnimatedCanvasModule.getPath(tag, path, callback<PathData>({ width: strokeWidth })),
          )
        ),
        onChange(
          strokeWidth,
          cond(
            greaterThan(strokeWidth, 0),
            [
              RAnimatedCanvasModule.setPathWidth(tag, path, add(strokeWidth, 5)),
              set(bip, 1)
            ]
          )
        ),
        onChange(
          bip,
          cond(
            bip,
            [
              runDelayed(RAnimatedCanvasModule.setPathWidth(tag, path, strokeWidth)),
              set(bip, 0)
            ]
          )
        )
      ]
    ),
    [path, bip]
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
                hitSlop={20}
              >
                <RCanvasPath
                  points={points}
                  strokeWidth={20}
                  strokeColor='pink'
                  animate
                  index={index}
                />
                {
                  show &&
                  <RCanvasPath
                    points={points.slice(50, 150)}
                    strokeWidth={20}
                    strokeColor='blue'
                    animate
                    index={min(index, 99)}
                  />
                }

              </LegacyCanvas>
            </BorderlessButton>
          </View>
        </LongPressGestureHandler>

      </View>

    </TapGestureHandler >

  )
}