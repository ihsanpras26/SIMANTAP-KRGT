import { useState, useEffect } from 'react';

/**
 * Hook untuk debouncing nilai input
 * @param {any} value - Nilai yang akan di-debounce
 * @param {number} delay - Delay dalam milliseconds (default: 300ms)
 * @returns {any} - Nilai yang sudah di-debounce
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook untuk debouncing callback function
 * @param {Function} callback - Function yang akan di-debounce
 * @param {number} delay - Delay dalam milliseconds (default: 300ms)
 * @returns {Function} - Function yang sudah di-debounce
 */
export const useDebouncedCallback = (callback, delay = 300) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
};

export default useDebounce;