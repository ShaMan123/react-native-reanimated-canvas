'use strict';

import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import { PATH_VIEW_MANAGER } from './RCanvasModule';
import { Ref, useMemo } from 'react';
import React from 'react';
import { processColorProp } from './RCanvasBase';

const { createAnimatedComponent } = Animated;

const NativeRCanvasPath = createAnimatedComponent(requireNativeComponent(PATH_VIEW_MANAGER));

function RCanvasPathBase(props: any, ref: Ref<any>) {
  const strokeColor = useMemo(() => processColorProp(props.strokeColor), [props.strokeColor]);
  useMemo(() => {
    if (__DEV__ && !(props.index instanceof Animated.Node)) {
      console.warn(`RCanvasPath received bad props 'index', expected Animated.Node`);
    }
  }, [props.index]);

  return (
    <NativeRCanvasPath
      {...props}
      ref={ref}
      strokeColor={strokeColor}
    />
  )
}

const RCanvasPath = React.forwardRef(RCanvasPathBase);
RCanvasPath.displayName = 'RCanvasPath';

export default RCanvasPath;