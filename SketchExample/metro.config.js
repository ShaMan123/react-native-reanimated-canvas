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
      //path.resolve(__dirname, '../node_modules/react-native-gesture-handler'),
    ]),
    //providesModuleNodeModules: _.keys(pkg.dependencies),
    //extraNodeModules: _.mapValues(pkg.dependencies, (n) => path.resolve(__dirname, 'node_modules', n))
  },
  watchFolders: [path.resolve(__dirname, '..')],
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
