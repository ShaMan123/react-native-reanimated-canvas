/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const blacklist = require('metro-config/src/defaults/blacklist');
const path = require('path');
const pkg = require('./package.json');
const _ = require('lodash');
const { useLocalReanimatedModule, reanimatedLocalPath } = require('./dev.config');

const watchFolders = [path.resolve(__dirname, '..')];
const blacklisters = [];  //path.resolve(__dirname, '../node_modules'),
const extraNodeModules = {};

if (useLocalReanimatedModule) {
  watchFolders.push(path.resolve(__dirname, '..', '../react-native-reanimated'));
  blacklisters.concat(
    path.resolve(__dirname, '..', '../react-native-reanimated/node_modules'),
    path.resolve(__dirname, '..', '../react-native-reanimated/Example')
  );
  extraNodeModules['react-native-reanimated'] = reanimatedLocalPath;
} else {
  extraNodeModules['react-native-reanimated'] = path.resolve(__dirname, 'node_modules', 'react-native-reanimated');
}

const config = {
  resolver: {
    blacklistRE: blacklist(blacklisters),
    extraNodeModules
  },
  watchFolders,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};


module.exports = config;
