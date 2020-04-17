
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Text, findNodeHandle } from 'react-native';
import { BorderlessButton, LongPressGestureHandler, RectButton, State, TapGestureHandler, TapGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { RCanvasModule, RCanvasBaseModule, RCanvasRef, RPath } from 'react-native-reanimated-canvas';
import { styles } from './common';
import LegacyCanvas from './LegacyCanvas';
const { View, cond, eq, set, block, Value, useCode, Clock, round, min, event, call } = Animated;

const num = 200;

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
  const bip = useMemo(() => new Value(0), []);

  const [, setPip] = useState(0);

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
        //onHandlerStateChange={onTap}
        onHandlerStateChange={async e => {
          const { x, y } = e.nativeEvent;
          const res = await RCanvasBaseModule.isPointOnPath(findNodeHandle(ref.current), x, y);
          const res1 = await RCanvasBaseModule.isPointOnPath(findNodeHandle(ref.current), x, y, "pip");
          console.log(res, res1)
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
                //onChange={e => console.log(e.nativeEvent)}
                >
                  <RPath
                    points={points}
                    strokeWidth={20}
                    strokeColor='pink'
                    id="pip"
                    hitSlop={50}
                  />
                  <RPath
                    points={show ? points.slice(50, 150) : points.slice(20, 100)}
                    strokeWidth={20}
                    strokeColor='blue'
                    id="pip1"
                    hitSlop={0}
                  />
                  {
                    show &&
                    <RPath
                      points={points.slice(50, 150)}
                      strokeWidth={20}
                      strokeColor='gold'
                      id="pip2"
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