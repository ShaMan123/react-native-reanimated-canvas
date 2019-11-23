# react-native-reanimated-canvas

### A light-weight low-level responsive sketching component

This repository was originally forked from `@terrylinla/react-native-sketch-canvas`, which is no longer active.
The android code has been heavily refactored to boost performance.
Some features have been added and a lot of javascript has been removed making it more light weight and low-level, befitting `react-native-reanimated`.


## WIP V2 - BREAKING CHANGES


## Installation
-------------
Install from `npm` or `yarn` (RN >= 0.60)
```bash
npm install react-native-reanimated-canvas --save
//  OR
yarn add react-native-reanimated-canvas
```

### android
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  ...>
+    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
+    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

  ...
```

## Usage

```javascript
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
} from 'react-native';

import AnimatedCanvas from 'react-native-reanimated-canvas';

export default function(props) {
  return (
       <AnimatedCanvas
            style={{ flex: 1 }}
            strokeColor={'red'}
            strokeWidth={7}
          />
    );
}

```

#### Properties
-------------
| Prop  | Type | Description |
| :------------ |:---------------:| :---------------| 
| style | `object` | Styles to be applied on canvas component |
| strokeColor | `string` | Set the color of stroke, which can be #RRGGBB or #RRGGBBAA. If strokeColor is set to #00000000, it will automatically become an eraser. <br/>NOTE: Once an eraser path is sent to Android, Android View will disable hardware acceleration automatically. It might reduce the canvas performance afterward. |
| strokeWidth | `number` | The thickness of stroke |
| onStrokeStart | `function` | An optional function which accpets 2 arguments `x` and `y`. Called when user's finger touches the canvas (starts to draw) |
| onStrokeChanged | `function` | An optional function which accpets 2 arguments `x` and `y`. Called when user's finger moves |
| onStrokeEnd | `function` | An optional function called when user's finger leaves the canvas (end drawing) |
| onSketchSaved | `function` | An optional function which accpets 2 arguments `success` and `path`. If `success` is true, image is saved successfully and the saved image path might be in second argument. In Android, image path will always be returned. In iOS, image is saved to camera roll or file system, path will be set to null or image location respectively. |
| onPathsChange | `function` | An optional function which accpets 1 argument `pathsCount`, which indicates the number of paths. Useful for UI controls. (Thanks to toblerpwn) |
| user | `string` | An identifier to identify who draws the path. Useful when undo between two users |
| touchEnabled | `bool` | If false, disable touching. Default is true.  |
| localSourceImage | `object` | `deprecated`, use `<Image />` |
| hardwareAccelerated | `bool` | Android Only: set hardware acceleration. Defaults to false. If you prefer performance over functionality try setting to true |
| permissionDialogTitle | `string` | Android Only: Provide a Dialog Title for the Image Saving PermissionDialog. Defaults to empty string if not set |
| permissionDialogMessage | `string` | Android Only: Provide a Dialog Message for the Image Saving PermissionDialog. Defaults to empty string if not set |

#### Methods
-------------
| Method | Description |
| :------------ |:---------------|
| clear() | Clear all the paths |
| undo() | Delete the latest path. Can undo multiple times. |
| addPath(path) | Add a path (see [below](#objects)) to canvas.  |
| deletePath(id) | Delete a path with its `id` |
| save(imageType, transparent, folder, filename, includeImage, cropToImageSize) | Save image to camera roll or filesystem. If `localSourceImage` is set and a background image is loaded successfully, set `includeImage` to true to include background image and set `cropToImageSize` to true to crop output image to background image.<br/>Android: Save image in `imageType` format with transparent background (if `transparent` sets to True) to **/sdcard/Pictures/`folder`/`filename`** (which is Environment.DIRECTORY_PICTURES).<br/>iOS: Save image in `imageType` format with transparent background (if `transparent` sets to True) to camera roll or file system. If `folder` and `filename` are set, image will save to **temporary directory/`folder`/`filename`** (which is NSTemporaryDirectory())  |
| getPaths() | Get the paths that drawn on the canvas |
| getBase64(imageType, transparent, includeImage, cropToImageSize, callback) | Get the base64 of image and receive data in callback function, which called with 2 arguments. First one is error (null if no error) and second one is base64 result. |
| isPointOnPath(x, y, pathId?, callback?) | Check if a point is part of a path. <br/>If `pathId` is passed, the method will return `true` or `false`. If it is omitted the method will return an array of `pathId`s that contain the point, defaulting to an empty array.<br/>If `callback` is omitted the method will return a promise.

### Path object
```javascript
{
  drawer: 'user1',
  size: { // the size of drawer's canvas
    width: 480,
    height: 640
  },
  path: {
    id: 8979841, // path id
    color: '#FF000000', // ARGB or RGB
    width: 5,
    data: [
      "296.11,281.34",  // x,y
      "293.52,284.64",
      "290.75,289.73"
    ]
  }
}
```

## Performance
-------------
1. For non-transparent path, both Android and iOS performances are good. Because when drawing non-transparent path, only last segment is drawn on canvas, no matter how long the path is, CPU usage is stable at about 20% and 15% in Android and iOS respectively. 
1. For transparent path, CPU usage stays at around 25% in Android, however, in iOS, CPU usage grows to 100% :(.
1. All touches are now handled in native

## Example
-------------
Check full example app in the [Example](./CanvasExample) folder 


## Troubleshooting
-------------
Feel free to submit issues and PRs.
