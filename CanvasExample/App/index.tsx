import Animated from 'react-native-reanimated';
const exporter = Animated.Value ? require('./App') : require('./JSTouchHandling');
export default exporter.default;