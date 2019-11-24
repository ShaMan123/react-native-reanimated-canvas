'use strict';

import _ from 'lodash';
import { MutableRefObject, useMemo } from 'react';
import { findNodeHandle, NativeModules, Platform, UIManager } from 'react-native';
import { Commands, RCanvasRef } from './types';

export const VIEW_MANAGER = 'ReanimatedCanvasManager';
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
export function isPointOnPath<T, R extends T extends number ? boolean : Array<number>, C extends (error: any, result?: R) => void>(
  handle: number,
  x: number,
  y: number,
  pathId?: T,
  callback?: C
) {
  const nativeX = x;
  const nativeY = y;
  const normalizedPathId = typeof pathId === 'number' ? pathId : null;
  const nativeMethod = (callback: (error: any, result?: R) => void) => {
    return NativeModuleManager.isPointOnPath(handle, nativeX, nativeY, normalizedPathId, callback);
  };

  if (callback) {
    nativeMethod(callback);
  }
  else {
    return new Promise((resolve, reject) => {
      nativeMethod((err, success) => {
        if (err) reject(err);
        resolve(success);
      });
    }) as Promise<R>;
  }
};

export function setTouchRadius(handle: number, radius: number, callback: (error: any, result?: boolean) => void) {
  const r = typeof radius === 'number' ? radius : 0;

  const nativeMethod = (callback: (error: any, result?: boolean) => void) => {
    if (Platform.OS === 'ios') {
      //  need to implement native callback 
      //SketchCanvasManager.setTouchRadius(handle, r, callback);
      throw new Error('Sketch Canvas: `setTouchRadius` isn\'t implemented yet');
    } else {
      NativeModuleManager.setTouchRadius(handle, r, callback);
    }
  };

  if (callback) {
    nativeMethod(callback);
  }
  else {
    return new Promise((resolve, reject) => {
      nativeMethod((err, success) => {
        if (err) reject(err);
        resolve(success);
      });
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