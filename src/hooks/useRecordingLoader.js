import { useState, useEffect } from 'react';

const DEMO_PATH = '/demo';

export const useRecordingLoader = () => {
  const [assets, setAssets] = useState({
    camera: null,
    screen: null,
    audio: null,
    interactions: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // In a real app, we might fetch a manifest. 
    // Here we just construct paths and verify if they exist (by trying to fetch HEAD)
    // or just return them and let the video player handle errors.
    
    const loadAssets = async () => {
      try {
        // We assume these files exist in public/demo
        // You might need to adjust extensions based on actual files
        setAssets({
          camera: `${DEMO_PATH}/camera.mov`,
          screen: `${DEMO_PATH}/screen.mov`,
          audio: `${DEMO_PATH}/mic.m4a`,
          interactions: `${DEMO_PATH}/interactions.json`,
          loading: false,
          error: null
        });
      } catch (err) {
        setAssets(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    loadAssets();
  }, []);

  return assets;
};
