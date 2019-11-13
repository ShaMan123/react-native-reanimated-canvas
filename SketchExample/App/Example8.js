/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import SketchCanvas from 'react-native-reanimated-canvas';
import React, { Component } from 'react';
import { Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { createNativeWrapper, LongPressGestureHandler, State, TapGestureHandler, PinchGestureHandler, RectButton, PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const { set, cond, add, block, eq, acc } = Animated;

const GHSC = createNativeWrapper(SketchCanvas, { disallowInterruption: true, enabled: true, shouldActivateOnStart: true, shouldCancelWhenOutside: false });

export default class Example8 extends Component {
  constructor(props) {
    super(props)

    this.state = {
      example: 0,
      color: '#FF0000',
      thickness: 5,
      message: '',
      photoPath: null,
      scrollEnabled: true,
      touchState: 'draw',
      modalVisible: false,
      uri: null
    }
  }

  _canvas = React.createRef();
  tapHandler = React.createRef();
  longPressHandler = React.createRef();
  get ref() {
    return this._canvas.current;
  }

  _t = null;

  componentWillUnmount() {
    this._t && clearTimeout(this._t);
  }

  tap = (e) => {
    const { x, y, state, oldState } = e.nativeEvent;
    if (oldState === State.ACTIVE) {
      const paths = this.ref.getPaths();
      if (!paths || paths.length === 0) return;
      const pathId = this.ref.getPaths()[0].path.id;
      Promise.all([
        this.ref.isPointOnPath(x, y),
        this.ref.isPointOnPath(x, y, pathId)
      ]).then(([pathArr, isOnSpecifiedPath]) => {
        this.updateMessage(x, y, pathArr);
      });
    }
  }

  updateMessage(x, y, pathArr) {
    const message = (pathArr.length === 0 ? `The point (${Math.round(x)}, ${Math.round(y)}) is NOT contained by any path` :
      `The point (${Math.round(x)}, ${Math.round(y)}) is contained by the following paths:\n\n${pathArr.join('\n')}`); //+ `\n\nAnd is ${isOnSpecifiedPath ? '' : 'NOT '}contained by path ${pathId}`
    //console.log('TouchableSketchCanvas', message);
    this.setState({ message });
    this._t && clearTimeout(this._t);
    this._t = setTimeout(() => {
      this.setState({ message: null });
    }, 2500);
  }

  longPress = (e) => {
    const { x, y, state, oldState } = e.nativeEvent;
    if (state === State.ACTIVE) {
      this.onPressChangePathColor(x, y);
    }
  }

  onPressChangePathColor(x, y) {
    //await this.ref.setTouchRadius(100);
    //Alert.alert('TouchRadius', 'The radius of the touch has been changed');
    this.ref.isPointOnPath(x, y)
      .then((paths) => {
        console.log(paths);

        if (paths.length > 0) {
          const selectedPath = paths.pop();
          //Alert.alert('Selection Change', `Path ${selectedPath} has been selected, change UI to signal user`);

          const replica = this.ref.getPaths().find((p) => p.path.id === selectedPath);
          const cb = this._restorePath;
          this._restorePath = this.restorePath.bind(this, replica);

          const selected = { ...replica };
          selected.path.color = 'yellow';

          this.ref.deletePath(selected.path.id);
          this.ref.addPath(selected);
          cb && cb();
          this.setState({ selectedPath });
        }
      });
  }

  restorePath(path) {
    if (this.state.selectedPath) {
      path.path.id = SketchCanvas.generatePathId();
      path.path.color = 'red';

      const paths = this.ref.getPaths()
        .splice(this.ref.getPaths().findIndex((p) => p.path.id === path) + 1)
        .map((p) => {
          //
          p.path.id = SketchCanvas.generatePathId();
          return p;
        });
      paths.push(path);
      //this.ref.deletePaths([...paths.map(p => p.path.id), this.state.selectedPath]);
      this.ref.clear();
      this.ref.addPaths(paths);
    }
  }

  get caption() {
    const a = this.state.color === '#00000000' ? 'erase' : this.state.touchState;
    return this.state.message || a.toLocaleUpperCase();
  }

  pinchRef = React.createRef();
  panRef = React.createRef();

  pinch = new Animated.Value(1);
  scaler = new Animated.Value(1);
  scale = Animated.multiply(this.scaler, this.pinch);

  panX = new Animated.Value(0);
  panY = new Animated.Value(0);
  transX = add(this.panX, 0);
  transY = add(this.panY, 0);
  tState = new Animated.Value(-1);


  render() {
    return (
      <Animated.View
        style={[styles.page, { flex: 1 }]}
      >

        <TapGestureHandler
          numberOfTaps={1}
          style={{ flex: 1, flexDirection: 'column' }}
          ref={this.tapHandler}
          onHandlerStateChange={this.tap}
          waitFor={[this.longPressHandler, this.panRef]}
          enabled={false}
        >
          <Animated.View
            collapsable={false}
            style={{ flex: 1 }}
          >
            <LongPressGestureHandler
              ref={this.longPressHandler}
              onHandlerStateChange={this.longPress}
              enabled={false}
            >
              <Animated.View
                collapsable={false}
                style={{ flex: 1 }}
              >
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
                              console.log(e.nativeEvent)
                              this.setState({ message: null });
                            }}

                            onStrokeEnd={(e) => this._canvas.current.dispatchCommand(9,[e.nativeEvent.id, {width: 80}])}

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
              </Animated.View>
            </LongPressGestureHandler>
          </Animated.View>
        </TapGestureHandler>

        <Text
          style={[styles.stateText, this.state.message && styles.smallText]}
        >
          {this.caption}
        </Text>
        <Button
          title={this.state.color === '#00000000' ? 'Press to draw' : 'Press to erase'}
          onPress={() => this.state.color === '#00000000' ? this.setState({ color: 'red' }) : this.setState({ color: '#00000000' })}
        />
      </Animated.View>
    );
  }

}

const styles = StyleSheet.create({
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
  stateText: {
    color: 'blue', alignContent: 'center', alignSelf: 'center', fontSize: 24, margin: 5, fontWeight: 'bold'
  },
  smallText: {
    fontSize: 10, fontWeight: 'normal'
  }
});
