'use strict';

import * as _ from 'lodash';
import React, { Component, SyntheticEvent } from 'react';
import { NativeModules, PanResponder, PixelRatio, Platform, processColor, requireNativeComponent, UIManager, findNodeHandle, ViewProps, PanResponderInstance, NativeTouchEvent } from 'react-native';
import { NativeViewGestureHandler, PanGestureHandler, State as GHState, GestureHandlerProperties, PanGestureHandlerProperties } from 'react-native-gesture-handler';
import { requestPermissions } from './handlePermissions';
import { SketchCanvasProps, CanvasText, Path, PathData, NativeSketchEvent, ImageType } from '../index';
/*
UIManager.genericDirectEventTypes = {
    ...UIManager.genericDirectEventTypes,
    onStrokeStart: { registrationName: 'onStrokeStart' },
    onStrokeChanged: { registrationName: 'onStrokeChanged' },
    onStrokeEnd: { registrationName: 'onStrokeEnd' },
    onPress: { registrationName: 'onPress' },
    onLongPress: { registrationName: 'onLongPress' },
};
*/
const RNSketchCanvas = requireNativeComponent('RNSketchCanvas');

interface SketchCanvasState {
  text: string
};

type SketchCanvasProperties = SketchCanvasProps & ViewProps & GestureHandlerProperties & PanGestureHandlerProperties;

const SketchCanvasManager = NativeModules.RNSketchCanvasManager || {};
const { Commands, Constants } = UIManager.getViewManagerConfig('RNSketchCanvas');

class SketchCanvas extends Component<SketchCanvasProperties, SketchCanvasState> {

  static defaultProps: SketchCanvasProperties = {
    style: null,
    onLayout: () => { },
    strokeColor: '#000000',
    strokeWidth: 3,
    onPathsChange: () => { },
    onStrokeStart: () => { },
    onStrokeChanged: undefined,
    onStrokeEnd: () => { },
    onPress: undefined,
    onLongPress: undefined,
    onSketchSaved: () => { },
    user: undefined,
    paths: [],
    touchEnabled: true,

    text: undefined,
    localSourceImage: undefined,

    permissionDialogTitle: '',
    permissionDialogMessage: '',

    hardwareAccelerated: Platform.OS === 'android' ? false : undefined,

    gestureHandler: React.createRef(),
    useNativeDriver: false,
    disallowInterruption: true,
    shouldActivateOnStart: true
  };

  static generatePathId() {
    return _.uniqueId('SketchCanvasPath');
  }

  _pathsToProcess = [];
  _paths: Path[] = [];
  _path: PathData | null = null;
  _handle = null;
  _ref = null;
  _screenScale = Platform.OS === 'ios' ? 1 : PixelRatio.get();
  _offset = { x: 0, y: 0 };
  _size = { width: 0, height: 0 };
  _initialized = false;

  constructor(props: SketchCanvasProperties) {
    super(props);

    this._loadPanResponder.call(this);
    this.isPointOnPath = this.isPointOnPath.bind(this);

    this.state = {
      text: this._processText(props.text ? props.text.map(t => Object.assign({}, t)) : null)
    };
  }

  static getDerivedStateFromProps(nextProps: SketchCanvasProperties, prevState: SketchCanvasState) {
    return {
      text: SketchCanvas._processText(nextProps.text ? nextProps.text.map(t => Object.assign({}, t)) : null)
    };
  }

  async componentDidMount() {
    const isStoragePermissionAuthorized = await requestPermissions(
      this.props.permissionDialogTitle,
      this.props.permissionDialogMessage,
    );
  }

  static _processText(text) {
    text && text.forEach(t => t.fontColor = processColor(t.fontColor));
    return text;
  }

  _processText(text) {
    return SketchCanvas._processText(text);
  }

  findPath(pathId: string) {
    return _.find(this._paths, (p) => _.isEqual(p.path.id, pathId));
  }

  addPaths(paths: Path[]) {
    if (this._initialized) {
      const parsedPaths = paths.map((data) => {
        if (_.isNil(this.findPath(data.path.id))) this._paths.push(data);
        const scaler = this._size.width / data.size.width;
        return [
          data.path.id,
          processColor(data.path.color),
          data.path.width,
          _.map(data.path.points, (p) => {
            return _.mapValues(p, (val) => val * scaler);
          })
        ];
      });

      UIManager.dispatchViewManagerCommand(this._handle, Commands.addPaths, parsedPaths);
    }
    else {
      paths.map((data) => this._pathsToProcess.filter(p => p.path.id === data.path.id).length === 0 && this._pathsToProcess.push(data));
    }
  }

  addPath(data: Path) {
    return this.addPaths([data]);
  }

  deletePaths(pathIds: string[]) {
    this._paths = this._paths.filter(p => pathIds.findIndex(id => p.path.id === id) === -1);
    UIManager.dispatchViewManagerCommand(this._handle, Commands.deletePaths, pathIds);
  }

  deletePath(id: string) {
    this.deletePaths([id]);
  }

  getPaths() {
    return _.cloneDeep(this._paths);
  }

  startPath(x: number, y: number) {
    this._path = {
      id: SketchCanvas.generatePathId(),
      color: this.props.strokeColor,
      width: this.props.strokeWidth,
      points: []
    };
    const pointX = parseFloat(x.toFixed(2));
    const pointY = parseFloat(y.toFixed(2));

    UIManager.dispatchViewManagerCommand(
      this._handle,
      Commands.newPath,
      [
        this._path.id,
        processColor(this._path.color),
        this._path.width
      ]
    );

    this.props.onStrokeStart && this.props.onStrokeStart(this._path);
  }


  addPoint(x: number, y: number) {
    if (this._path) {
      const pointX = parseFloat(x.toFixed(2));
      const pointY = parseFloat(y.toFixed(2));

      UIManager.dispatchViewManagerCommand(
        this._handle,
        Commands.addPoint,
        [
          pointX,
          pointY
        ]
      );

      this._path.points.push({ x: pointX, y: pointY });
      this.props.onStrokeChanged && this.props.onStrokeChanged({ x: pointX, y: pointY, id: this._path.id });
    }
  }

  endPath() {
    if (this._path) {
      UIManager.dispatchViewManagerCommand(this._handle, Commands.endPath, []);
      const o = {
        path: this._path,
        size: this._size,
        drawer: this.props.user
      };
      this._paths.push(o);
      this.props.onStrokeEnd && this.props.onStrokeEnd(this._path);
      this._path = null;
    }
  }

  onStrokeStart = (e: SyntheticEvent<SketchCanvas, NativeSketchEvent>) => {
    this._path = {
      id: e.nativeEvent.id,
      color: this.props.strokeColor,
      width: this.props.strokeWidth,
      points: []
    };
    this.props.onStrokeStart && this.props.onStrokeStart(e.nativeEvent);
  }

  onStrokeChanged = this.props.onStrokeChanged ? (e: SyntheticEvent<SketchCanvas, NativeSketchEvent>) => this.props.onStrokeChanged(e.nativeEvent) : null;

  onStrokeEnd = (e: SyntheticEvent<SketchCanvas, NativeSketchEvent>) => {
    if (this._path) {
      _.assign(this._path, { points: e.nativeEvent.points });
      const o = {
        path: this._path,
        size: this._size,
        drawer: this.props.user
      };
      this._paths.push(o);
      this.props.onStrokeEnd(e.nativeEvent);
      this._path = null;
    }
  }

  clear() {
    this._paths = [];
    this._path = null;
    UIManager.dispatchViewManagerCommand(this._handle, Commands.clear, []);
  }

  undo() {
    let lastId = null;
    this._paths.forEach(d => lastId = d.drawer === this.props.user ? d.path.id : lastId);
    if (lastId !== null) this.deletePath(lastId);
    return lastId;
  }

  /**
   * @param imageType "png" or "jpg"
   * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
   * @param includeText Set to `true` to include the text drawn from `Text`.
   * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
   */
  save(
    imageType: ImageType,
    transparent: boolean,
    folder: string,
    filename: string,
    includeImage: boolean,
    includeText: boolean,
    cropToImageSize: boolean
  ) {
    UIManager.dispatchViewManagerCommand(this._handle, Commands.save, [imageType, folder, filename, transparent, includeImage, includeText, cropToImageSize]);
  }

  /**
   * @param imageType "png" or "jpg"
   * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
   * @param includeText Set to `true` to include the text drawn from `Text`.
   * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
   */
  getBase64(
    imageType: ImageType,
    transparent: boolean,
    includeImage: boolean,
    includeText: boolean,
    cropToImageSize: boolean,
    callback: (error: any, result?: string) => void
  ) {
    if (Platform.OS === 'ios') {
      SketchCanvasManager.transferToBase64(this._handle, imageType, transparent, includeImage, includeText, cropToImageSize, callback);
    } else {
      NativeModules.SketchCanvasModule.transferToBase64(this._handle, imageType, transparent, includeImage, includeText, cropToImageSize, callback);
    }
  }

  isPointOnPath(x, y, pathId, callback) {
    const nativeX = x;
    const nativeY = y;
    const normalizedPathId = typeof pathId === 'number' ? pathId : null;
    const nativeMethod = (callback) => {
      if (Platform.OS === 'ios') {
        SketchCanvasManager.isPointOnPath(this._handle, nativeX, nativeY, normalizedPathId, callback);
      } else {
        NativeModules.SketchCanvasModule.isPointOnPath(this._handle, nativeX, nativeY, normalizedPathId, callback);
      }
    };

    if (callback) {
      nativeMethod(callback);
    }
    else {
      return new Promise((resolve, reject) => {
        nativeMethod((err, success) => {
          if (err) reject(err);
          resolve(success);
        });
      });
    }
  }

  setTouchRadius(radius, callback) {
    const r = typeof radius === 'number' ? radius : 0;

    const nativeMethod = (callback) => {
      if (Platform.OS === 'ios') {
        //  need to implement native callback 
        //SketchCanvasManager.setTouchRadius(this._handle, r, callback);
      } else {
        NativeModules.SketchCanvasModule.setTouchRadius(this._handle, r, callback);
      }
    };

    if (callback) {
      nativeMethod(callback);
    }
    else {
      return new Promise((resolve, reject) => {
        nativeMethod((err, success) => {
          if (err) reject(err);
          resolve(success);
        });
      });
    }
  }

  onPress = this.props.onPress ? (e) => this.props.onPress(e.nativeEvent) : null;
  onLongPress = this.props.onLongPress ? (e) => this.props.onLongPress(e.nativeEvent) : null;

  _grantResponder = (evt, gestureState) => this.props.touchEnabled && evt.nativeEvent.touches.length === 1;//gestureState.numberActiveTouches === 1;

  panResponder: PanResponderInstance | undefined;
  _loadPanResponder() {
    this.panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: this._grantResponder,
      onStartShouldSetPanResponderCapture: this._grantResponder,
      onMoveShouldSetPanResponder: this._grantResponder,
      onMoveShouldSetPanResponderCapture: this._grantResponder,

      onPanResponderGrant: (evt, gestureState) => {
        const e = evt.nativeEvent;
        this._offset = { x: e.pageX - e.locationX, y: e.pageY - e.locationY };
        this.startPath(e.locationX, e.locationY);
      },
      onPanResponderMove: (evt, gestureState) => {
        this.addPoint(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        this.endPath();
      },

      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      }
    });
  }

  onHandlerStateChange = (e) => {
    if (e.nativeEvent.state === GHState.BEGAN) this.startPath(e.nativeEvent.x, e.nativeEvent.y);
    if (e.nativeEvent.oldState === GHState.ACTIVE) this.endPath();
  }

  onGestureEvent = (e) => {
    this.addPoint(e.nativeEvent.x, e.nativeEvent.y);
    this.props.onGestureEvent && this.props.onGestureEvent(e);
  }

  _handleRef = (ref) => {
    this._ref = ref;
    this._handle = findNodeHandle(ref);
  }

  setNativeProps(props) {
    this._ref && this._ref.setNativeProps(props);
  }

  onLayout = (e) => {
    this._size = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
    this._initialized = true;
    this._pathsToProcess.length > 0 && this._pathsToProcess.forEach(p => this.addPath(p));
    this.props.onLayout(e);
  }

  onChange = (e) => {
    if (!this._initialized) return;
    if (e.nativeEvent.hasOwnProperty('pathsUpdate')) {
      this.props.onPathsChange(e.nativeEvent.pathsUpdate);
    } else if (e.nativeEvent.hasOwnProperty('success') && e.nativeEvent.hasOwnProperty('path')) {
      this.props.onSketchSaved(e.nativeEvent.success, e.nativeEvent.path);
    } else if (e.nativeEvent.hasOwnProperty('success')) {
      this.props.onSketchSaved(e.nativeEvent.success, null);
    }
  }

  renderBaseView() {
    const { style, localSourceImage, permissionDialogTitle, permissionDialogMessage, hardwareAccelerated, touchEnabled, strokeColor, strokeWidth, useNativeDriver, ...props } = this.props;
    return (
      <RNSketchCanvas
        {...props}
        ref={this._handleRef}
        style={style}
        onLayout={this.onLayout}
        onChange={this.onChange}
        localSourceImage={localSourceImage}
        permissionDialogTitle={permissionDialogTitle}
        permissionDialogMessage={permissionDialogMessage}
        text={this.state.text}
        hardwareAccelerated={hardwareAccelerated}
        touchEnabled={touchEnabled}
        strokeColor={processColor(strokeColor)}
        strokeWidth={strokeWidth}
        onStrokeStart={this.onStrokeStart}
        onStrokeChanged={this.onStrokeChanged}
        onStrokeEnd={this.onStrokeEnd}
        onPress={this.onPress}
        onLongPress={this.onLongPress}
        useNativeDriver={useNativeDriver}
      />
    );
  }

  renderWithPanResponder() {
    return React.cloneElement(this.renderBaseView(), this.panResponder.panHandlers);
  }

  renderWithGestureHandler() {
    const { gestureHandler, touchEnabled, simultaneousHandlers, waitFor, disallowInterruption, shouldActivateOnStart } = this.props;
    return (
      <PanGestureHandler
        ref={gestureHandler}
        enabled={touchEnabled}
        maxPointers={1}
        //minDist={1}
        simultaneousHandlers={simultaneousHandlers}
        waitFor={waitFor}
        onHandlerStateChange={this.onHandlerStateChange}
        onGestureEvent={this.onGestureEvent}
        disallowInterruption={disallowInterruption}
        shouldActivateOnStart={shouldActivateOnStart}
      >
        {this.renderBaseView()}
      </PanGestureHandler>
    );
  }

  /**
   * use this for handling touches from js
   * */
  renderJSImpl() {
    return PanGestureHandler ? this.renderWithGestureHandler() : this.renderWithPanResponder();
  }

  renderNativeGHImpl() {
    const { gestureHandler, touchEnabled, simultaneousHandlers, waitFor, disallowInterruption, shouldActivateOnStart } = this.props;
    return (
      <NativeViewGestureHandler
        ref={gestureHandler}
        enabled={touchEnabled}
        simultaneousHandlers={simultaneousHandlers}
        waitFor={waitFor}
        disallowInterruption={disallowInterruption}
        shouldActivateOnStart={shouldActivateOnStart}
      >
        {this.renderBaseView()}
      </NativeViewGestureHandler>
    );
  }

  render() {
    return this.props.useNativeDriver ? NativeViewGestureHandler ? this.renderNativeGHImpl() : this.renderBaseView() : this.renderJSImpl();
  }
}

const ExportedComponent = SketchCanvas;

ExportedComponent.MAIN_BUNDLE = Platform.OS === 'ios' ? Constants.MainBundlePath : '';
ExportedComponent.DOCUMENT = Platform.OS === 'ios' ? Constants.NSDocumentDirectory : '';
ExportedComponent.LIBRARY = Platform.OS === 'ios' ? Constants.NSLibraryDirectory : '';
ExportedComponent.CACHES = Platform.OS === 'ios' ? Constants.NSCachesDirectory : '';
ExportedComponent.generatePathId = SketchCanvas.generatePathId;

export default ExportedComponent;