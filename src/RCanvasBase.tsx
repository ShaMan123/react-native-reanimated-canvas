'use strict';

import * as _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { findNodeHandle, LayoutChangeEvent, processColor, requireNativeComponent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { requestPermissions } from './handlePermissions';
import { useModule, VIEW_MANAGER } from './RCanvasModule';
import { Commands, PathData, PathsChangeEvent, RCanvasProperties, RCanvasRef, StrokeEndEvent, StrokeStartEvent } from './types';

const { createAnimatedComponent } = Animated;

const basicRect = { left: 0, top: 0, right: 0, bottom: 0 };

function useHitSlop(hitSlop: RCanvasProperties['hitSlop']) {
  return useMemo(() => {
    let rect;
    if (typeof hitSlop === 'number') {
      rect = _.mapValues(basicRect, () => hitSlop)
    } else {
      rect = _.pick(hitSlop, _.keys(basicRect));
      if (hitSlop) {
        if (hitSlop.vertical) {
          rect.top = rect.bottom = hitSlop.vertical;
        }
        if (hitSlop.horizontal) {
          rect.left = rect.right = hitSlop.horizontal;
        }
      }
    }

    return rect;
  }, [hitSlop]);
}

const RNativeCanvas = createAnimatedComponent(requireNativeComponent(VIEW_MANAGER));

export function generatePathId() {
  return _.uniqueId('RCanvasPath');
}

function useRefGetter<T, R = T>(initialValue?: T, action: (ref: T) => R = (current) => (current as unknown as R)) {
  const ref = useRef(initialValue);
  return useMemo(() =>
    ({
      ref,
      set: (value?: T) => (ref.current = value),
      value: () => action(ref.current as T),
      current: () => ref.current
    }),
    [ref]
  );
}

export function processColorProp(value: any) {
  return value instanceof Animated.Node ? value : processColor(value);
}

export function useStrokeColor(value: any) {
  return useMemo(() => processColorProp(value), [value]);
}

function useEventProp<TArgs extends any[], T extends (...args: TArgs) => (any | void)>(callback: T, prop?: T | Animated.Node<any>) {
  const cb = useCallback((...args: TArgs) => {
    callback(...args);
    typeof prop === 'function' && prop(...args);
  }, [callback, prop]);
  return useMemo(() =>
    prop instanceof Animated.Node ?
      [callback, prop] :
      cb,
    [prop, callback, cb]
  );
}

function RCanvasBase(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  const {
    strokeWidth
  } = props;

  const strokeColor = useStrokeColor(props.strokeColor);
  const hitSlop = useHitSlop(props.hitSlop);

  const initialized = useRefGetter(false);
  const size = useRefGetter({ width: 0, height: 0 });
  const node = useRefGetter(null as any, (current) => current && current.getNode());
  const currentPathId = useRefGetter<string>();
  const paths = useRefGetter([] as PathData[]);
  const pathsToProcess = useRefGetter<PathData[]>([]);

  const module = useModule(node.ref);
  const { dispatchCommand } = module;

  const findPath = useCallback((pathId: string) =>
    _.find(paths.value(), (p) => p.id === pathId),
    [paths]
  );

  const currentPath = useCallback(() =>
    findPath(currentPathId.value()),
    [findPath, currentPathId]
  );

  const addPaths = useCallback((data: PathData[]) => {
    if (initialized.value()) {
      const parsedPaths = data.map((d) => {
        if (_.isNil(findPath(d.id))) paths.set(_.concat(paths.value(), d));
        const scaler = 1;    //size().width / data.size.width;
        return [
          d.id,
          typeof d.color === 'number' ? d.color : processColor(d.color),
          d.width,
          _.map(d.points, (p) => {
            return _.mapValues(p, (val) => val * scaler);
          })
        ];
      });

      parsedPaths.length > 0 && dispatchCommand(Commands.addPaths, parsedPaths);
    }
    else {
      const addPaths = _.differenceBy(data, pathsToProcess.value(), 'id');
      pathsToProcess.set(_.concat(pathsToProcess.value(), addPaths));
    }
  },
    [initialized, dispatchCommand, findPath, paths, pathsToProcess, size]
  );

  const addPath = useCallback((data: PathData) =>
    addPaths([data]),
    [addPaths]
  );

  const deletePaths = useCallback((pathIds: string[]) => {
    dispatchCommand(Commands.deletePaths, pathIds);
  }, [paths, paths, dispatchCommand]);

  const deletePath = useCallback((id: string) =>
    deletePaths([id]),
    [deletePaths]
  );

  const getPaths = useCallback(() =>
    paths.value(),
    [paths]
  );

  const startPath = useCallback((x: number, y: number, pathId: string = generatePathId()) => {
    currentPathId.set(pathId);
    const state = {
      id: pathId,
      color: typeof strokeColor === 'number' ? strokeColor : null,
      width: typeof strokeWidth === 'number' ? strokeWidth : null,
      points: [{ x, y }]
    };

    dispatchCommand(Commands.startPath, _.values(state));
  },
    [strokeColor, strokeWidth]
  );

  const addPoint = useCallback((x: number, y: number, pathId: string = currentPathId.value()) =>
    pathId && dispatchCommand(Commands.addPoint, [x, y, pathId]),
    [currentPathId, dispatchCommand]
  );

  const endPath = useCallback(() =>
    currentPathId.value() && dispatchCommand(Commands.endPath),
    [currentPathId, dispatchCommand]
  );

  const clear = useCallback(() => {
    dispatchCommand(Commands.clear);
  }, []);

  const setPathAttributes = useCallback((pathId: string, attr: { width: number, color: string | number }) => {
    if (typeof attr.color === 'string') {
      attr.color = processColor(attr.color);
    }
    dispatchCommand(Commands.setAttributes, [pathId, attr]);
  }, []);

  const setNativeProps = useCallback((props) =>
    node.value() && node.value().setNativeProps(props),
    [node]
  );

  useImperativeHandle(forwardedRef, () =>
    _.assign(node.value(), {
      ...module,
      addPath,
      addPaths,
      deletePath,
      deletePaths,
      getPaths,
      currentPath,
      startPath,
      addPoint,
      endPath,
      clear,
      setPathAttributes,
      setNativeProps,
      getNode: () => node.value(),
      handle: findNodeHandle(node.value()),
      module() {
        return this;
      }
    }),
    [
      module,
      addPath,
      addPaths,
      deletePath,
      deletePaths,
      getPaths,
      currentPath,
      startPath,
      addPoint,
      endPath,
      clear,
      setPathAttributes,
      setNativeProps,
      node
    ]
  );

  useEffect(() => {
    requestPermissions(
      props.permissionDialogTitle || '',
      props.permissionDialogMessage || '',
    );
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.set({ width, height });
    initialized.set(true);
    addPaths(pathsToProcess.value());
  }, [size, initialized, pathsToProcess]);

  const onStrokeStart = useCallback((e: StrokeStartEvent) => {
    currentPathId.set(e.nativeEvent.id);
  }, [currentPathId]);

  const onStrokeEnd = useCallback((e: StrokeEndEvent) => {
    paths.set(_.concat(paths.value(), e.nativeEvent));
    currentPathId.set();
  }, [paths, currentPathId]);

  const onPathsChange = useCallback((e: PathsChangeEvent) => {
    const pathIds = e.nativeEvent.paths;
    paths.set(_.differenceWith(paths.value(), pathIds, (a, b) => a.id === b));
  }, [paths]);

  return (
    <RNativeCanvas
      {...props}
      ref={node.ref}
      onLayout={useEventProp(onLayout, props.onLayout)}
      onStrokeStart={useEventProp(onStrokeStart, props.onStrokeStart)}
      onStrokeEnd={useEventProp(onStrokeEnd, props.onStrokeEnd)}
      onPathsChange={useEventProp(onPathsChange, props.onPathsChange)}
      strokeColor={strokeColor}
      hitSlop={hitSlop}
    >
      <View style={StyleSheet.absoluteFill}>
        {props.children}
      </View>
    </RNativeCanvas>
  )
}

const ForwardedRCanvasBase = forwardRef(RCanvasBase);
ForwardedRCanvasBase.defaultProps = {
  strokeColor: 'black',
  strokeWidth: 5,
  touchEnabled: true,
  hitSlop: 20,

  permissionDialogTitle: '',
  permissionDialogMessage: '',

  hardwareAccelerated: false,
  useNativeDriver: false
} as RCanvasProperties;
ForwardedRCanvasBase.displayName = '() => RCanvasBase'

export default ForwardedRCanvasBase;
