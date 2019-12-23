
const path = require('path');

const REANIMATED = 'react-native-reanimated';
const GESTURE_HANDLER = 'react-native-gesture-handler';
const ext = '.stub.tsx';

const dev = require('./dev.config.json');

const config = {

  /**
   * test module without reanimated an gesture-handler
   */
  useBaseImplementation: dev.useBaseImplementation,

  /**
   * change this to work on reanimated locally
   * once changed must rebuild project
   */
  useLocalReanimatedModule: dev.useLocalReanimatedModule,
  reanimatedLocalPath: path.resolve(__dirname, '..', '..', REANIMATED),

  resolveReanimatedPath(useBaseImplementation = config.useBaseImplementation) {
    if (config.useBaseImplementation) {
      return path.format({ dir: path.resolve(__dirname, '..', 'base'), name: REANIMATED, ext });
    } else if (config.useLocalReanimatedModule) {
      return config.reanimatedLocalPath;
    } else {
      return path.resolve(__dirname, 'node_modules', REANIMATED);
    }
  },

  resolveGestureHandlerPath(useBaseImplementation = config.useBaseImplementation) {
    if (useBaseImplementation) {
      return path.format({ dir: __dirname, name: GESTURE_HANDLER, ext })
    } else {
      return path.resolve(__dirname, 'node_modules', GESTURE_HANDLER);
    }
  }

};

module.exports = config;

