
import _ from 'lodash';
import React, { useRef } from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import RCanvas, { generatePathId, RCanvasRef, RPath, RPathData } from 'react-native-reanimated-canvas';
import { styles } from './common';
import { useState } from 'react';
import { useEffect } from 'react';

const points = _.map(new Array(200).fill(0), (v, i) => ({ x: i, y: i }));

function genPathData(id = generatePathId()) {
  return {
    id,
    strokeColor: `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`,
    strokeWidth: Math.max(25 * Math.random(), 10),
    points: _.map(points, (point, i) => _.mapValues(point, v => (50 - v) * Math.random() * 200))
  } as RPathData;
}

export default function CustomTouchHandling() {
  const refA = useRef<RCanvasRef & PanGestureHandler>();
  const [paths, setPaths] = useState(_.map(new Array(10).fill(0), () => genPathData()));
  useEffect(() => {
    let t = setInterval(() => {
      setPaths(_.map(new Array(10).fill(0), () => genPathData()));
    }, 5000);
    return () => clearInterval(t)
  })
  return (
    <RCanvas
      style={styles.default}
      strokeColor='red'
      strokeWidth={20}
      ref={refA}
      renderToHardwareTextureAndroid={false}
      onChange={e => console.log(e.nativeEvent)}
    >
      {_.map(paths, (data, i) => <RPath {...data} key={`DRPath${i}`} id={`DRPath${i}`} />)}
    </RCanvas>
  )
}

