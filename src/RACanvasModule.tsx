
import Animated from 'react-native-reanimated';
import { MODULE, VIEW_MANAGER } from './RCanvasModule';
import { Commands, PathIntersectionResponse } from './types';

const { callback, cond, Value, proc, neq, invoke, dispatch, concat, map, onChange } = Animated;

export const pathIdMem = new Value(0);

export const stringId = proc((id) => concat('RACanvasPath', id));

export const safeDispatch = proc((tag, node) => cond(neq(tag, 0), node));

export const startPath = proc((tag, id, color, width) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.startPath, tag, id, color, width));
});

export const addPoint = proc((tag, id, x, y) => {
  return safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.addPoint, tag, x, y, id));
});

export const endPath = proc((tag, id) => safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.endPath, tag)));

export const setPathWidth = proc((tag, id, width) => safeDispatch(tag, dispatch(VIEW_MANAGER, Commands.setAttributes, tag, id, map({ width }))));

export const getPath = proc((tag, id, cb) => {
  return safeDispatch(tag, invoke(MODULE, 'getPath', tag, id, 0, cb, callback()));
});

export const isPointOnPath = proc((tag, x, y, topPath) => {
  const cb = callback<PathIntersectionResponse>(map.fromEnd([topPath]), 0);
  const isPointOnPath = invoke(MODULE, 'isPointOnPath', tag, x, y, new Value(), cb, callback());
  return safeDispatch(
    tag,
    [
      onChange(x, isPointOnPath),
      onChange(y, isPointOnPath),
    ]
  );
});
