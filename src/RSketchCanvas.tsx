'use strict';

import * as _ from 'lodash';
import React, { Component, SyntheticEvent, useMemo, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import { NativeModules, PanResponder, PixelRatio, Platform, processColor, requireNativeComponent, UIManager, findNodeHandle, ViewProps, PanResponderInstance, NativeTouchEvent, View } from 'react-native';
import { NativeViewGestureHandler, PanGestureHandler, State as GHState, GestureHandlerProperties, PanGestureHandlerProperties } from 'react-native-gesture-handler';
import { requestPermissions } from './handlePermissions';
import { SketchCanvasProps, CanvasText, Path, PathData, NativeSketchEvent, ImageType } from '../index';

const RNSketchCanvas = requireNativeComponent('RNSketchCanvas');

interface SketchCanvasState {
  text: string
};

type SketchCanvasProperties = SketchCanvasProps & ViewProps & GestureHandlerProperties & PanGestureHandlerProperties;

const SketchCanvasManager = NativeModules.RNSketchCanvasManager || {};
const { Commands, Constants } = UIManager.getViewManagerConfig('RNSketchCanvas');

function generatePathId() {
  return _.uniqueId('SketchCanvasPath');
}

function processText(text: Required<CanvasText>[] | null) {
  text && text.forEach(t => t.fontColor = processColor(t.fontColor));
  return text;
}

function useRefGetter<T, R = T>(initialValue: T, action: (ref: T) => R = (current) => (current as unknown as R)) {
  const ref = useRef(initialValue);
  const getter = useCallback(() =>
    action(ref.current),
    [ref, action]
  );

  return [ref, getter] as [typeof ref, typeof getter];
}

function RSketchCanvas(props: SketchCanvasProperties) {
  const {
    strokeColor,
    strokeWidth,
    text: textP,
    permissionDialogMessage,
    permissionDialogTitle
  } = props;

  const text = useMemo(() =>
    processText(textP ? textP.map(t => Object.assign({}, t)) : null),
    [textP]
  );

  const [_initialized, isInitialized] = useRefGetter(false);
  const [_size, size] = useRefGetter({ width: 0, height: 0 });
  const [ref, handle] = useRefGetter(null as any, (current) => findNodeHandle(current));
  const [_currentPath, currentPath] = useRefGetter<string>();
  const [_paths, paths] = useRefGetter([] as Path[]);
  const [_path, path] = useRefGetter({} as PathData);
  const [_pathsToProcess, pathsToProcess] = useRefGetter<Path[]>([]);

  const dispatchCommand = useCallback((command: number, data: any[]) =>
    UIManager.dispatchViewManagerCommand(handle(), command, data),
    [handle]
  );

  const findPath = useCallback((pathId: string) =>
    _.find(paths(), (p) => _.isEqual(p.path.id, pathId)),
    [paths]
  );

  const addPaths = useCallback((data: Path[]) => {
    if (isInitialized()) {
      const parsedPaths = data.map((data) => {
        if (_.isNil(findPath(data.path.id))) paths().push(data);
        const scaler = size().width / data.size.width;
        return [
          data.path.id,
          processColor(data.path.color),
          data.path.width,
          _.map(data.path.points, (p) => {
            return _.mapValues(p, (val) => val * scaler);
          })
        ];
      });

      dispatchCommand(Commands.addPaths, parsedPaths);
    }
    else {
      data.map((data) => pathsToProcess().filter(p => p.path.id === data.path.id).length === 0 && pathsToProcess().push(data));
    }
  },
    [isInitialized, dispatchCommand, findPath, paths, pathsToProcess, size]
  );

  const addPath = useCallback((data: Path) =>
    addPaths([data]),
    [addPaths]
  );

  const deletePaths = useCallback((pathIds: string[]) => {
    _paths.current = paths()
      .filter(p => pathIds.findIndex(id => p.path.id === id) === -1);
    dispatchCommand(Commands.deletePaths, pathIds);
  }, [_paths, paths, dispatchCommand]);

  const deletePath = useCallback((id: string) =>
    deletePaths([id]),
    [deletePaths]
  );

  const getPaths = useCallback(() =>
    _.cloneDeep(paths()),
    [paths]
  );

  const startPath = useCallback((x: number, y: number) => {
    _currentPath.current = generatePathId();
    const state = {
      id: currentPath(),
      color: processColor(strokeColor),
      width: strokeWidth,
      //points: []
    };

    dispatchCommand(Commands.newPath, _.values(state));
    //props.onStrokeStart && props.onStrokeStart(path());
    /*
    _path.current = {
      id: generatePathId(),
      color: strokeColor,
      width: strokeWidth,
      points: []
    };

    const data = [
      path().id,
      processColor(path().color),
      path().width
    ]

    dispatchCommand(Commands.newPath, data);
    props.onStrokeStart && props.onStrokeStart(path());
    */
  },
    [_path, path]
  );

  const addPoint = useCallback((x: number, y: number) => {
    if (currentPath()) {
      dispatchCommand(Commands.addPoint, [x, y]); //parseFloat(x.toFixed(2))
      //this._path.points.push({ x: pointX, y: pointY });
      //this.props.onStrokeChanged && this.props.onStrokeChanged({ x: pointX, y: pointY, id: this._path.id });
    }
  },
    [currentPath, dispatchCommand]
  );

  const endPath = useCallback(() => {
    if (currentPath()) {
      dispatchCommand(Commands.endPath, []);
      _currentPath = null;
      /*
      const o = {
        path: this._path,
        size: this._size,
        drawer: this.props.user
      };
      this._paths.push(o);
      this.props.onStrokeEnd && this.props.onStrokeEnd(this._path);
      this._path = null;
      */
    }
  },
    [_currentPath, currentPath, dispatchCommand]
  );
  
  useEffect(() => {
    requestPermissions(
      permissionDialogTitle,
      permissionDialogMessage,
    ).then((isStoragePermissionAuthorized) => { });
  }, []);
}

class SketchCanvas extends Component<SketchCanvasProperties, SketchCanvasState> {


  static generatePathId() {
    return _.uniqueId('SketchCanvasPath');
  }

  _pathsToProcess: Path[] = [];
  _paths: Path[] = [];
  _path: PathData | null = null;
  _handle = null;
  _ref = null;
  _screenScale = Platform.OS === 'ios' ? 1 : PixelRatio.get();
  _offset = { x: 0, y: 0 };
  _size = { width: 0, height: 0 };
  _initialized = false;


  

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

const defaultProps: SketchCanvasProperties = {
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

ExportedComponent.MAIN_BUNDLE = Platform.OS === 'ios' ? Constants.MainBundlePath : '';
ExportedComponent.DOCUMENT = Platform.OS === 'ios' ? Constants.NSDocumentDirectory : '';
ExportedComponent.LIBRARY = Platform.OS === 'ios' ? Constants.NSLibraryDirectory : '';
ExportedComponent.CACHES = Platform.OS === 'ios' ? Constants.NSCachesDirectory : '';
ExportedComponent.generatePathId = SketchCanvas.generatePathId;

export default ExportedComponent;
