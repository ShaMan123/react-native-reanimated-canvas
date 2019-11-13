import { Platform } from "react-native";
import Animated from "react-native-reanimated";
import SketchCanvas from "./SketchCanvas";
import { PanGestureHandler, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from "react-native-gesture-handler";
import { useMemo } from "react";

const {
  invoke,
  proc,
  callback,
  createAnimatedComponent,
  event
} = Animated;

const AnimatedCanvas = createAnimatedComponent(SketchCanvas)

export function isPointOnPath(
  tag: Animated.Adaptable<number>,
  x: Animated.Adaptable<number>,
  y: Animated.Adaptable<number>,
  pathId: Animated.Adaptable<number>,
  flag: Animated.Adaptable<0 | 1>
) {
  return isPointOnPathProc(tag, x, y, pathId, callback(0, flag));
}

const isPointOnPathProc = proc((
  tag: Animated.Adaptable<number>,
  x: Animated.Adaptable<number>,
  y: Animated.Adaptable<number>,
  pathId: Animated.Adaptable<number>,
  callback: typeof callback
) => {
  const module = Platform.select({
    ios: 'RNSketchCanvasManager',
    default: 'SketchCanvasModule'
  });
  const method = 'isPointOnPath';
  return invoke(module, method, tag, x, y, pathId, callback);
});


function AnimatedSketchCanvas() {
  const panEvent = useMemo(() =>
    event<PanGestureHandlerGestureEvent>([]), []);
  return (

    <PanGestureHandler
      onGestureEvent={Animated.event([{
        nativeEvent: ({ translationX: x, translationY: y, state, oldState }) =>
          block([
            cond(eq(state, State.Active), [add(this.panX, x), add(this.panY, y)])
          ])
      }], { useNativeDriver: true })}
      onGestureEvent={e => console.log(e.nativeEvent)}
      onHandlerStateChange={Animated.event([{
        nativeEvent: ({ translationX: x, translationY: y, state, oldState }) =>
          block([
            [set(this.panX, x), set(this.panY, y)],
            cond(eq(oldState, State.Active), [set(this.transX, this.panX), set(this.transY, add(this.transY, this.panY))])
          ])
      }], { useNativeDriver: true })}
      minPointers={2}
    //waitFor={this.panRef}
    >
      <Animated.View
        collapsable={false}
        style={{ flex: 1 }}
      >
        <PinchGestureHandler
          ref={this.pinchRef}
          //simultaneousHandlers={[this.panRef]}
          onHandlerStateChange={e => {
            if (e.nativeEvent.oldState === State.ACTIVE) {
              Animated.set(this.scaler, Animated.multiply(this.scaler, this.pinch))
              Animated.set(this.pinch, 1)
            }
          }}
          onGestureEvent={Animated.event([{
            nativeEvent: { scale: this.pinch }
          }], { useNativeDriver: true })}
        >
          <Animated.View collapsable={false} style={{ flex: 1 }}>
            {/* <Image source={require('./p.png')} style={{ width: 100, height: 100 }} />*/}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: this.scale }, { translateX: Animated.divide(this.panX, this.scale) }] }]}>
              <SketchCanvas

                gestureHandler={this.panRef}
                style={{ flex: 1 }}
                strokeWidth={24}
                strokeColor={this.state.color}
                ref={this._canvas}
                //touchEnabled={false}
                onStrokeStart={e => {
                  console.log(e)
                  this.setState({ message: null });
                }}

                onStrokeEnd={(...args) => console.log(args)}

                onPress={(nativeEvent) => {
                  console.log('Press detected', nativeEvent)
                  this.updateMessage(nativeEvent.x, nativeEvent.y, nativeEvent.paths);
                }}
                onLongPress={(nativeEvent) => this.onPressChangePathColor(nativeEvent.x, nativeEvent.y)}

                //onStrokeEnd={() => this.setState({ touchState: 'touch' })}
                //hardwareAccelerated={false}
                waitFor={[this.tapHandler, this.longPressHandler, this.pinchRef]}


              //onHandlerStateChange={(e) => Animated.set(this.tState, e.nativeEvent.state)}
              //handleTouchesInNative={false}   //  <--------------------------------------------------
              />
            </Animated.View>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}
