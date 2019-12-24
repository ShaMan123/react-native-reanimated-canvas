'use strict';

import React, { Ref, useMemo } from 'react';
import { requireNativeComponent } from 'react-native';
import Animated from 'react-native-reanimated';
import { PATH_VIEW_MANAGER } from './RCanvasModule';
import { RPathProperties } from './types';
import { useStrokeColor } from './util';

const RNativePath = Animated.createAnimatedComponent(requireNativeComponent(PATH_VIEW_MANAGER));

function RPathBase(props: RPathProperties, ref: Ref<any>) {
  const strokeColor = useStrokeColor(props.strokeColor);
  useMemo(() => {
    if (__DEV__ && props.index && !(props.index instanceof Animated.Node)) {
      console.warn(`RPath received bad 'index' prop, expected Animated.Node`);
    }
  }, [props.index]);

  return (
    <RNativePath
      {...props}
      ref={ref}
      strokeColor={strokeColor}
    />
  )
}

const RPath = React.forwardRef(RPathBase);
RPath.displayName = 'RPath';

export default RPath;