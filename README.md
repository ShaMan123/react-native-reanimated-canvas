# react-native-reanimated-canvas

### A light-weight, low-level, responsive sketching component

This repository was originally forked from `@terrylinla/react-native-sketch-canvas`, which is no longer active.
The android code has been heavily refactored to boost performance.

Some features have been added, some removed, making it more light weight and low-level, befitting `react-native-reanimated`.

Due to these major changes a lot more can be done with this library, including integration with other libraries and component such as `react-native-svg`.

**NOTICE:** `iOS` is not yet supported.


## WIP V2 - BREAKING CHANGES


## Installation
-------------
Install from `npm` or `yarn` (RN >= 0.60)
```bash
npm install react-native-reanimated --save
npm install react-native-reanimated-canvas --save
//  OR
yarn add react-native-reanimated
yarn add react-native-reanimated-canvas

//  For iOS
cd ios && pod install
```

## Usage

```ts
import React, { Component } from 'react';
import RCanvas, { RCanvasProps, RCanavasPath } from 'react-native-reanimated-canvas';

export default function Canvas(props: RCanvasProps) {
  return (
    <RCanvas
      style={{ flex: 1 }}
      strokeColor='red'
      strokeWidth={7}
    >
      <RCanvasPath
        points={new Array(200).fill(0).map((v, i) => ({ x: i, y: i }))}
        strokeWidth={20}
        strokeColor='pink'
      />
    </RCanvas>
  );
}

```

#### Properties
-------------
| Prop  | Type | Description |
| :------------ |:---------------:| :---------------| 
| ViewProps | `ViewProps` | pass any view prop you need |
| strokeColor | `string` | Set the color of stroke, which can be #RRGGBB or #RRGGBBAA. If strokeColor is set to #00000000, it will automatically become an eraser. <br/>NOTE: Once an eraser path is sent to Android, Android View will disable hardware acceleration automatically. It might reduce the canvas performance afterward. |
| strokeWidth | `number` | The thickness of stroke |
| onStrokeStart | `event` | An optional function which accpets 2 arguments `x` and `y`. Called when user's finger touches the canvas (starts to draw) |
| onStrokeChanged | `event` | An optional function which accpets 2 arguments `x` and `y`. Called when user's finger moves |
| onStrokeEnd | `event` | An optional function called when user's finger leaves the canvas (end drawing) |
 onPathsChange | `event` | An optional function which accpets 1 argument `pathsCount`, which indicates the number of paths. Useful for UI controls. (Thanks to toblerpwn) |
| touchEnabled | `boolean | TouchState` | If false, disable touching. Default is true.  |
| hardwareAccelerated | `boolean` | **Experimental** Android Only: set hardware acceleration. Defaults to false. If you prefer performance over functionality try setting to true |

#### Methods
-------------
| Method | Description |
| :------------ |:---------------|
| clear() | Clear all the paths |
| startPath(x: number, y: number, id?: string) |    start a new path<br/>
   use this method to customize touch handling or to mock drawing animations<br/>
   if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches<br/>
   [startPath, addPoint, endPath]  |
| addPoint(x: number, y: number, id?: string) |    add a point to the current/specified path<br/>
   use this method to customize touch handling or to mock drawing animations<br/>
   if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches<br/>
   [startPath, addPoint, endPath] |
| endPath() |    close the current path<br/>
   use this method to customize touch handling or to mock drawing animations<br/>
   if customizing touch handling, be sure to pass `touchEnabled = false` to avoid duplicate drawing/touches<br/>
   [startPath, addPoint, endPath]  |
| addPath(path: PathData) | Add a path (see [below](#PathData)) to canvas.  |
| addPaths(path: PathData[]) | Add a path (see [below](#Properties)) to canvas.  |
| deletePath(id: string) | Delete a path with its `id` |
| deletePaths(ids: string[]) | Delete a path with its `id` |
| getPaths() | Get the paths that drawn on the canvas |
| isPointOnPath(x: number, y: number, pathId?: string, onSuccess?: Function, onFailure?: Function) | Check if a point is part of a path. <br/>If `pathId` is passed, the method will return `true` or `false`. If it is omitted the method will return an array of `pathId`s that contain the point, defaulting to an empty array.<br/>If `callback` is omitted the method will return a promise.

### PathData
```ts
{
  id: 'RCanvasPath1', // path id
  color: '#FF000000', // ARGB, RGB, rbgNumber
  width: 5,
  points: [
    { x: 296.11, y:281.34 }, 
    ...
  ]
}
```

## Performance
-------------
1. For non-transparent path, both Android and iOS performances are good. Because when drawing non-transparent path, only last segment is drawn on canvas, no matter how long the path is, CPU usage is stable at about 20% and 15% in Android and iOS respectively. 
1. For transparent path, CPU usage stays at around 25% in Android, however, in iOS, CPU usage grows to 100% :(.
1. All touches are now handled in native

## Example
-------------
Check full example app in the [Example](./CanvasExample) folder.


## Troubleshooting
-------------
Feel free to submit issues and PRs.
