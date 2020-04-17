import React, { Ref } from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { PATH_VIEW_MANAGER } from './RCanvasBaseModule';
import { RPathProperties } from './types';
import { generatePathId, useHitSlop } from './util';

const RNativePath = Animated.createAnimatedComponent(requireNativeComponent(PATH_VIEW_MANAGER));

function RPathBase(props: RPathProperties, ref: Ref<any>) {
  const hitSlop = useHitSlop(props.hitSlop);
  return (
    <RNativePath
      {...props}
      id={props.id || generatePathId()}
      hitSlop={hitSlop}
      style={[StyleSheet.absoluteFill, props.style]}
      ref={ref}
    />
  )
}

const RPath = React.forwardRef(RPathBase);
RPath.defaultProps = {
  renderToHardwareTextureAndroid: true,
  hitSlop: 20
}
RPath.displayName = 'RPath';

export default RPath;