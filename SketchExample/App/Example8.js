/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import { SketchCanvas } from '@terrylinla/react-native-sketch-canvas';
import React, { Component } from 'react';
import { Animated, Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { createNativeWrapper, LongPressGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';


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
      this.ref.deletePaths([...paths.map(p => p.path.id), this.state.selectedPath]);
      this.ref.addPaths(paths);
    }
  }

  get caption() {
    const a = this.state.color === '#00000000' ? 'erase' : this.state.touchState;
    return this.state.message || a.toLocaleUpperCase();
  }

  render() {
    return (
      <View
        style={[styles.page, { flex: 1 }]}
      >

        <TapGestureHandler
          numberOfTaps={1}
          style={{ flex: 1, flexDirection: 'column' }}
          ref={this.tapHandler}
          onHandlerStateChange={this.tap}
          waitFor={[this.longPressHandler]}
          enabled={false}
        >
          <LongPressGestureHandler
            ref={this.longPressHandler}
            onHandlerStateChange={this.longPress}
            enabled={false}
          >
            <Animated.View
              style={{ flex: 1 }}
            >
              <SketchCanvas
                style={{ flex: 1 }}
                strokeWidth={24}
                strokeColor={this.state.color}
                ref={this._canvas}
                touchEnabled
                onStrokeStart={e => {
                  this.setState({ message: null });
                }}
                onPress={(nativeEvent) => this.updateMessage(nativeEvent.x, nativeEvent.y, nativeEvent.paths)}
                onLongPress={(nativeEvent) => console.log('LongPress detected', nativeEvent)}
                //onStrokeEnd={() => this.setState({ touchState: 'touch' })}
                hardwareAccelerated={false}
                waitFor={[this.tapHandler, this.longPressHandler]}
              />
            </Animated.View>
          </LongPressGestureHandler>
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
      </View>
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
