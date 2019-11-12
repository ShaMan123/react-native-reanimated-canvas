'use strict';

import { NativeModules, Platform, UIManager } from 'react-native';
import { ImageType } from '../index';

const SketchCanvasManager = NativeModules.RNSketchCanvasManager || {};
const { Commands } = UIManager.getViewManagerConfig('RNSketchCanvas');

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
  if (Platform.OS === 'ios') {
    SketchCanvasManager.transferToBase64(handle, imageType, transparent, includeImage, includeText, cropToImageSize, callback);
  } else {
    NativeModules.SketchCanvasModule.transferToBase64(handle, imageType, transparent, includeImage, includeText, cropToImageSize, callback);
  }
}

export function isPointOnPath(handle: number, x: number, y: number, pathId: number, callback: (error: any, result?: boolean) => void): void
export function isPointOnPath<T, R = T extends number ? boolean : Array<number>>(
  handle: number,
  x: number,
  y: number,
  pathId: T,
  callback: (error: any, result?: R) => void
) {
  const nativeX = x;
  const nativeY = y;
  const normalizedPathId = typeof pathId === 'number' ? pathId : null;
  const nativeMethod = (callback: (error: any, result?: R) => void) => {
    if (Platform.OS === 'ios') {
      SketchCanvasManager.isPointOnPath(handle, nativeX, nativeY, normalizedPathId, callback);
    } else {
      NativeModules.SketchCanvasModule.isPointOnPath(handle, nativeX, nativeY, normalizedPathId, callback);
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

export function setTouchRadius(handle: number, radius: number, callback: (error: any, result?: boolean) => void) {
  const r = typeof radius === 'number' ? radius : 0;

  const nativeMethod = (callback: (error: any, result?: boolean) => void) => {
    if (Platform.OS === 'ios') {
      //  need to implement native callback 
      //SketchCanvasManager.setTouchRadius(handle, r, callback);
    } else {
      NativeModules.SketchCanvasModule.setTouchRadius(handle, r, callback);
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