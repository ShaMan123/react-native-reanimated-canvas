'use strict';

import _ from 'lodash';
import { useMemo, MutableRefObject } from 'react';
import { NativeModules, Platform, UIManager, requireNativeComponent, findNodeHandle } from 'react-native';
import { Commands, ImageType, RCanvasRef } from './types';

export const VIEW_MANAGER = 'ReanimatedCanvasManager';
export const MODULE = 'ReanimatedCanvasModule';

const NativeModuleManager = Platform.select({
  ios: NativeModules[VIEW_MANAGER],
  default: NativeModules[MODULE]
});

export function dispatchCommand(tag: number, command: Commands, data: any[] = []) {
  UIManager.dispatchViewManagerCommand(tag, command, data);
}

const { Constants } = UIManager.getViewManagerConfig(VIEW_MANAGER) as any;
export const MAIN_BUNDLE = Platform.OS === 'ios' ? Constants.MainBundlePath : '';
export const DOCUMENT = Platform.OS === 'ios' ? Constants.NSDocumentDirectory : '';
export const LIBRARY = Platform.OS === 'ios' ? Constants.NSLibraryDirectory : '';
export const CACHES = Platform.OS === 'ios' ? Constants.NSCachesDirectory : '';

/**
   * @param imageType "png" or "jpg"
   * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
   * @param includeText Set to `true` to include the text drawn from `Text`.
   * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
   */
export function save(
  handle: number,
  imageType: ImageType,
  transparent: boolean,
  folder: string,
  filename: string,
  includeImage: boolean,
  includeText: boolean,
  cropToImageSize: boolean
) {
  UIManager.dispatchViewManagerCommand(handle, Commands.save, [imageType, folder, filename, transparent, includeImage, includeText, cropToImageSize]);
}

/**
 * @param imageType "png" or "jpg"
 * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
 * @param includeText Set to `true` to include the text drawn from `Text`.
 * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
 */
export function getBase64(
  handle: number,
  imageType: ImageType,
  transparent: boolean,
  includeImage: boolean,
  includeText: boolean,
  cropToImageSize: boolean,
  callback: (error: any, result?: string) => void
) {
  console.log(NativeModuleManager)
  return NativeModuleManager.transferToBase64(handle, imageType, transparent, includeImage, includeText, cropToImageSize, callback);
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

export function useModule(ref: MutableRefObject<RCanvasRef>): Pick<RCanvasRef, 'dispatchCommand' | 'save' | 'getBase64' | 'isPointOnPath' | 'setTouchRadius'> {
  return useMemo(() => {
    const methods = { dispatchCommand, save, getBase64, isPointOnPath, setTouchRadius };
    //@ts-ignore
    return _.mapValues(methods, (m) => (...args: any[]) => m(findNodeHandle(ref.current), ...args));
  }, [ref]);
}