import {useEffect, useState} from 'react';

export const useWebGPUSupport = (): boolean | undefined => {
  const [supported, setSupported] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setSupported(Boolean(navigator.gpu));
  }, []);

  return supported;
};
