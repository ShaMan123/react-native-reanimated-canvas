import React, { Ref } from 'react';
import { requireNativeComponent, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { PATH_VIEW_MANAGER } from './RCanvasBaseModule';
import { RPathProperties } from './types';

const RNativePath = Animated.createAnimatedComponent(requireNativeComponent(PATH_VIEW_MANAGER));

function RPathBase(props: RPathProperties, ref: Ref<any>) {
  return (
    <RNativePath
      {...props}
      style={[StyleSheet.absoluteFill, props.style]}
      ref={ref}
    />
  )
}

const RPath = React.forwardRef(RPathBase);
RPath.defaultProps = {
  renderToHardwareTextureAndroid: true
}
RPath.displayName = 'RPath';

export default RPath;