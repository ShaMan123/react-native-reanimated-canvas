'use strict';

import * as _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useRef, MutableRefObject } from 'react';
import { findNodeHandle, NativeSyntheticEvent, processColor, requireNativeComponent, LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { requestPermissions } from './handlePermissions';
import { useModule, VIEW_MANAGER } from './RCanvasModule';
import { CanvasText, Commands, PathData, RCanvasProperties, RCanvasRef } from './types';

const { createAnimatedComponent } = Animated;

const RNativeCanvas = createAnimatedComponent(requireNativeComponent(VIEW_MANAGER));

export function generatePathId() {
  return _.uniqueId('RCanvasPath');
}

function processText(text: CanvasText[] | null) {
  text && text.forEach(t => t.fontColor = processColor(t.fontColor));
  return text;
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

function RCanvasBase(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  const {
    onLayout: onLayoutP,
    onPathsChange,
    onSketchSaved,
    strokeColor: strokeColorP,
    strokeWidth,
    text: textP,
    permissionDialogMessage,
    permissionDialogTitle,
    user
  } = props;

  const strokeColor = useMemo(() => processColor(strokeColorP), [strokeColorP]);
  const text = useMemo(() =>
    processText(textP ? textP.map(t => Object.assign({}, t)) : null),
    [textP]
  );

  const initialized = useRefGetter(false);
  const size = useRefGetter({ width: 0, height: 0 });
  const node = useRefGetter(null as any, (current) => findNodeHandle(current));
  const currentPathId = useRefGetter<string>();
  const paths = useRefGetter([] as PathData[]);
  const pathsToProcess = useRefGetter<PathData[]>([]);

  const module = useModule(node.value());
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

      dispatchCommand(Commands.addPaths, parsedPaths);
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
    paths.set(_.differenceWith(paths.value(), pathIds, (a, b) => a.id === b));
    dispatchCommand(Commands.deletePaths, pathIds);
  }, [paths, paths, dispatchCommand]);

  const deletePath = useCallback((id: string) =>
    deletePaths([id]),
    [deletePaths]
  );

  const getPaths = useCallback(() =>
    _.cloneDeep(paths.value()),
    [paths]
  );

  const startPath = useCallback((x: number, y: number) => {
    const id = generatePathId();
    currentPathId.set(id);
    const state = {
      id,
      color: strokeColor,
      width: strokeWidth,
      points: [{ x, y }]
    };

    dispatchCommand(Commands.startPath, _.values(state));
  },
    [strokeColor, strokeWidth]
  );

  const addPoint = useCallback((x: number, y: number) =>
    currentPathId.value() && dispatchCommand(Commands.addPoint, [x, y]),
    [currentPathId, dispatchCommand]
  );

  const endPath = useCallback(() =>
    currentPathId.value() && dispatchCommand(Commands.endPath),
    [currentPathId, dispatchCommand]
  );

  const clear = useCallback(() => {
    paths.set([]);
    currentPathId.set();
    dispatchCommand(Commands.clear);
  }, [paths, currentPathId]);

  const undo = useCallback(() => {
    throw new Error('undo not implemented');
    /*
    let lastId: string | null = null;
    paths.value().forEach(d => lastId = d.drawer === user ? d.path.id : lastId);
    if (lastId !== null) deletePath(lastId);
    return lastId;
    */
  }, [paths, user, deletePath]);

  const setNativeProps = useCallback((props) =>
    node.current() && node.current().setNativeProps(props),
    [node]
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    size.set({ width, height })
    initialized.set(true);
    addPaths(pathsToProcess.value());
    onLayoutP && onLayoutP(e);
  }, [size, initialized, pathsToProcess, onLayoutP]);

  const onChange = useCallback((e: NativeSyntheticEvent<any>) => {
    if (!initialized.value()) return;
    if (e.nativeEvent.hasOwnProperty('pathsUpdate') && onPathsChange) {
      //onPathsChange(e);
    } else if (e.nativeEvent.hasOwnProperty('success') && onSketchSaved) {
      onSketchSaved(e);
    }
  }, [onPathsChange, onSketchSaved, initialized]);

  useEffect(() => {
    requestPermissions(
      permissionDialogTitle,
      permissionDialogMessage,
    );
  }, []);

  useImperativeHandle(forwardedRef, () =>
    _.assign(_.has(node.current(), 'getNode') ? node.current().getNode() : node.current(), {
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
      undo,
      setNativeProps,
      getNode: node.ref,
      handle: node.value()
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
      undo,
      setNativeProps,
      node
    ]
  );

  const onStrokeStart = useCallback((e) => {
    currentPathId.set(e.nativeEvent.id);
  }, [currentPathId]);

  const onStrokeEnd = useCallback((e) => {
    paths.set(_.concat(paths.value(), e.nativeEvent));
    currentPathId.set();
  }, [paths, currentPathId]);

  return (
    <RNativeCanvas
      {...props}
      ref={node.ref}
      onLayout={onLayout}
      onChange={onChange}
      onStrokeStart={[onStrokeStart, props.onStrokeStart]}
      onStrokeEnd={[onStrokeEnd, props.onStrokeEnd]}
      text={text}
      strokeColor={strokeColor}
    />
  )
}

const ForwardedRCanvasBase = forwardRef(RCanvasBase);
ForwardedRCanvasBase.defaultProps = {
  strokeColor: 'transparent',
  strokeWidth: 3,
  touchEnabled: true,

  permissionDialogTitle: '',
  permissionDialogMessage: '',

  hardwareAccelerated: false,
  useNativeDriver: false
} as RCanvasProperties;
ForwardedRCanvasBase.displayName = '() => RCanvasBase'

export default ForwardedRCanvasBase;
