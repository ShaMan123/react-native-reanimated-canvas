const path = require('path');
const pkg = require(path.resolve(process.cwd(), './package.json'));

const REANIMATED = 'react-native-reanimated';
const GESTURE_HANDLER = 'react-native-gesture-handler';
const ext = '.stub.tsx';
const extraNodeModules = {};

if (!extraNodeModules[REANIMATED]) {
  extraNodeModules[REANIMATED] = path.format({ dir: __dirname, name: REANIMATED, ext });
}

if (!extraNodeModules[GESTURE_HANDLER]) {
  extraNodeModules[GESTURE_HANDLER] = path.format({ dir: __dirname, name: GESTURE_HANDLER, ext });
}

module.exports = {
  resolver: {
    extraNodeModules
  }
};
