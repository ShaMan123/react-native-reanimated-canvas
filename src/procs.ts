import { Platform } from "react-native";
import Animated, {  } from "react-native-reanimated";

const {
  invoke,
  proc,
  callback
} = Animated;

function isPointOnPath(
  tag: Animated.Adaptable<number>,
  x: Animated.Adaptable<number>,
  y: Animated.Adaptable<number>,
  pathId: Animated.Adaptable<number>,
  flag: Animated.Adaptable<0 | 1>
) {
  return isPointOnPathProc(tag, x, y, pathId, callback(0, flag));
}

export const isPointOnPathProc = proc((
  tag: Animated.Adaptable<number>,
  x: Animated.Adaptable<number>,
  y: Animated.Adaptable<number>,
  pathId: Animated.Adaptable<number>,
  callback: typeof callback
) => {
  const module = Platform.select({
    ios: 'RNSketchCanvasManager',
    default: 'SketchCanvasModule'
  });
  const method = 'isPointOnPath';
  return invoke(module, method, tag, x, y, pathId, callback);
})