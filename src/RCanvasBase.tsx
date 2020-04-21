'RCanvasBaseModule';

import _ from 'lodash';
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useMemo } from 'react';
import { findNodeHandle, processColor, requireNativeComponent, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useModule, VIEW_MANAGER } from './RCanvasBaseModule';
import { ChangeEvent, RPathData, RCanvasProperties, RCanvasRef, RPathDataBase, PathChangeData } from './types';
import { generatePathId, processColorProp, useEventProp, useHitSlop, useRefGetter } from './util';

const RNativeCanvas = Animated.createAnimatedComponent(requireNativeComponent(VIEW_MANAGER));

function RCanvasBase(props: RCanvasProperties, forwardedRef: Ref<RCanvasRef>) {
  //const [ignored, forceUpdate] = useReducer<never>((x: number) => x + 1, 0);
  const hitSlop = useHitSlop(props.hitSlop);
  const node = useRefGetter(null as any, (current) => current && current.getNode());
  const paths = useRefGetter([] as RPathData[]);
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
    const untouchedPaths = _.differenceWith(paths.value(), _.concat(changed, removed), (a, b) => a.id === b);
    const updatedPaths = _.concat(untouchedPaths, _.intersectionWith(changedPaths, _.concat(added, changed), (a, b) => a.id === b));
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
      update(data: PathChangeData[]) {
        const update = _.map(data, ({ value: path, id }) => {
          let value = path;
          if (path) {
            value = _.cloneDeep(path);
            if (value.strokeColor) value.strokeColor = processColor(path.strokeColor);
            //@ts-ignore
            if (!value.id) value.id = id;
          }
          return { value, id };
        });

        const untouchedPaths = _.differenceWith(paths.value(), update, (a, b) => a.id === b.id);
        paths.set(_.concat(untouchedPaths, _.compact(_.map(update, 'value'))));
        module.update(update);
      },
      getPaths() {
        return paths.value();
      },
      getPath(id: number) {
        return _.find(paths.value(), (p) => p.id === id);
      },
      alloc(id: number = generatePathId(), color = strokeColor.value(), width = strokeWidth.value()) {
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
      hitSlop={hitSlop}
      resizeMode={props.resizeMode}
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
  resizeMode: 'cover',
  renderToHardwareTextureAndroid: true
} as RCanvasProperties;
ForwardedRCanvasBase.displayName = 'Forwarded(RCanvasBase)'

export default ForwardedRCanvasBase;
