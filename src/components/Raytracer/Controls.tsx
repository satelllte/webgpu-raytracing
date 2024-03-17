import {useControls, folder, Leva} from 'leva';
import {
  type Settings,
  type ColorRGB,
  type Material,
  type Sphere,
} from './Renderer';
import {useEffect} from 'react';
import {hexToRgb01} from './utils';

export type Variables = {
  settings: Settings & {seedAuto: boolean};
  skyColor: ColorRGB;
  materials: Material[];
  spheres: Sphere[];
};

export function Controls({
  variablesRef,
  resolutionScale,
  setResolutionScale,
}: {
  readonly variablesRef: React.MutableRefObject<Variables | undefined>;
  readonly resolutionScale: number;
  readonly setResolutionScale: (resolutionScale: number) => void;
}) {
  const controls = useControls({
    Settings: folder({
      bounces: {label: 'Bounces', value: 8, min: 1, step: 1},
      samplesPerFrame: {label: 'Samples per frame', value: 4, min: 1, step: 1},
      seed: {label: 'Seed', value: 1.112, step: 0.0001},
      seedAuto: {label: 'Seed auto', value: true},
      resolutionScale: {
        label: 'Resolution scale',
        value: resolutionScale,
        min: 0.01,
        max: 1.0,
        step: 0.01,
      },
    }),
    Sky: folder({
      skyColor: {...colorCommonProps, value: '#000000'},
    }),
    Materials: folder({
      'Material 0': folder({
        material0Albedo: {...albedoCommonProps, value: '#212d79'},
        material0Roughness: {...roughnessCommonProps, value: 1.0},
        material0EmissionColor: {...emissionColorCommonProps, value: '#21bd79'},
        material0EmissionPower: {...emissionPowerCommonProps, value: 0.0},
      }),
      'Material 1': folder({
        material1Albedo: {...albedoCommonProps, value: '#1a8033'},
        material1Roughness: {...roughnessCommonProps, value: 0.7},
        material1EmissionColor: {...emissionColorCommonProps, value: '#760000'},
        material1EmissionPower: {...emissionPowerCommonProps, value: 0.8},
      }),
      'Material 2': folder({
        material2Albedo: {...albedoCommonProps, value: '#901b90'},
        material2Roughness: {...roughnessCommonProps, value: 0.19},
        material2EmissionColor: {...emissionColorCommonProps, value: '#101b90'},
        material2EmissionPower: {...emissionPowerCommonProps, value: 0.0},
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
        sphere1Radius: {...radiusCommonProps, value: 4.7},
        sphere1Position: {...positionCommonProps, value: [7.4, 3.4, -11.0]},
      }),
      'Sphere 2': folder({
        sphere2MaterialIndex: {...materialIndexCommonProps, value: 2},
        sphere2Radius: {...radiusCommonProps, value: 1.0},
        sphere2Position: {...positionCommonProps, value: [1.4, -0.5, -4.8]},
      }),
    }),
  });

  useEffect(() => {
    const {
      bounces,
      samplesPerFrame,
      seed,
      seedAuto,
      resolutionScale,
      skyColor,
      material0Albedo,
      material0Roughness,
      material0EmissionColor,
      material0EmissionPower,
      material1Albedo,
      material1Roughness,
      material1EmissionColor,
      material1EmissionPower,
      material2Albedo,
      material2Roughness,
      material2EmissionColor,
      material2EmissionPower,
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
        samplesPerFrame,
        seed,
        seedAuto,
      },
      skyColor: hexToRgb01(skyColor),
      materials: [
        {
          albedo: hexToRgb01(material0Albedo),
          roughness: material0Roughness,
          emissionColor: hexToRgb01(material0EmissionColor),
          emissionPower: material0EmissionPower,
        },
        {
          albedo: hexToRgb01(material1Albedo),
          roughness: material1Roughness,
          emissionColor: hexToRgb01(material1EmissionColor),
          emissionPower: material1EmissionPower,
        },
        {
          albedo: hexToRgb01(material2Albedo),
          roughness: material2Roughness,
          emissionColor: hexToRgb01(material2EmissionColor),
          emissionPower: material2EmissionPower,
        },
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

    setResolutionScale(resolutionScale);
  }, [variablesRef, setResolutionScale, controls]);

  return <Leva oneLineLabels />;
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
const emissionColorCommonProps = {
  label: 'Emission color',
} as const;
const emissionPowerCommonProps = {
  label: 'Emission power',
  min: 0,
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
