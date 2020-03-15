const path = require('path');
const pkg = require(path.resolve(process.cwd(), './package.json'));

const REANIMATED = 'react-native-reanimated';
const GESTURE_HANDLER = 'react-native-gesture-handler';
const ext = '.stub.tsx';
const extraNodeModules = {};

function has(o, key) {
  return o[key] !== undefined;
}

function set(o, key, value) {
  o[key] = value;
}


if (has(pkg.dependencies, REANIMATED)) {
  set(extraNodeModules, REANIMATED, path.format({ dir: __dirname, name: REANIMATED, ext }));
}

if (has(pkg.dependencies, GESTURE_HANDLER)) {
  set(extraNodeModules, GESTURE_HANDLER, path.format({ dir: __dirname, name: GESTURE_HANDLER, ext }));
}

module.exports = {
  resolver: {
    extraNodeModules
  }
};