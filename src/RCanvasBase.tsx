'use strict';

import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useMemo, useState, useReducer, ReactElement } from 'react';
import { findNodeHandle, LayoutChangeEvent, processColor, requireNativeComponent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useModule, VIEW_MANAGER } from './RCanvasModule';
import { PathData, PathsChangeEvent, RCanvasProperties, RCanvasRef, UpdateEvent } from './types';
import { generatePathId, useEventProp, useHitSlop, useRefGetter, processColorProp } from './util';

const { createAnimatedComponent } = Animated;

const RNativeCanvas = createAnimatedComponent(requireNativeComponent(VIEW_MANAGER));

function RCanvasBase(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  //const { strokeWidth } = props;
  //const strokeColor = useStrokeColor(props.strokeColor);
  const [ignored, forceUpdate] = useReducer<never>((x: number) => x + 1, 0);
  const hitSlop = useHitSlop(props.hitSlop);
  const node = useRefGetter(null as any, (current) => current && current.getNode());
  const currentPathId = useRefGetter<string>();
  const paths = useRefGetter([] as PathData[]);
  const updateContext = useRefGetter(new Date());
  const invalidPaths = useRefGetter([] as string[]);

  const strokeColor = useRefGetter(processColorProp(props.strokeColor));
  const strokeWidth = useRefGetter(props.strokeWidth);
  useMemo(() => {
    strokeColor.set(processColor(props.strokeColor));
    strokeWidth.set(props.strokeWidth);
  }, [props.strokeColor, props.strokeWidth]);

  const module = useModule(node.ref);

  const onPathsChange = useCallback((e: PathsChangeEvent) => {
    const pathIds = e.nativeEvent.paths;
    invalidPaths.set(_.concat(invalidPaths.value(), _.differenceWith(pathIds, paths.value(), (a, b) => a === b.id)));
    paths.set(_.intersectionWith(paths.value(), pathIds, (a, b) => a.id === b));
    console.log(e.nativeEvent, invalidPaths.value())
    forceUpdate();
  }, [paths]);

  const onUpdate = useCallback((e: UpdateEvent) => {
    console.log('incoming update', e.nativeEvent);
    paths.set(_.values(e.nativeEvent.paths));
    updateContext.set(new Date());
    let needsUpdate = false;
    if (typeof strokeColor.value() === 'number') {
      strokeColor.set(e.nativeEvent.strokeColor);
      needsUpdate = true;
    }
    if (typeof strokeWidth.value() === 'number') {
      strokeWidth.set(e.nativeEvent.strokeWidth);
      needsUpdate = true;
    }
    if (needsUpdate) {
      forceUpdate();
    }
  }, [paths, strokeColor, strokeWidth]);

  useImperativeHandle(forwardedRef, () =>
    _.assign(node.value(), {
      ...module,
      addPath(path: PathData) {
        this.addPaths([path]);
      },
      addPaths(data: PathData[]) {
        if (data.length === 0) return;
        paths.set(_.concat(paths.value(), _.differenceBy(paths.value(), data, 'id')));
        module.addPaths(data);
      },
      getPaths() {
        return paths.value();
      },
      getPath(id: string) {
        return _.find(paths.value(), (p) => p.id === id);
      },
      alloc(id: string = generatePathId(), color = strokeColor.value(), width = strokeWidth.value()) {
        module.alloc(
          id,
          typeof color === 'number' || typeof color === 'string' ? processColor(color) : null,
          typeof width === 'number' ? width : null
        );
        return id;
      },
      setNativeProps(props: RCanvasProperties) {
        node.value() && node.value().setNativeProps(props);
      },
      getNode() { return node.value(); },
      handle: findNodeHandle(node.value()),
      module() {
        return this;
      }
    }),
    [
      module,
      paths,
      strokeColor,
      strokeWidth,
      node
    ]
  );

  return (
    <RNativeCanvas
      {...props}
      ref={node.ref}
      onPathsChange={useEventProp(onPathsChange, props.onPathsChange)}
      onUpdate={onUpdate}
      strokeWidth={strokeWidth.value()}
      strokeColor={strokeColor.value()}
      hitSlop={hitSlop}
    >
      <View
        style={StyleSheet.absoluteFill}
      >
        {React.Children.map(props.children, (child: ReactElement) => {
          const isInvalid = _.find(invalidPaths.value(), (id) => child && id === child.key);
          console.log(child && child.key, isInvalid, invalidPaths.value())
          return isInvalid ? null : child;
        })}
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
  hardwareAccelerated: false,
  useNativeDriver: false
} as RCanvasProperties;
ForwardedRCanvasBase.displayName = '() => RCanvasBase'

export default ForwardedRCanvasBase;
