/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const blacklist = require('metro-config/src/defaults/blacklist');
const { mergeConfig } = require("metro-config");
const path = require('path');
const pkg = require('./package.json');
const configB = require('../metro.config');
const _ = require('lodash');

const config = {
  resolver: {
    blacklistRE: blacklist([
      //path.resolve(__dirname, '../node_modules'),
      path.resolve(__dirname, '..', '../react-native-reanimated/node_modules'),
      path.resolve(__dirname, '..', '../react-native-reanimated/Example'),
    ]),
    //providesModuleNodeModules: _.keys(pkg.dependencies),
    //extraNodeModules: _.mapValues({ ...pkg.dependencies, ...{ lodash: '' } }, (n) => path.resolve(__dirname, 'node_modules', n))
    extraNodeModules: {
      //'react-native-reanimated': path.resolve(__dirname, '..', '../react-native-reanimated')
    }
  },
  watchFolders: [path.resolve(__dirname, '..'), /*path.resolve(__dirname, '..', '../react-native-reanimated')*/],
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};


module.exports = mergeConfig(config, configB);
