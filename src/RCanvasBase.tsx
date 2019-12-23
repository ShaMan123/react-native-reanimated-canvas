'use strict';

import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useMemo } from 'react';
import { findNodeHandle, processColor, requireNativeComponent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useModule, VIEW_MANAGER } from './RCanvasModule';
import { ChangeEvent, PathData, RCanvasProperties, RCanvasRef, PathDataBase } from './types';
import { generatePathId, processColorProp, useEventProp, useHitSlop, useRefGetter } from './util';

const RNativeCanvas = Animated.createAnimatedComponent(requireNativeComponent(VIEW_MANAGER));

function RCanvasBase(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  //const [ignored, forceUpdate] = useReducer<never>((x: number) => x + 1, 0);
  const hitSlop = useHitSlop(props.hitSlop);
  const node = useRefGetter(null as any, (current) => current && current.getNode());
  const paths = useRefGetter([] as PathData[]);
  const updateContext = useRefGetter(new Date());

  const strokeColor = useRefGetter(processColorProp(props.strokeColor));
  const strokeWidth = useRefGetter(props.strokeWidth);
  useMemo(() => {
    strokeColor.set(processColor(props.strokeColor));
    strokeWidth.set(props.strokeWidth);
  }, [props.strokeColor, props.strokeWidth]);

  const module = useModule(node.ref);

  const onChange = useCallback((e: ChangeEvent) => {
    const { state, paths: changedPaths, added, changed, removed } = e.nativeEvent;
    let updatedPaths = _.differenceWith(paths.value(), _.concat(changed, removed), (a, b) => a.id === b);
    updatedPaths = _.concat(updatedPaths, _.values(_.pick(changedPaths, _.concat(added, changed))) as PathData[]);
    paths.set(updatedPaths);

    updateContext.set(new Date());

    if (typeof strokeColor.value() === 'number') {
      strokeColor.set(state.strokeColor);
    }
    if (typeof strokeWidth.value() === 'number') {
      strokeWidth.set(state.strokeWidth);
    }
  }, [paths, strokeColor, strokeWidth]);

  useImperativeHandle(forwardedRef, () =>
    _.assign(node.value(), {
      ...module,
      update(data: { [id: string]: PathDataBase | null }) {
        const parsedPaths = _.mapValues(_.cloneDeep(data), (path, id) => {
          if (path) {
            if (path.strokeColor) path.strokeColor = processColor(path.strokeColor);
            //@ts-ignore
            if (!path.id) path.id = id;
          }
          return path as PathData | null;
        });

        const filteredPaths = _.filter(paths.value(), (path) => !_.has(data, path.id));
        paths.set(_.concat(filteredPaths, _.compact(_.values(parsedPaths))))
        module.update(parsedPaths);
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
      onChange={useEventProp(onChange, props.onChange)}
      ref={node.ref}
      strokeWidth={strokeWidth.value()}
      strokeColor={strokeColor.value()}
      hitSlop={hitSlop}
    >
      <View
        style={StyleSheet.absoluteFill}
      >
        {props.children}
      </View>
    </RNativeCanvas>
  )
}

const ForwardedRCanvasBase = forwardRef(RCanvasBase);
ForwardedRCanvasBase.defaultProps = {
  strokeColor: 'black',
  strokeWidth: 5,
  hitSlop: 20,
  renderToHardwareTextureAndroid: false
} as RCanvasProperties;
ForwardedRCanvasBase.displayName = 'Forwarded(RCanvasBase)'

export default ForwardedRCanvasBase;
