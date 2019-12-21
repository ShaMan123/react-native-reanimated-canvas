'use strict';

import _ from 'lodash';
import { MutableRefObject, useMemo } from 'react';
import { findNodeHandle, NativeModules, Platform, UIManager, processColor } from 'react-native';
import { Commands, RCanvasRef, Point, PathData } from './types';
import { processColorProp } from './util';

export const VIEW_MANAGER = 'ReanimatedCanvasManager';
export const PATH_VIEW_MANAGER = 'ReanimatedCanvasPathManager';
export const MODULE = 'ReanimatedCanvasModule';

const NativeModuleManager = Platform.select({
  ios: NativeModules[VIEW_MANAGER],
  default: NativeModules[MODULE]
});

export function dispatchCommand(tag: number, command: Commands, data: any[] = []) {
  UIManager.dispatchViewManagerCommand(tag, command, data);
}

export function alloc(tag: number, pathId: string, strokeColor: any, strokeWidth: number) {
  dispatchCommand(tag, Commands.alloc, [pathId, processColorProp(strokeColor), strokeWidth]);
}

export function drawPoint(tag: number, pathId: string, point: Point) {
  dispatchCommand(tag, Commands.drawPoint, [pathId, point.x, point.y]);
}

export function endInteraction(tag: number, pathId: string) {
  dispatchCommand(tag, Commands.endInteraction, [pathId]);
}

export function clear(tag: number) {
  dispatchCommand(tag, Commands.clear);
}

export function addPath(tag: number, path: PathData) {
  dispatchCommand(tag, Commands.addPaths, [path]);
}

export function addPaths(tag: number, paths: PathData[]) {
  if (paths.length === 0) return;
  const data = _.map(paths, (d) => {
    return [
      d.id,
      processColor(d.strokeColor),    //typeof d.strokeColor === 'number' ? d.strokeColor : processColor(d.strokeColor),
      d.strokeWidth,
      d.points
    ];
  });

  dispatchCommand(tag, Commands.addPaths, data);
}

export function removePath(tag: number, pathId: string): void
export function removePath(tag: number, path: PathData): void
export function removePath(tag: number, arg: string | PathData) {
  removePaths(tag, [arg]);
}

export function removePaths(tag: number, pathIds: string[]): void
export function removePaths(tag: number, paths: PathData[]): void
export function removePaths(tag: number, args: (string | PathData)[]): void
export function removePaths(tag: number, args: (string | PathData)[]) {
  dispatchCommand(tag, Commands.removePaths, _.map(args, (val) => typeof val === 'string' ? val : val.id));
}

export function setPathAttributes(tag: number, pathId: string, attr: { width: number, color: string | number }) {
  if (typeof attr.color === 'string') {
    attr.color = processColor(attr.color);
  }
  dispatchCommand(tag, Commands.setAttributes, [pathId, attr]);
}

export function isPointOnPath(handle: number, x: number, y: number): Promise<string[]>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number): Promise<boolean>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number, callback: (error: any, result?: boolean) => void): void
export function isPointOnPath<T, R extends T extends number ? boolean : Array<number>>(
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
type ViewManagerCommands = 'dispatchCommand' | 'startPath' | 'addPoint' | 'endPath' | 'clear' | 'addPath' | 'addPaths' | 'removePath' | 'removePaths' | 'setPathAttributes';

export function useModule(ref: MutableRefObject<RCanvasRef>)/*: Pick<RCanvasRef, ModuleMethods | ViewManagerCommands>*/ {
  return useMemo(() => {
    const methods = { dispatchCommand, alloc, drawPoint, endInteraction, clear, addPath, addPaths, removePath, removePaths, setPathAttributes, isPointOnPath, save, restore };
    //@ts-ignore
    return _.mapValues(methods, (m) => (...args: any[]) => m(findNodeHandle(ref.current), ...args));
  }, [ref]);
}