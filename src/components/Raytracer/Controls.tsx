import {useControls, folder} from 'leva';
import {
  type Settings,
  type ColorRGB,
  type Light,
  type Material,
  type Sphere,
} from './Renderer';
import {useEffect} from 'react';
import {hexToRgb01} from './utils';

export type Variables = {
  settings: Settings & {seedAuto: boolean};
  light: Light;
  skyColor: ColorRGB;
  materials: Material[];
  spheres: Sphere[];
};

export function Controls({
  variablesRef,
}: {
  readonly variablesRef: React.MutableRefObject<Variables | undefined>;
}) {
  const controls = useControls({
    Settings: folder({
      bounces: {label: 'Bounces', value: 4, min: 0, step: 1},
      seed: {label: 'Seed', value: 1.112, step: 0.0001},
      seedAuto: {label: 'Seed auto', value: true},
    }),
    Light: folder({
      lightPosition: {...positionCommonProps, value: [-4.8, 5.5, 0.0]},
    }),
    Sky: folder({
      skyColor: {...colorCommonProps, value: '#060f2a'},
    }),
    Materials: folder({
      'Material 0': folder({
        material0Albedo: {...albedoCommonProps, value: '#212d79'},
        material0Roughness: {...roughnessCommonProps, value: 0.07},
      }),
      'Material 1': folder({
        material1Albedo: {...albedoCommonProps, value: '#1a8033'},
        material1Roughness: {...roughnessCommonProps, value: 0.0},
      }),
      'Material 2': folder({
        material2Albedo: {...albedoCommonProps, value: '#901b90'},
        material2Roughness: {...roughnessCommonProps, value: 0.0},
      }),
    }),
    Spheres: folder({
      'Sphere 0': folder({
        sphere0MaterialIndex: {...materialIndexCommonProps, value: 0},
        sphere0Radius: {...radiusCommonProps, value: 100.0},
        sphere0Position: {...positionCommonProps, value: [-1.6, -101.5, -8.1]},
      }),
      'Sphere 1': folder({
        sphere1MaterialIndex: {...materialIndexCommonProps, value: 1},
        sphere1Radius: {...radiusCommonProps, value: 1.5},
        sphere1Position: {...positionCommonProps, value: [2.9, 1.1, -6.0]},
      }),
      'Sphere 2': folder({
        sphere2MaterialIndex: {...materialIndexCommonProps, value: 2},
        sphere2Radius: {...radiusCommonProps, value: 1.0},
        sphere2Position: {...positionCommonProps, value: [-1.0, 0.8, -6.8]},
      }),
    }),
  });

  useEffect(() => {
    const {
      bounces,
      seed,
      seedAuto,
      lightPosition,
      skyColor,
      material0Albedo,
      material0Roughness,
      material1Albedo,
      material1Roughness,
      material2Albedo,
      material2Roughness,
      sphere0MaterialIndex,
      sphere0Radius,
      sphere0Position,
      sphere1MaterialIndex,
      sphere1Radius,
      sphere1Position,
      sphere2MaterialIndex,
      sphere2Radius,
      sphere2Position,
    } = controls;

    variablesRef.current = {
      settings: {
        bounces,
        seed,
        seedAuto,
      },
      light: {position: lightPosition},
      skyColor: hexToRgb01(skyColor),
      materials: [
        {albedo: hexToRgb01(material0Albedo), roughness: material0Roughness},
        {albedo: hexToRgb01(material1Albedo), roughness: material1Roughness},
        {albedo: hexToRgb01(material2Albedo), roughness: material2Roughness},
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
  }, [variablesRef, controls]);

  return null;
}

const positionCommonProps = {
  label: 'Position',
  step: 0.1,
} as const;
const colorCommonProps = {
  label: 'Color',
} as const;
const albedoCommonProps = {
  label: 'Albedo',
} as const;
const roughnessCommonProps = {
  label: 'Roughness',
  min: 0,
  max: 1,
  step: 0.001,
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
