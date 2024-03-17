import {folder, useControls} from 'leva';
import {type Light, type Material, type Sphere} from './Renderer';
import {hexToRgb01} from './utils';

export const useVariables = (): {
  bounces: number;
  light: Light;
  materials: Material[];
  spheres: Sphere[];
} => {
  const {
    bounces,
    lightPosition,
    material0Color,
    material1Color,
    material2Color,
    sphere0MaterialIndex,
    sphere0Radius,
    sphere0Position,
    sphere1MaterialIndex,
    sphere1Radius,
    sphere1Position,
    sphere2MaterialIndex,
    sphere2Radius,
    sphere2Position,
  } = useControls({
    Bounces: folder({
      bounces: {label: 'Count', value: 4, min: 0, step: 1},
    }),
    Light: folder({
      lightPosition: {...positionCommonProps, value: [-4.8, 5.5, 0.0]},
    }),
    Materials: folder({
      'Material 0': folder({
        material0Color: {...colorCommonProps, value: '#212d79'},
      }),
      'Material 1': folder({
        material1Color: {...colorCommonProps, value: '#1a8033'},
      }),
      'Material 2': folder({
        material2Color: {...colorCommonProps, value: '#901b90'},
      }),
    }),
    Spheres: folder({
      'Sphere 0': folder({
        sphere0MaterialIndex: {...materialIndexCommonProps, value: 0},
        sphere0Radius: {...radiusCommonProps, value: 0.8},
        sphere0Position: {...positionCommonProps, value: [-1.6, 0.7, -8.1]},
      }),
      'Sphere 1': folder({
        sphere1MaterialIndex: {...materialIndexCommonProps, value: 1},
        sphere1Radius: {...radiusCommonProps, value: 1.5},
        sphere1Position: {...positionCommonProps, value: [2.9, 1.1, -10.0]},
      }),
      'Sphere 2': folder({
        sphere2MaterialIndex: {...materialIndexCommonProps, value: 2},
        sphere2Radius: {...radiusCommonProps, value: 1.0},
        sphere2Position: {...positionCommonProps, value: [0.7, -0.4, -12.1]},
      }),
    }),
  });

  return {
    bounces,
    light: {position: lightPosition},
    materials: [
      {color: hexToRgb01(material0Color)},
      {color: hexToRgb01(material1Color)},
      {color: hexToRgb01(material2Color)},
    ],
    spheres: [
      {
        materialIndex: sphere0MaterialIndex,
        radius: sphere0Radius,
        position: sphere0Position,
      },
      {
        materialIndex: sphere1MaterialIndex,
        radius: sphere1Radius,
        position: sphere1Position,
      },
      {
        materialIndex: sphere2MaterialIndex,
        radius: sphere2Radius,
        position: sphere2Position,
      },
    ],
  };
};

const positionCommonProps = {
  label: 'Position',
  step: 0.1,
} as const;
const colorCommonProps = {
  label: 'Color',
} as const;
const materialIndexCommonProps = {
  label: 'Material index',
  min: 0,
  max: 2,
  step: 1,
} as const;
const radiusCommonProps = {
  label: 'Radius',
  min: 0.0,
  step: 0.1,
} as const;
