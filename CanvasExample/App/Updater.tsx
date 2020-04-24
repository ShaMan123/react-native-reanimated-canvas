
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import RCanvas, { generatePathId, RCanvasRef, RPath, RPathData, PathChangeData } from 'react-native-reanimated-canvas';
import { styles, usePathUpdateAssertion } from './common';

const points = new Array(200).fill(0).map((v, i) => ({ x: i, y: i }));

function genPathData(id = generatePathId()) {
  return {
    id,
    strokeColor: `rgb(${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)},${Math.round(Math.random() * 255)})`,
    strokeWidth: Math.max(25 * Math.random(), 10),
    points: _.map(points, (point, i) => _.mapValues(point, v => (50 - v) * Math.random() * 200))
  } as RPathData;
}

export default function CustomTouchHandling() {
  const ref = useRef<RCanvasRef>();
  const onChange = usePathUpdateAssertion(ref);
  const [renderToHWT, setHWT] = useState(false);
  const [paths, setPaths] = useState([genPathData()]);
  /*
    useEffect(() => {
      let i = 0;
      const t = setInterval(() => {
        i++;
  
        if (refA.current && refA.current.getPaths().length > 0 && i % 2 === 0) {
          const size = refA.current.getPaths().length
          const path = refA.current.getPaths()[Math.round(Math.random() * size) % size];
          _.pull(paths, path)
        }
        paths.push(genPathData());
        setPaths(paths);
      }, 1000);
      return () => clearImmediate(t);
    }, [renderToHWT]);
    */
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      const id = generatePathId();
      const updater: PathChangeData[] = [
        { id, value: genPathData(id) }
      ];

      if (ref.current && ref.current.getPaths().length > 0 && i % 2 === 0) {
        const size = ref.current.getPaths().length
        const path = ref.current.getPaths()[Math.round(Math.random() * size) % size];
        updater.push({ id: path.id, value: null });
      }

      if (i % (renderToHWT ? 2 : 5) === 0) {
        setHWT(!renderToHWT)
      }

      ref.current && ref.current.update(updater);
    }, 1000);
    return () => clearImmediate(t);
  }, [renderToHWT]);

  return (
    <>
      <RCanvas
        style={styles.default}
        strokeColor='red'
        strokeWidth={20}
        ref={ref}
        renderToHardwareTextureAndroid={renderToHWT}
        onChange={onChange}
      >
        {_.map(paths, data => <RPath {...data} key={data.id} />)}
      </RCanvas>
      <Text>{`renderToHardwareTextureAndroid: ${renderToHWT}`}</Text>
    </>
  )
}

