import * as React from 'react';
import { NativeSyntheticEvent, StyleProp, ViewProperties, ViewProps, ViewStyle, View } from "react-native";
import SketchCanvas from './SketchCanvas';

/*
declare module 'react-native-sketch-canvas' {

}
*/

export enum Commands {
  addPoint = 1,
  startPath,
  clear,
  addPaths,
  deletePaths,
  save,
  endPath
}

export type ImageType = 'png' | 'jpg'

export type Size = {
  width: number
  height: number
}

export type Point = {
  x: number,
  y: number
}

export type PathData = {
  id: string
  color: string
  width: number
  points: Point[]
}

export type Path = {
  drawer?: string
  size: Size
  path: PathData
}

export type TouchStates = 'draw' | 'touch' | 'none';

export type CanvasText = {
  text: string
  font?: string
  fontSize?: number
  fontColor?: string | number
  overlay?: 'TextOnSketch' | 'SketchOnText'
  anchor: { x: number, y: number }
  position: { x: number, y: number }
  coordinate?: 'Absolute' | 'Ratio'
  /**
   * If your text is multiline, `alignment` can align shorter lines with left/center/right.
   */
  alignment?: 'Left' | 'Center' | 'Right'
  /**
   * If your text is multiline, `lineHeightMultiple` can adjust the space between lines.
   */
  lineHeightMultiple?: number
}

export interface SavePreference {
  folder: string
  filename: string
  transparent: boolean
  imageType: ImageType
  includeImage?: boolean
  includeText?: boolean
  cropToImageSize?: boolean
}

export interface LocalSourceImage {
  path: string
  directory?: string
  mode?: 'AspectFill' | 'AspectFit' | 'ScaleToFill'
}

export interface NativeTouchEvent {
  x: number,
  y: number,
  paths: number,
}

export interface NativeSketchEvent {
  x: number,
  y: number,
  id: string,
}

interface NativeTouchProps {
  useNativeDriver?: boolean
  /** fires only if `useNativeDriver` is set to `true` */
  onPress?: (e: NativeSyntheticEvent<NativeSketchEvent>) => void
  /** fires only if `useNativeDriver` is set to `true` */
  onLongPress?: (e: NativeSyntheticEvent<NativeSketchEvent>) => void
}

export interface SketchCanvasProps extends NativeTouchProps {
  style?: StyleProp<ViewStyle>
  strokeColor?: string
  strokeWidth?: number
  user?: string
  paths?: Path[]
  text?: CanvasText[]
  /**
     * {
     *    path: string, 
     *    directory: string, 
     *    mode: 'AspectFill' | 'AspectFit' | 'ScaleToFill'
     * }
     */
  localSourceImage?: LocalSourceImage
  touchEnabled?: boolean

  /**
   * Android Only: Provide a Dialog Title for the Image Saving PermissionDialog. Defaults to empty string if not set
   */
  permissionDialogTitle?: string

  /**
   * Android Only: Provide a Dialog Message for the Image Saving PermissionDialog. Defaults to empty string if not set
   */
  permissionDialogMessage?: string

  /**
   * Android Only: set hardware acceleration. Defaults to false. If you prefer performance over functionality try setting to true
   */
  hardwareAccelerated?: boolean

  onStrokeStart?: (e: NativeSyntheticEvent<any>) => void
  onStrokeChanged?: (e: NativeSyntheticEvent<NativeSketchEvent>) => void
  onStrokeEnd?: (e: NativeSyntheticEvent<any>) => void
  onSketchSaved?: (e: NativeSyntheticEvent<{ result: boolean, path: string }>) => void
  onPathsChange?: (e: NativeSyntheticEvent<{ pathsCount: number }>) => void,
}

export type RCanvasProperties = SketchCanvasProps & ViewProps;


export type RCanvasRef = {
  clear(): void
  undo(): null | string
  getPaths(): Path[]
  addPath(data: Path): void
  addPaths(paths: Path[]): void
  deletePath(id: string): void
  deletePaths(pathIds: string[]): void

  dispatchCommand(command: Commands, data?: any[]): void
  setTouchRadius(radius: number): void

  /**
   * @param imageType "png" or "jpg"
   * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
   * @param includeText Set to `true` to include the text drawn from `Text`.
   * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
   */
  save(imageType: ImageType, transparent: boolean, folder: string, filename: string, includeImage: boolean, includeText: boolean, cropToImageSize: boolean): void


  /**
   * @param imageType "png" or "jpg"
   * @param includeImage Set to `true` to include the image loaded from `LocalSourceImage`
   * @param includeText Set to `true` to include the text drawn from `Text`.
   * @param cropToImageSize Set to `true` to crop output image to the image loaded from `LocalSourceImage`
   */
  getBase64(imageType: ImageType, transparent: boolean, includeImage: boolean, includeText: boolean, cropToImageSize: boolean, callback: (error: any, result?: string) => void): void

  /**
 * @param x Set it to `evt.nativeEvent.locationX`
 * @param y Set it to `evt.nativeEvent.locationY`
 * @param pathId Set to the pathId or undefined
 * @param callback If omitted the method returns a Promise
 */
  isPointOnPath(x: number, y: number, pathId: number, callback: (error: any, result?: boolean) => void): void
  isPointOnPath(x: number, y: number, pathId: never, callback: (error: any, result?: string[]) => void): void
  isPointOnPath(x: number, y: number, pathId: number): Promise<boolean>
  isPointOnPath(x: number, y: number): Promise<string[]>

  /**
   * start a new path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * 
   * @param x
   * @param y
   */
  startPath(x: number, y: number): void
  /**
   * add a point to the current path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * 
   * @param x
   * @param y
   */
  addPoint(x: number, y: number): void
  /**
   * close the current path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * */
  endPath(): void

  getNode(): React.ComponentElement<RCanvasProperties, SketchCanvas>

  handle(): number | null

  setNativeProps(props: RCanvasProperties): void
}