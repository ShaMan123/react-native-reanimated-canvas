
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, findNodeHandle } from 'react-native';
import { BorderlessButton, LongPressGestureHandler, RectButton, State, TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { RCanvasModule, RCanvasBaseModule, RCanvasRef, RPath, RPathData } from 'react-native-reanimated-canvas';
import { runDelayed, styles } from './common';
import LegacyCanvas from './LegacyCanvas';
const { View, cond, eq, add, or, not, set, sub, greaterOrEq, greaterThan, block, and, clockRunning, startClock, stopClock, debug, spring, Value, useCode, Clock, round, onChange, timing, min, event, neq, call, invoke, callback, map, DirectManipulationHelper, intercept } = Animated;

export default function Basic() {
  const ref = useRef<RCanvasRef>();
  const tap = useRef();
  const button = useRef();
  const longPress = useRef();
  const clock = useMemo(() => new Clock(), []);

  const [show, setShow] = useState(true);

  useEffect(() => {
    const p = setInterval(async () => {
      if (!ref.current) return;
      const saveCount = await ref.current.save();
      setShow(!show);


      const k = setTimeout(() => {
        console.log(saveCount)
        //ref.current.restore(saveCount);
      }, 4000);

    }, 2000);

    return () => clearImmediate(p);
  }, [show])

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
  /*
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
    */

  const width = useMemo(() => new Value(0), []);
  useCode(() =>
    block([
      RCanvasModule.isPointOnPath(tag, x, y, path),
      call([path], ([p]) => console.log('touched', p))
    ]),
    [x, y]
  );
  /*
    useCode(() =>
      cond(
        and(neq(path, -1), neq(path, 0)),
        [
          onChange(
            path,
            cond(
              eq(bip, 0),
              RCanvasModule.getPaths(tag, map([path]), callback<RPathData>(map([{ strokeWidth }]))),
            )
          ),
          onChange(
            strokeWidth,
            cond(
              greaterThan(strokeWidth, 0),
              [
                RCanvasModule.setPathWidth(tag, path, add(strokeWidth, 5)),
                set(bip, 1)
              ]
            )
          ),
          onChange(
            bip,
            cond(
              bip,
              [
                runDelayed(RCanvasModule.setPathWidth(tag, path, strokeWidth)),
                set(bip, 0)
              ]
            )
          )
        ]
      ),
      [path, bip]
    );
    */

  return (
    <>
      <RectButton onPress={() => ref.current && ref.current.restore()}>
        <Text style={{ minHeight: 50, marginVertical: 20 }}>RESTORE</Text>
      </RectButton>
      <TapGestureHandler
        ref={tap}
        waitFor={[button, longPress]}
        onHandlerStateChange={onTap}
        onHandlerStateChange={async e => {
          const { x, y } = e.nativeEvent;
          const res = await RCanvasBaseModule.isPointOnPath(findNodeHandle(ref.current), x, y);
          console.log(res)
        }}
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
                  ref={r => {
                    ref.current = r;
                    tag.setValue(r ? findNodeHandle(r) : -1);
                  }}
                  onLayout={(e) => {
                    //tag.setValue(e.nativeEvent.target)
                    setPip(e.nativeEvent.target)
                  }}
                  defaultStrokeWidth={20}
                  hitSlop={20}
                >
                  <RPath
                    points={points}
                    strokeWidth={20}
                    strokeColor='pink'
                  />
                  <RPath
                    points={show ? points.slice(50, 150) : points.slice(20, 100)}
                    strokeWidth={20}
                    strokeColor='blue'
                  />
                  {
                    show &&
                    <RPath
                      points={points.slice(50, 150)}
                      strokeWidth={20}
                      strokeColor='gold'
                    />
                  }

                </LegacyCanvas>
              </BorderlessButton>
            </View>
          </LongPressGestureHandler>

        </View>

      </TapGestureHandler >
    </>
  )
}