'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/Toast';

export function ArrivalToast({ message }) {
  const showToast = useToast();

  useEffect(() => {
    showToast?.(message);
  }, [message, showToast]);

  return null;
}
