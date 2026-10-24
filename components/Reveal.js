'use client';

import { useEffect, useRef, useState } from 'react';

export function Reveal({ children, className = '' }) {
  const ref = useRef(null);
  const [state, setState] = useState('');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('is-in');
      return;
    }

    setState('is-waiting');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setState('is-in');
      observer.disconnect();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal${state ? ` ${state}` : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
