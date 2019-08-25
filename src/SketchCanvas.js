'use strict';

import * as _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import ReactNative, { NativeModules, PanResponder, PixelRatio, Platform, processColor, requireNativeComponent, UIManager, ViewPropTypes } from 'react-native';
import { createNativeWrapper, PanGestureHandler, State as GHState } from 'react-native-gesture-handler';
import { requestPermissions } from './handlePermissions';

UIManager.genericDirectEventTypes = {
  ...UIManager.genericDirectEventTypes,
  onStrokeStart: { registrationName: 'onStrokeStart' },
  onStrokeChanged: { registrationName: 'onStrokeChanged' },
  onStrokeEnd: { registrationName: 'onStrokeEnd' },
  onPress: { registrationName: 'onPress' },
  onLongPress: { registrationName: 'onLongPress' },
};

const RNSketchCanvas = requireNativeComponent('RNSketchCanvas', SketchCanvas, {
  nativeOnly: {
    nativeID: true,
    onChange: true,
    onStrokeStart: true,
    onStrokeChanged: true,
    onStrokeEnd: true,
    onPress: true,
    onLongPress: true
  }
});
const SketchCanvasManager = NativeModules.RNSketchCanvasManager || {};
const { Commands, Constants } = UIManager.getViewManagerConfig ? UIManager.getViewManagerConfig('RNSketchCanvas') : UIManager.RNSketchCanvas;

class SketchCanvas extends React.Component {
    /*
  static propTypes = {
    style: ViewPropTypes.style,
    onLayout: PropTypes.func,
    strokeColor: PropTypes.string,
    strokeWidth: PropTypes.number,
    onPathsChange: PropTypes.func,
    onStrokeStart: PropTypes.func,
    onStrokeChanged: PropTypes.func,
    onStrokeEnd: PropTypes.func,
    onPress: PropTypes.func,
    onLongPress: PropTypes.func,
    onSketchSaved: PropTypes.func,
    user: PropTypes.string,
    paths: PropTypes.arrayOf(PropTypes.shape({
      path: PropTypes.shape({
        id: PropTypes.string,
        color: PropTypes.string,
        width: PropTypes.number,
        points: PropTypes.arrayOf(PropTypes.string),
      }),
      size: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
      }),
      drawer: PropTypes.string
    })),
    touchEnabled: PropTypes.oneOfType([PropTypes.bool, PropTypes.oneOf(['touch', 'draw', 'none'])]),

    text: PropTypes.arrayOf(PropTypes.shape({
      text: PropTypes.string,
      font: PropTypes.string,
      fontSize: PropTypes.number,
      fontColor: PropTypes.string,
      overlay: PropTypes.oneOf(['TextOnSketch', 'SketchOnText']),
      anchor: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
      position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
      coordinate: PropTypes.oneOf(['Absolute', 'Ratio']),
      alignment: PropTypes.oneOf(['Left', 'Center', 'Right']),
      lineHeightMultiple: PropTypes.number,
    })),
    localSourceImage: PropTypes.shape({ filename: PropTypes.string, directory: PropTypes.string, mode: PropTypes.oneOf(['AspectFill', 'AspectFit', 'ScaleToFill']) }),

    permissionDialogTitle: PropTypes.string,
    permissionDialogMessage: PropTypes.string,

    hardwareAccelerated: PropTypes.bool,

    panHandler: PropTypes.any,
    handleTouchesInNative: PropTypes.bool
  };
  */

  static defaultProps = {
    style: null,
    onLayout: () => { },
    strokeColor: '#000000',
    strokeWidth: 3,
    onPathsChange: () => { },
    onStrokeStart: () => { },
    onStrokeChanged: null,
    onStrokeEnd: () => { },
    onPress: null,
    onLongPress: null,
    onSketchSaved: () => { },
    user: null,
    paths: [],
    touchEnabled: true,

    text: null,
    localSourceImage: null,

    permissionDialogTitle: '',
    permissionDialogMessage: '',

    hardwareAccelerated: Platform.OS === 'android' ? false : undefined,

    panHandler: React.createRef(),
    handleTouchesInNative: Platform.OS === 'android'
  };

  static generatePathId() {
    return _.uniqueId('SketchCanvasPath');
  }

  constructor(props) {
    super(props);
    this._pathsToProcess = [];
    this._paths = [];
    this._path = null;
    this._handle = null;
    this._ref = null;
    this._screenScale = Platform.OS === 'ios' ? 1 : PixelRatio.get();
    this._offset = { x: 0, y: 0 };
    this._size = { width: 0, height: 0 };
    this._initialized = false;

    this._loadPanResponder.call(this);
    this.isPointOnPath = this.isPointOnPath.bind(this);

    this.state = {
      text: this._processText(props.text ? props.text.map(t => Object.assign({}, t)) : null)
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
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

  findPath(pathId) {
    return _.find(this._paths, (p) => _.isEqual(p.path.id, pathId));
  }

  addPaths(paths) {
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

  addPath(data) {
    return this.addPaths([data]);
  }

  deletePaths(pathIds) {
    this._paths = this._paths.filter(p => pathIds.findIndex(id => p.path.id === id) === -1);
    UIManager.dispatchViewManagerCommand(this._handle, Commands.deletePaths, pathIds);
  }

  deletePath(id) {
    this.deletePaths([id]);
  }

  getPaths() {
    return _.cloneDeep(this._paths);
  }

  startPath(x, y) {
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

    UIManager.dispatchViewManagerCommand(
      this._handle,
      Commands.addPoint,
      [
        pointX,
        pointY
      ]
    );

    //this._path.data.push(`${pointX},${pointY}`);
    //this.props.onStrokeStart(pointX, pointY);
  }

  onStrokeStart = (e) => {
    this._path = {
      id: e.nativeEvent.id,
      color: this.props.strokeColor,
      width: this.props.strokeWidth,
      points: []
    };
    this.props.onStrokeStart(e.nativeEvent);
  }

  addPoint(x, y) {
    if (this._path) {
      const pointX = parseFloat(x.toFixed(2));
      const pointY = parseFloat(y.toFixed(2));

      UIManager.dispatchViewManagerCommand(this._handle, Commands.addPoint, [
        pointX,
        pointY
      ]);

      //this._path.data.push(`${pointX},${pointY}`);
      //this.props.onStrokeChanged(pointX, pointY);
    }
  }

  onStrokeChanged = this.props.onStrokeChanged ? (e) => this.props.onStrokeChanged(e.nativeEvent) : null;

  endPath() {
    UIManager.dispatchViewManagerCommand(this._handle, Commands.endPath, []);
  }

  onStrokeEnd = (e) => {
    if (this._path) {
      _.assign(this._path, { points: e.nativeEvent.points });
      const o = {
        path: this._path,
        size: this._size,
        drawer: this.props.user
      };
      this._paths.push(o);
      this.props.onStrokeEnd(o);
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

  save(imageType, transparent, folder, filename, includeImage, includeText, cropToImageSize) {
    UIManager.dispatchViewManagerCommand(this._handle, Commands.save, [imageType, folder, filename, transparent, includeImage, includeText, cropToImageSize]);
  }

  getBase64(imageType, transparent, includeImage, includeText, cropToImageSize, callback) {
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
  }

  _handleRef = (ref) => {
    this._ref = ref;
    this._handle = ReactNative.findNodeHandle(ref);
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
      this.props.onSketchSaved(e.nativeEvent.success);
    }
  }

  renderBaseView() {
    const { style, localSourceImage, permissionDialogTitle, permissionDialogMessage, hardwareAccelerated, touchEnabled, strokeColor, strokeWidth } = this.props;
    return (
      <RNSketchCanvas
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
      />
    );
  }

  renderWithPanResponder() {
    return React.cloneElement(this.renderBaseView(), this.panResponder.panHandlers);
  }

  renderWithGestureHandler() {
    const { panHandler, touchEnabled, simultaneousHandlers, waitFor } = this.props;
    return (
      <PanGestureHandler
        ref={panHandler}
        enabled={touchEnabled}
        maxPointers={1}
        simultaneousHandlers={simultaneousHandlers}
        waitFor={waitFor}
        onHandlerStateChange={this.onHandlerStateChange}
        onGestureEvent={this.onGestureEvent}
        disallowInterruption
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

  render() {
    return this.props.handleTouchesInNative ? this.renderBaseView() : this.renderJSImpl();
  }
}

const ExportedComponent = Platform.OS === 'android' && createNativeWrapper ? createNativeWrapper(SketchCanvas, { disallowInterruption: true, shouldActivateOnStart: true }) : SketchCanvas;

ExportedComponent.MAIN_BUNDLE = Platform.OS === 'ios' ? Constants.MainBundlePath : '';
ExportedComponent.DOCUMENT = Platform.OS === 'ios' ? Constants.NSDocumentDirectory : '';
ExportedComponent.LIBRARY = Platform.OS === 'ios' ? Constants.NSLibraryDirectory : '';
ExportedComponent.CACHES = Platform.OS === 'ios' ? Constants.NSCachesDirectory : '';
ExportedComponent.generatePathId = SketchCanvas.generatePathId;

export default ExportedComponent;
