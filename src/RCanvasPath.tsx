'use strict';

import React, { Ref, useMemo } from 'react';
import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import { generatePathId, useStrokeColor } from './RCanvasBase';
import { PATH_VIEW_MANAGER } from './RCanvasModule';

const { createAnimatedComponent } = Animated;

const NativeRCanvasPath = createAnimatedComponent(requireNativeComponent(PATH_VIEW_MANAGER));

function RCanvasPathBase(props: any, ref: Ref<any>) {
  const strokeColor = useStrokeColor(props.strokeColor);
  useMemo(() => {
    if (__DEV__ && props.index && !(props.index instanceof Animated.Node)) {
      console.warn(`RCanvasPath received bad 'index' prop, expected Animated.Node`);
    }
  }, [props.index]);

  return (
    <NativeRCanvasPath
      id={generatePathId()}
      {...props}
      ref={ref}
      strokeColor={strokeColor}
    />
  )
}

const RCanvasPath = React.forwardRef(RCanvasPathBase);
RCanvasPath.displayName = 'RCanvasPath';

export default RCanvasPath;