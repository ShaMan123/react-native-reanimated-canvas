const path = require('path');
const pkg = require(path.resolve(process.cwd(), './package.json'));
const _ = require('lodash');

const REANIMATED = 'react-native-reanimated';
const GESTURE_HANDLER = 'react-native-gesture-handler';
const ext = '.stub.tsx';
const extraNodeModules = {};

if (!_.has(pkg.dependencies, REANIMATED)) {
  _.set(extraNodeModules, REANIMATED, path.format({ dir: __dirname, name: REANIMATED, ext }));
}

if (!_.has(pkg.dependencies, GESTURE_HANDLER)) {
  _.set(extraNodeModules, GESTURE_HANDLER, path.format({ dir: __dirname, name: GESTURE_HANDLER, ext }));
}

module.exports = {
  resolver: {
    extraNodeModules
  }
};