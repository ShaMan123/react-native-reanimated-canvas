
import _ from 'lodash';
import React, { useEffect, useRef } from 'react';
import RCanvas, { generatePathId, RCanvasRef, PathData } from 'react-native-reanimated-canvas/base';
import { styles } from './common';

const points = new Array(200).fill(0).map((v, i) => ({ x: i, y: i }));

export default function CustomTouchHandling() {
  const refA = useRef<RCanvasRef>();
  const paths = useRef<{ [id: string]: PathData }>({});

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      const updater = {
        [generatePathId()]: {
          strokeColor: `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`,
          strokeWidth: Math.max(25 * Math.random(), 10),
          points: _.map(points, (point, i) => _.mapValues(point, v => (50 - v) * Math.random() * 200))
        }
      };
      console.log(_.keys(refA.current))
      if (refA.current && refA.current.getPaths().length > 0 && i % 2 === 0) {
        const size = refA.current.getPaths().length
        const path = refA.current.getPaths()[Math.round(Math.random() * size) % size];
        updater[path.id] = null;
      }

      refA.current && refA.current.update(updater);
    }, 1000);
    return () => clearImmediate(t);
  }, []);

  return (
    <RCanvas
      style={styles.default}
      //strokeColor='transparent'
      ref={refA}
    />
  )
}

