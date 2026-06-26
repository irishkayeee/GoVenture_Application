declare module 'react-native-svg' {
  import * as React from 'react';

  export const Svg: React.ComponentType<any>;
  export const Path: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const G: React.ComponentType<any>;
  export const TextPath: React.ComponentType<any>;
  export const Defs: React.ComponentType<any>;

  const _default: any;
  export default _default;
}

declare module 'react-native-svg/*' {
  const content: any;
  export default content;
}
