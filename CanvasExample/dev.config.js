
const path = require('path');

module.exports = {
  /**
   * change this to work on reanimated locally
   * once changed must rebuild project
   */
  useLocalReanimatedModule: false,
  reanimatedLocalPath: path.resolve(__dirname, '..', '..', 'react-native-reanimated')
};