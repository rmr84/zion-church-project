'use client';

import { useState } from 'react';

export function CopyCode({ code }) {
  const [message, setMessage] = useState('Copy code');

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Copied');
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
