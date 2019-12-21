'use strict';

import { useMemo, useRef, useCallback } from 'react';
import _ from 'lodash';
import Animated from 'react-native-reanimated';
import { processColor } from 'react-native';
import { RCanvasProperties } from './base';

export function generatePathId() {
  return _.uniqueId('RCanvasPath');
}

export function useRefGetter<T, R = T>(initialValue?: T, action: (ref: T) => R = (current) => (current as unknown as R)) {
  const ref = useRef(initialValue);
  return useMemo(() =>
    ({
      ref,
      set: (value?: T) => (ref.current = value),
      value: () => action(ref.current as T),
      current: () => ref.current
    }),
    [ref]
  );
}

export function processColorProp(value: any) {
  return value instanceof Animated.Node ? value : processColor(value);
}

export function useStrokeColor(value: any) {
  return useMemo(() => processColorProp(value), [value]);
}

export function useEventProp<TArgs extends any[], T extends (...args: TArgs) => (any | void)>(callback: T, prop?: T | Animated.Node<any>) {
  const cb = useCallback((...args: TArgs) => {
    callback(...args);
    typeof prop === 'function' && prop(...args);
  }, [callback, prop]);
  return useMemo(() =>
    prop instanceof Animated.Node ?
      [callback, prop] :
      cb,
    [prop, callback, cb]
  );
}

export const basicRect = { left: 0, top: 0, right: 0, bottom: 0 };

export function useHitSlop(hitSlop: RCanvasProperties['hitSlop']) {
  return useMemo(() => {
    let rect;
    if (typeof hitSlop === 'number') {
      rect = _.mapValues(basicRect, () => hitSlop)
    } else {
      rect = _.pick(hitSlop, _.keys(basicRect));
      if (hitSlop) {
        if (hitSlop.vertical) {
          rect.top = rect.bottom = hitSlop.vertical;
        }
        if (hitSlop.horizontal) {
          rect.left = rect.right = hitSlop.horizontal;
        }
      }
    }

    return rect;
  }, [hitSlop]);
}