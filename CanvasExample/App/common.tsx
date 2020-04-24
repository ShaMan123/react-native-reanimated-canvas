
import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { block, Clock, clockRunning, cond, debug, Easing, greaterOrEq, not, set, spring, startClock, stopClock, sub, timing, Value } from 'react-native-reanimated';
import { ChangeEvent, RCanvasRef, RPathData } from 'react-native-reanimated-canvas';
import _ from 'lodash';

export function useRefGetter<T, R = T>(initialValue?: T, action: (ref: T) => R = (current) => (current as unknown as R)) {
  const ref = useRef(initialValue);
  const getter = useCallback(() =>
    action(ref.current as T),
    [ref, action]
  );
  const defaultGetter = useCallback(() =>
    ref.current,
    [ref]
  );

  return [ref, getter, defaultGetter] as [typeof ref, typeof getter, typeof defaultGetter];
}

export function usePathUpdateAssertion(ref: React.RefObject<RCanvasRef | undefined>) {
  return useCallback((e: ChangeEvent) => {
    const { paths, added, changed, removed } = e.nativeEvent;
    const refPaths = ref.current?.getPaths();
    const withoutRemoved = (paths?: RPathData[]) => _.intersectionWith(paths, _.concat(added, changed), (a, b) => a.id === b);
    const clean = _.intersectionWith(refPaths, removed, (a, b) => a.id === b).length === 0;
    const assert = _.isEqual(withoutRemoved(paths), withoutRemoved(refPaths)) && clean;
    if (!assert) throw new Error('assertion error: RCAnvas paths are not in sync with last update');
  }, [ref]);
}

export function runSpring(clock: Animated.Clock, value: Animated.Adaptable<number>, dest: Animated.Adaptable<number>) {
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

export function runTiming(clock: Animated.Clock, value: Animated.Adaptable<number>, dest: Animated.Adaptable<number>) {
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

export function runDelayed(node: Animated.Node<any>, delay: Animated.Adaptable<number> = 1500) {
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
        cond(clockRunning(delayClock), stopClock(delayClock))
      ]
    )
  ])
}


export const styles = StyleSheet.create({
  default: {
    flex: 1
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  strokeColorButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  strokeWidthButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#39579A'
  },
  functionButton: {
    marginHorizontal: 2.5,
    marginVertical: 8,
    height: 30,
    width: 60,
    backgroundColor: '#39579A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    //elevation: 5 // causes the button to be above the canvas
  },
  cameraContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    alignSelf: 'stretch'
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20
  },
  page: {
    flex: 1,
    height: 300,
    elevation: 2,
    marginVertical: 8,
    backgroundColor: 'white',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.75,
    shadowRadius: 2
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
    margin: 15,
    backgroundColor: 'rgba(255,255,255,0.6)'
  },
  abs100: {
    ...StyleSheet.absoluteFillObject,
    top: 100
  },
  flexStart: { flexDirection: 'row', flex: 1, justifyContent: 'flex-start' },
  flexEnd: { flexDirection: 'row', flex: 1, justifyContent: 'flex-end' },
  row: { flexDirection: 'row' },
  util: {
    position: 'absolute',
    top: 0,
  },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  caption: { minHeight: 50, textAlign: 'center', textAlignVertical: 'center' }
});
