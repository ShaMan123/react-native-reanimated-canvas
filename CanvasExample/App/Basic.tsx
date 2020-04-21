
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, findNodeHandle } from 'react-native';
import { BorderlessButton, LongPressGestureHandler, RectButton, State, TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated, { and, neq, onChange, greaterThan, add } from 'react-native-reanimated';
import { RCanvasModule, RCanvasBaseModule, RCanvasRef, RPath, RPathData } from 'react-native-reanimated-canvas';
import { styles, runDelayed } from './common';
import LegacyCanvas from './LegacyCanvas';
import { useCallback } from 'react';
import { map } from 'lodash';
const { View, cond, eq, set, block, Value, useCode, Clock, round, min, event, call, callback } = Animated;

const num = 200;

const ID = {
  a: 5000,
  b: 5001,
  c: 5002
}

export default function Basic() {
  const ref = useRef<RCanvasRef>();
  const tap = useRef();
  const button = useRef();
  const longPress = useRef();

  const [show, setShow] = useState(true);

  useEffect(() => {
    const p = setInterval(async () => {
      if (!ref.current) return;
      const saveCount = await ref.current.save();
      setShow(!show);
    }, 2000);

    return () => clearImmediate(p);
  }, [show])

  const animator = useMemo(() => new Value(0), []);
  const points = useMemo(() => new Array(num).fill(0).map((v, i) => ({ x: i * Math.sin(i / num), y: i * Math.cos(i / num) })), []);
  const tag = useMemo(() => new Value(0), []);
  const path = useMemo(() => new Value(0), []);


  const x = useMemo(() => new Value(0), []);
  const y = useMemo(() => new Value(0), []);

  const strokeWidth = useMemo(() => new Value(0), []);
  const flag = useMemo(() => new Value(0), []);

  const [, setPip] = useState(0);

  const onTap = useMemo(() =>
    event<TapGestureHandlerStateChangeEvent>([{
      nativeEvent: ({ x: _x, y: _y, oldState }) => cond(
        eq(oldState, State.ACTIVE),
        [
          set(path, 0),
          set(strokeWidth, 0),
          set(x, _x),
          set(y, _y),
        ]
      )
    }]),
    [x, y]
  );
  useCode(() =>
    block([
      RCanvasModule.isPointOnPath(tag, x, y, path),
      onChange(
        path,
        cond(
          and(neq(path, 0), eq(flag, 0)),
          RCanvasModule.getPath(tag, path, callback<RPathData>(map([{ strokeWidth }]))),
          call([strokeWidth], ([p]) => console.log('strokeWidth', p))
        )
      ),
      onChange(
        strokeWidth,
        cond(
          and(neq(path, 0), greaterThan(strokeWidth, 0)),
          [
            RCanvasModule.setPathWidth(tag, path, add(strokeWidth, 5)),
            set(flag, 1)
          ]
        )
      ),
      onChange(
        flag,
        cond(
          and(neq(path, 0), flag),
          [
            runDelayed(RCanvasModule.setPathWidth(tag, path, strokeWidth)),
            set(flag, 0)
          ]
        )
      )
    ]),
    [x, y]
  );


  const jsOnTap = useCallback(async e => {
    const { x, y } = e.nativeEvent;
    const res = await RCanvasBaseModule.isPointOnPath(findNodeHandle(ref.current), x, y);
    const res1 = await RCanvasBaseModule.isPointOnPath(findNodeHandle(ref.current), x, y, ID.a);
    console.log(res, res1)
  }, []);

  return (
    <>
      <RectButton onPress={() => ref.current && ref.current.restore()}>
        <Text style={{ minHeight: 50, marginVertical: 20 }}>RESTORE</Text>
      </RectButton>
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
                //onChange={e => console.log(e.nativeEvent)}
                >
                  <RPath
                    points={points}
                    strokeWidth={20}
                    strokeColor='pink'
                    id={ID.a}
                    hitSlop={50}
                  />
                  <RPath
                    points={show ? points.slice(50, 150) : points.slice(20, 100)}
                    strokeWidth={20}
                    strokeColor='blue'
                    id={ID.b}
                    hitSlop={{ horizontal: 20 }}
                  />
                  {
                    show &&
                    <RPath
                      points={points.slice(50, 150)}
                      strokeWidth={20}
                      strokeColor='gold'
                      id={ID.c}
                      hitSlop={0}
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