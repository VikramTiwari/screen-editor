import { useEffect, useRef, useState } from 'react';

export const useAutoSave = (data, saveUrl = '/api/save-config', delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const lastSavedDataRef = useRef(JSON.stringify(data));

  useEffect(() => {
    const currentDataString = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await fetch(saveUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: currentDataString,
        });

        if (!response.ok) {
          throw new Error('Failed to save config');
        }

        setLastSaved(new Date());
        lastSavedDataRef.current = currentDataString;
      } catch (err) {
        console.error('Auto-save error:', err);
        setError(err.message);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveUrl, delay]);

  return { isSaving, lastSaved, error };
};
