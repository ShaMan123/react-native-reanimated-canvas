import _ from 'lodash';
import { MutableRefObject, useMemo } from 'react';
import { findNodeHandle, NativeModules, Platform, processColor, UIManager } from 'react-native';
import { Commands, Point, RCanvasRef, RPathData, RPathAttributes, PathChangeData } from './types';
import { processColorProp, parseHitSlop } from './util';

export const VIEW_MANAGER = 'ReanimatedCanvasManager';
export const PATH_VIEW_MANAGER = 'ReanimatedPathManager';
export const MODULE = 'ReanimatedCanvasModule';

const NativeModuleManager = Platform.select({
  ios: NativeModules[VIEW_MANAGER],
  default: NativeModules[MODULE]
});

export function dispatchCommand(tag: number, command: Commands, data: any[] = []) {
  UIManager.dispatchViewManagerCommand(tag, command, data);
}

export function alloc(tag: number, pathId: number, strokeColor: any, strokeWidth: number) {
  dispatchCommand(tag, Commands.alloc, [pathId, processColorProp(strokeColor), strokeWidth]);
}

export function drawPoint(tag: number, pathId: number, point: Point) {
  dispatchCommand(tag, Commands.drawPoint, [pathId, point.x, point.y]);
}

export function endInteraction(tag: number, pathId: number) {
  dispatchCommand(tag, Commands.endInteraction, [pathId]);
}

export function clear(tag: number) {
  dispatchCommand(tag, Commands.clear);
}

export function update(tag: number, updates: PathChangeData[]) {
  const parsedUpdates = _.map(updates, ({ value: path, id }) => {
    let value = path;
    if (path) {
      value = _.cloneDeep(path);
      if (value.strokeColor) value.strokeColor = processColor(path.strokeColor);
      //@ts-ignore
      if (!value.id) value.id = id;
    }
    return { value, id };
  });
  dispatchCommand(tag, Commands.update, [parsedUpdates]);
}

export function setPathAttributes(tag: number, pathId: number, attr: RPathAttributes) {
  if (typeof attr.strokeColor === 'string') {
    attr.strokeColor = processColor(attr.strokeColor);
  }
  if (attr.hitSlop !== null) {
    attr.hitSlop = parseHitSlop(attr.hitSlop);
  }

  dispatchCommand(tag, Commands.setAttributes, [pathId, attr]);
}

export function isPointOnPath(handle: number, x: number, y: number): Promise<number[]>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number): Promise<boolean>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number, callback: (error: any, result?: boolean) => void): void
export function isPointOnPath<T, R extends T extends number ? boolean : number[]>(
  handle: number,
  x: number,
  y: number,
  pathId?: T,
  onSuccess?: (result: R) => void,
  onFailure?: (error: any) => void
) {
  const nativeX = x;
  const nativeY = y;
  const normalizedPathId = typeof pathId === 'number' ? pathId : null;
  const nativeMethod = ((onSuccess: (result: R) => void, onFailure: (error: any) => void) => {
    return NativeModuleManager.isPointOnPath(handle, nativeX, nativeY, normalizedPathId, onSuccess, onFailure);
  });

  return promisify(nativeMethod, onSuccess, onFailure);
};

export function save<R extends number, E extends Error>(
  handle: number,
  onSuccess?: (saveCount: R) => void,
  onFailure?: (error: E) => void
) {
  const nativeMethod = (onSuccess: (result: R) => void, onFailure: (error: E) => void) => {
    NativeModuleManager.save(handle, onSuccess, onFailure);
  };

  return promisify(nativeMethod, onSuccess, onFailure);
}

export function restore<R extends void, E extends Error>(
  handle: number,
  saveCount?: number,
  onSuccess?: (result: R) => void,
  onFailure?: (error: E) => void
) {
  const nativeMethod = (onSuccess: (result: R) => void, onFailure: (error: E) => void) => {
    NativeModuleManager.restore(handle, saveCount || -1, onSuccess, onFailure);
  };

  return promisify(nativeMethod, onSuccess, onFailure);
}

function promisify<R, E>(method: (onSuccess: (result: R) => void, onFailure: (error: E) => void) => void, onSuccess?: (result: R) => void, onFailure?: (error: E) => void) {
  if (onSuccess && onFailure) {
    return method(onSuccess, onFailure);
  } else if (onSuccess) {
    return method(onSuccess, console.error);
  } else {
    return new Promise((resolve, reject) => {
      method(resolve, reject)
    });
  }
}

type ModuleMethods = 'isPointOnPath' | 'save' | 'restore';
type ViewManagerCommands = 'dispatchCommand' | 'startPath' | 'addPoint' | 'endPath' | 'clear' | 'update' | 'setPathAttributes';

export function useModule(ref: MutableRefObject<RCanvasRef>)/*: Pick<RCanvasRef, ModuleMethods | ViewManagerCommands>*/ {
  return useMemo(() => {
    const methods = { dispatchCommand, alloc, drawPoint, endInteraction, clear, update, setPathAttributes, isPointOnPath, save, restore };
    //@ts-ignore
    return _.mapValues(methods, (m) => (...args: any[]) => m(findNodeHandle(ref.current), ...args));
  }, [ref]);
}