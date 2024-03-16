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
    sphere0Center,
    sphere1MaterialIndex,
    sphere1Radius,
    sphere1Center,
    sphere2MaterialIndex,
    sphere2Radius,
    sphere2Center,
  } = useControls({
    Light: folder({
      lightPosition: {
        label: 'Position',
        value: [-4.8, 5.5, 0.0],
        step: 0.1,
      },
    }),
    Materials: folder({
      'Material 0': folder({
        material0Color: {
          label: 'Color',
          value: '#212d79',
        },
      }),
      'Material 1': folder({
        material1Color: {
          label: 'Color',
          value: '#1a8033',
        },
      }),
      'Material 2': folder({
        material2Color: {
          label: 'Color',
          value: '#901b90',
        },
      }),
    }),
    Spheres: folder({
      'Sphere 0': folder({
        sphere0MaterialIndex: {
          label: 'Material index',
          value: 0,
          step: 1,
        },
        sphere0Radius: {
          label: 'Radius',
          value: 0.8,
          step: 0.1,
        },
        sphere0Center: {
          label: 'Center',
          value: [-0.2, 0.0, -4.1],
          step: 0.1,
        },
      }),
      'Sphere 1': folder({
        sphere1MaterialIndex: {
          label: 'Material index',
          value: 1,
          step: 1,
        },
        sphere1Radius: {
          label: 'Radius',
          value: 1.1,
          step: 0.1,
        },
        sphere1Center: {
          label: 'Center',
          value: [1.9, 0.1, -8.0],
          step: 0.1,
        },
      }),
      'Sphere 2': folder({
        sphere2MaterialIndex: {
          label: 'Material index',
          value: 2,
          step: 1,
        },
        sphere2Radius: {
          label: 'Radius',
          value: 1.0,
          step: 0.1,
        },
        sphere2Center: {
          label: 'Center',
          value: [0.7, -0.4, -6.1],
          step: 0.1,
        },
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
        center: sphere0Center,
      },
      {
        materialIndex: sphere1MaterialIndex,
        radius: sphere1Radius,
        center: sphere1Center,
      },
      {
        materialIndex: sphere2MaterialIndex,
        radius: sphere2Radius,
        center: sphere2Center,
      },
    ],
  };
};
