# react-native-reanimated-canvas

### A light-weight, low-level, responsive sketching component

This repository was originally forked from `@terrylinla/react-native-sketch-canvas`, which is no longer active.
The android code has been heavily refactored to boost performance.

Some features have been added, some removed, making it more light weight and low-level, befitting `react-native-reanimated`.

Due to these major changes a lot more can be done with this library, including integration with other libraries and component such as `react-native-svg`.

**NOTICE:** `iOS` is not yet supported.


## WIP V2 - BREAKING CHANGES
```bash
yarn add react-native-reanimated-canvas@next
```


## Installation
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

## Properties, Methods and Types

Take a look at [types.ts](./src/types.ts).


## Custom Touch Handling

If you don't use `react-native-gesture-handler` or `react-native-reanimated` consider doing so.
These are excellent, performant libraries.
Non the less, a basic implementation of this library is exposed for such a case.
Take a look at [JSTouchHandling](./CanvasExample/App/JSTouchHandling.tsx).
You will have to set up touch handling yourself, you can use exposed hooks for common usage.

```ts
import RCanvasBase, { useCanvasPanResponder, useCanvasGestureHandler } from 'react-native-reanimated-canvas/base';
```

## Performance

1. Transparent path needs to be checked.
1. All touches are now handled in native

## Example

Check full example app in the [Example](./CanvasExample) folder.


## Troubleshooting

Feel free to submit issues and PRs.
