import React, { useRef, useImperativeHandle } from "react";
import _ from "lodash";


export class Node {

}


export function createAnimatedComponent<T>(ComponentClass: React.FC<T>) {
  function AnimatedComponent(props: T, ref: React.Ref<React.FC<T>>) {
    const _ref = useRef();
    useImperativeHandle(ref, () => _.assign(_ref.current, { getNode() { return _ref.current } }));
    return <ComponentClass {...props} ref={_ref} />
  }

  return React.forwardRef(AnimatedComponent);
}

const Animated = {
  Node,
  createAnimatedComponent
}

export default Animated;