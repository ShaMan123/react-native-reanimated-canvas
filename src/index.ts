
import { Platform, UIManager } from 'react-native';
const { Constants } = UIManager.getViewManagerConfig('RNSketchCanvas') as any;
export const MAIN_BUNDLE = Platform.OS === 'ios' ? Constants.MainBundlePath : '';
export const DOCUMENT = Platform.OS === 'ios' ? Constants.NSDocumentDirectory : '';
export const LIBRARY = Platform.OS === 'ios' ? Constants.NSLibraryDirectory : '';
export const CACHES = Platform.OS === 'ios' ? Constants.NSCachesDirectory : '';

import * as SketchCanvasModule from './SketchCanvasModule';
export * from './hooks';
export { SketchCanvasModule };
export { default, generatePathId } from './SketchCanvas';


