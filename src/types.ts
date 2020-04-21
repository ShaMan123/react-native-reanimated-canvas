import * as React from 'react';
import { Insets, NativeSyntheticEvent, ViewProps } from "react-native";
import { PanGestureHandlerProperties } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

export enum Commands {
  alloc = 1,
  drawPoint,
  endInteraction,
  clear,
  update,
  setAttributes
}

export enum Methods {
  isPointOnPath = 'isPointOnPath',
  save = 'save',
  restore = 'restore',
  getPaths = 'getPaths'
}

export type Point = {
  x: number,
  y: number
}

export enum ResizeMode {
  cover = 'cover',
  stretch = 'stretch',
  none = 'none',
}

export interface RPathDataBase {
  strokeColor: string | number,
  strokeWidth: number,
  points?: Point[]
}

export interface RPathData extends RPathDataBase {
  id: number
}

export interface RPathAttributes extends RPathDataBase {
  resizeMode?: ResizeMode,
  hitSlop?: ExtendedInsets | number
}

export type IntersectionResponse = number[];

export interface NativeStrokeEvent extends Point {
  id: number,
}

export interface PathChangeData {
  id: number,
  /**
   * pass null to remove the path
   */
  value: RPathData | null
}

export interface NativeChangeEvent {
  state: {
    strokeColor: number,
    strokeWidth: number
  },
  paths: PathChangeData[],
  added: number[],
  changed: number[],
  removed: number[]
}

export type NativeTouchEvent = IntersectionResponse & Point;
export type StrokeStartEvent = NativeSyntheticEvent<RPathData>;
export type StrokeEvent = NativeSyntheticEvent<NativeStrokeEvent>;
export type StrokeEndEvent = NativeSyntheticEvent<RPathData>;
export type ChangeEvent = NativeSyntheticEvent<NativeChangeEvent>

interface NativeTouchProps {
  /** set to true to handle touches with the native driver */
  useNativeDriver?: boolean
  onStrokeStart?: (e: StrokeStartEvent) => void
  onStrokeChange?: (e: StrokeEvent) => void
  onStrokeEnd?: (e: StrokeEndEvent) => void
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

interface RCanvasCommonProps {
  strokeColor?: string | Animated.Adaptable<number>
  strokeWidth?: Animated.Adaptable<number>,
  resizeMode?: ResizeMode,

  /**
   * pass a rect or a number to apply all insets equally
   * hitSlop is used for `isPointOnPath`
   */
  hitSlop?: ExtendedInsets | number

  /**
   * 
   * *************************************************************************
   * Reanimated Canvas
   * *************************************************************************
   * Defaults to `false`, ensuresing all functionality works.
   * Might take a toll on performance.
   * If strange things are stirring set this prop to `false`.
   */
  renderToHardwareTextureAndroid?: boolean
}

export interface RPathProps extends RCanvasCommonProps {
  id?: number,
  points?: Point[]
}

export interface RCanvasProps extends RCanvasCommonProps {
  onChange?: (e: ChangeEvent) => void,
  /**
   * controls whether to draw indicators of the paths' hitSlops when calling `isPointOnPath`
   * defaults to `false`, only works in DEBUG mode.
   */
  debug?: boolean
}

export type RPathProperties = ViewProps & RPathProps;

export type RCanvasProperties = React.PropsWithChildren<ViewProps & PanGestureHandlerProperties & RCanvasProps>;

export type RCanvasRef = {

  /**
   * allocate a new path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `enabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * @param id when omitted a unique id is generated using `generatePathId()` and returned from the method
   */
  alloc(id?: number, strokeColor?: string | number, strokeWidth?: number): string
  /**
   * draw a point to the current/specified path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `enabled = false` to avoid duplicate drawing/touches
   * [startPath, addPoint, endPath]
   * 
   * @param x
   * @param y
   * @param id the path's id
   */
  drawPoint(id: number, point: Point): void
  /**
   * end current interaction for path
   * use this method to customize touch handling or to mock drawing animations
   * if customizing touch handling, be sure to pass `enabled = false` to avoid duplicate drawing/touches
   * Must call this method when interaction ends
   * [startPath, addPoint, endPath]
   * @param id 
   */
  endInteraction(id: number): void

  clear(): void

  getPaths(): RPathData[]

  getPath(id: number): RPathData | null

  update(paths: PathChangeData[]): void

  setPathAttributes(id: number, attr: { width: number, color: string | number }): void

  dispatchCommand(command: Commands, data?: any[]): void

  /**
 * @param x Set it to `evt.nativeEvent.locationX`
 * @param y Set it to `evt.nativeEvent.locationY`
 * @param pathId Set to the pathId or undefined
 * @param callback If omitted the method returns a Promise
 */
  isPointOnPath<T extends number>(
    x: number,
    y: number,
    pathId: T,
    onSuccess: (result: T extends (never | null) ? IntersectionResponse : boolean) => void,
    onFailure: (error: Error) => void
  ): void
  isPointOnPath(x: number, y: number, pathId: number): Promise<boolean>
  isPointOnPath(x: number, y: number): Promise<IntersectionResponse>

  /**
   * save paths' state
   * @param onSuccess 
   * @param onFailure 
   */
  save(): Promise<number>
  save(
    onSuccess?: (saveCount: number) => void,
    onFailure?: (error: Error) => void
  ): void

  restore(saveCount?: number): Promise<void>

  getNode(): RCanvasRef

  handle(): number | null

  setNativeProps(props: RCanvasProperties): void

  /**
   * return only the unassigned module
   * use to assign to a ref
   */
  module(): RCanvasRef
}