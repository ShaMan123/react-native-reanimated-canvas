'use strict';

import _ from 'lodash';
import { MutableRefObject, useMemo } from 'react';
import { findNodeHandle, NativeModules, Platform, UIManager } from 'react-native';
import { Commands, RCanvasRef } from './types';

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

export function isPointOnPath(handle: number, x: number, y: number): Promise<string[]>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number): Promise<boolean>
export function isPointOnPath(handle: number, x: number, y: number, pathId: number, callback: (error: any, result?: boolean) => void): void
export function isPointOnPath<T, R extends T extends number ? boolean : Array<number>>(
  handle: number,
  x: number,
  y: number,
  pathId?: T,
  onSuccess?: (result: R) => void,
  onFail?: (error: any) => void
) {
  const nativeX = x;
  const nativeY = y;
  const normalizedPathId = typeof pathId === 'number' ? pathId : null;
  const nativeMethod = ((onSuccess: (result: R) => void, onFail: (error: any) => void) => {
    return NativeModuleManager.isPointOnPath(handle, nativeX, nativeY, normalizedPathId, onSuccess, onFail);
  });

  return promisify(nativeMethod, onSuccess, onFail);
};

export function setTouchRadius<R extends boolean, E extends Error>(
  handle: number,
  radius: number,
  onSuccess?: (result: R) => void,
  onFail?: (error: E) => void
) {
  const r = typeof radius === 'number' ? radius : 0;

  const nativeMethod = (onSuccess: (result: R) => void, onFail: (error: E) => void) => {
    if (Platform.OS === 'ios') {
      //  need to implement native callback 
      //SketchCanvasManager.setTouchRadius(handle, r, callback);
      throw new Error('Sketch Canvas: `setTouchRadius` isn\'t implemented yet');
    } else {
      NativeModuleManager.setTouchRadius(handle, r, onSuccess, onFail);
    }
  };

  return promisify(nativeMethod, onSuccess, onFail);
}

function promisify<R, E>(method: (onSuccess: (result: R) => void, onFail: (error: E) => void) => void, onSuccess?: (result: R) => void, onFail?: (error: E) => void) {
  if (onSuccess && onFail) {
    return method(onSuccess, onFail);
  } else if (onSuccess) {
    return method(onSuccess, console.error);
  } else {
    return new Promise((resolve, reject) => {
      method(resolve, reject)
    });
  }
}

export function useModule(ref: MutableRefObject<RCanvasRef>): Pick<RCanvasRef, 'dispatchCommand' | 'isPointOnPath' | 'setTouchRadius'> {
  return useMemo(() => {
    const methods = { dispatchCommand, isPointOnPath, setTouchRadius };
    //@ts-ignore
    return _.mapValues(methods, (m) => (...args: any[]) => m(findNodeHandle(ref.current), ...args));
  }, [ref]);
}