import {folder, useControls} from 'leva';
import {type Light, type Material, type Sphere} from './Renderer';
import {hexToRgb01} from './utils';

export const useVariables = (): {
  light: Light;
  materials: Material[];
  spheres: Sphere[];
} => {
  const {
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
        sphere0Position: {...positionCommonProps, value: [-0.2, 0.0, -4.1]},
      }),
      'Sphere 1': folder({
        sphere1MaterialIndex: {...materialIndexCommonProps, value: 1},
        sphere1Radius: {...radiusCommonProps, value: 1.1},
        sphere1Position: {...positionCommonProps, value: [1.9, 0.1, -8.0]},
      }),
      'Sphere 2': folder({
        sphere2MaterialIndex: {...materialIndexCommonProps, value: 2},
        sphere2Radius: {...radiusCommonProps, value: 1.0},
        sphere2Position: {...positionCommonProps, value: [0.7, -0.4, -6.1]},
      }),
    }),
  });

  return {
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