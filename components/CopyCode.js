'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';

export function CopyCode({ code }) {
  const showToast = useToast();
  const [message, setMessage] = useState('Copy Code');

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Copy Code');
      showToast?.('Reference code copied');
    } catch {
      setMessage('Select the code and copy it');
    }
  }

  return (
    <button type="button" className="button secondary" onClick={copy}>
      {message}
    </button>
  );
}
