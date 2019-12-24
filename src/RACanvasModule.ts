
import Animated from 'react-native-reanimated';
import { MODULE, VIEW_MANAGER } from './RCanvasModule';
import { Commands, IntersectionResponse, Methods } from './types';

const { callback, cond, Value, proc, neq, invoke, dispatch, concat, map, onChange } = Animated;

export const pathIdMem = new Value(0);

export const stringId = proc((id) => concat('RACanvasPath', id));

export const safeDispatch = proc((tag, node) => cond(neq(tag as Animated.Adaptable<number>, 0), node));

export const alloc = proc((tag, id, strokeColor, strokeWidth) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.alloc, tag, id, strokeColor, strokeWidth));
});

export const drawPoint = proc((tag, id, x, y) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.drawPoint, tag, id, x, y));
});

export const endInteraction = proc((tag, id) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.endInteraction, tag, id));
});

export const setPathColor = proc((tag, id, strokeColor) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.setAttributes, tag, id, map({ strokeColor })));
});

export const setPathWidth = proc((tag, id, strokeWidth) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.setAttributes, tag, id, map({ strokeWidth })));
});

export const clear = proc((tag) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.clear, tag));
});

export const getPaths = proc((tag, id, cb) => {
  return safeDispatch(tag, invoke(MODULE, Methods.getPaths, tag, id, 0, cb, callback()));
});

export const isPointOnPath = proc((tag, x, y, topPath) => {
  const cb = callback<IntersectionResponse>(map.fromEnd([topPath]), 0);
  const isPointOnPath = invoke(MODULE, Methods.isPointOnPath, tag, x, y, new Value(), cb, callback());
  return safeDispatch(
    tag,
    [
      onChange(x, isPointOnPath),
      onChange(y, isPointOnPath),
    ]
  );
});

export const save = proc((tag, saveCount) => {
  return safeDispatch(tag, invoke(MODULE, Methods.save, tag, callback(saveCount), callback()));
});

export const restore = proc((tag, saveCount) => {
  return safeDispatch(tag, invoke(MODULE, Methods.restore, tag, saveCount, callback(), callback()));
});