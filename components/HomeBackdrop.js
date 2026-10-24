'use client';

import { useEffect } from 'react';

export function HomeBackdrop() {
  useEffect(() => {
    document.documentElement.classList.add('home-canvas');
    return () => document.documentElement.classList.remove('home-canvas');
  }, []);

  return null;
}
