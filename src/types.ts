import * as React from 'react';
import { NativeSyntheticEvent, StyleProp, ViewProperties, ViewProps, ViewStyle, View, Insets } from "react-native";
import Animated from 'react-native-reanimated';
import { PanGestureHandlerProperties } from 'react-native-gesture-handler';

export enum Commands {
  startPath = 1,
  addPoint,
  endPath,
  clear,
  addPaths,
  deletePaths,
  changePath,
  setAttributes
}

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

export type TouchStates = 'draw' | 'touch' | 'none';

export type PathIntersectionResponse = string[];

export interface NativeStrokeEvent extends Point {
  id: string,
}

export type NativeTouchEvent = PathIntersectionResponse & Point;
export type StrokeStartEvent = NativeSyntheticEvent<PathData>;
export type StrokeEvent = NativeSyntheticEvent<NativeStrokeEvent>;
export type StrokeEndEvent = NativeSyntheticEvent<PathData>;
export type PathsChangeEvent = NativeSyntheticEvent<{ paths: string[] }>;

interface NativeTouchProps {
  /** set to true to handle touches with the native driver */
  useNativeDriver?: boolean
  /** fires only if `useNativeDriver` is set to `true` */
  onPress?: (e: NativeTouchEvent) => void
  /** fires only if `useNativeDriver` is set to `true` */
  onLongPress?: (e: NativeTouchEvent) => void
}

interface ExtendedInsets extends Insets {
  /**overrides left & right insets */
  horizontal?: number,
  /**overrides top & bottom insets */
  vertical?: number
}

export interface RCanvasProps extends NativeTouchProps {
  style?: StyleProp<ViewStyle>
  strokeColor?: string | Animated.Adaptable<number>
  strokeWidth?: Animated.Adaptable<number>
  paths?: PathData[]
  touchEnabled?: boolean | TouchStates

  /**
   * pass a rect or a number to apply all insets equally
   */
  hitSlop?: ExtendedInsets | number

  /**
   * Android Only: set hardware acceleration. Defaults to false. If you prefer performance over functionality try setting to true
   */
  hardwareAccelerated?: boolean

  onStrokeStart?: (e: StrokeStartEvent) => void
  onStrokeChange?: (e: SketchEvent) => void
  onStrokeEnd?: (e: StrokeEndEvent) => void
  onPathsChange?: (e: PathsChangeEvent) => void,
}

export type RCanvasProperties = React.PropsWithChildren<ViewProps & PanGestureHandlerProperties & RCanvasProps>;

export type RCanvasRef = {
  clear(): void
  undo(): null | string

  getPaths(): PathData[]
  currentPath(): PathData
  addPath(data: PathData): void
  addPaths(paths: PathData[]): void
  deletePath(id: string): void
  deletePaths(pathIds: string[]): void
  setPathAttributes(id: string, attr: { width: number, color: string | number }): void

  dispatchCommand(command: Commands, data?: any[]): void

  /**
 * @param x Set it to `evt.nativeEvent.locationX`
 * @param y Set it to `evt.nativeEvent.locationY`
 * @param pathId Set to the pathId or undefined
 * @param callback If omitted the method returns a Promise
 */
  isPointOnPath<T extends string>(
    x: number,
    y: number,
    pathId: T,
    onSuccess: (result: T extends (never | null) ? PathIntersectionResponse : boolean) => void,
    onFailure: (error: Error) => void
  ): void
  isPointOnPath(x: number, y: number, pathId: number): Promise<boolean>
  isPointOnPath(x: number, y: number): Promise<PathIntersectionResponse>

  /**
   * start a new path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * 
   * @param x
   * @param y
   * @param id the path's id
   */
  startPath(x: number, y: number, id?: string): void
  /**
   * add a point to the current path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * 
   * @param x
   * @param y
   * @param id the path's id
   */
  addPoint(x: number, y: number, id?: string): void
  /**
   * close the current path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * */
  endPath(): void

  getNode(): RCanvasRef

  handle(): number | null

  setNativeProps(props: RCanvasProperties): void

  /**
   * return only the unassigned module
   * use to assign to a ref
   */
  module(): RCanvasRef
}