//  https://github.com/react-native-community/cli/blob/5199d6af1aa6dc5d8dfb4a98e675987272d68998/docs/configuration.md

const path = require('path');
const root = path.resolve(__dirname, '..');
const { useLocalReanimatedModule, reanimatedLocalPath } = require('./example.config');

const reanimatedModule = useLocalReanimatedModule ?
  {
    'react-native-reanimated': {
      root: reanimatedLocalPath
    }
  } :
  {};

module.exports = {
  dependencies: {
    'react-native-reanimated-canvas': {
      root,
    },
    ...reanimatedModule
  }
};