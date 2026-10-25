'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);
const VISIBLE_MS = 10000;

export function ToastProvider({ children }) {
  const hideTimer = useRef(null);
  const leaveTimer = useRef(null);
  const openRef = useRef(false);
  const mountedRef = useRef(false);
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const dismissRef = useRef(() => {});

  function prefersMotion() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  dismissRef.current = function dismiss() {
    window.clearTimeout(hideTimer.current);
    if (!prefersMotion()) {
      openRef.current = false;
      mountedRef.current = false;
      setOpen(false);
      setMounted(false);
      return;
    }
    openRef.current = false;
    setOpen(false);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      mountedRef.current = false;
      setMounted(false);
    }, 380);
  };

  const showToast = useCallback((text) => {
    const next = String(text || '').trim();
    if (!next) return;
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(leaveTimer.current);
    setMessage(next);
    if (mountedRef.current && openRef.current) {
      hideTimer.current = window.setTimeout(() => dismissRef.current(), VISIBLE_MS);
      return;
    }
    mountedRef.current = true;
    setMounted(true);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      openRef.current = false;
      setOpen(false);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          openRef.current = true;
          setOpen(true);
        });
      });
      return;
    }
    openRef.current = true;
    setOpen(true);
    hideTimer.current = window.setTimeout(() => dismissRef.current(), VISIBLE_MS);
  }, []);

  function onTransitionEnd(event) {
    if (event.propertyName !== 'transform' || event.target !== event.currentTarget) return;
    if (openRef.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => dismissRef.current(), VISIBLE_MS);
      return;
    }
    window.clearTimeout(leaveTimer.current);
    mountedRef.current = false;
    setMounted(false);
  }

  useEffect(() => () => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(leaveTimer.current);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {mounted ? (
        <div className={open ? 'toast is-in' : 'toast'} role="status" onTransitionEnd={onTransitionEnd}>
          <span className="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.2 4.2L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="toast-body">
            <p>{message}</p>
            <button type="button" className="toast-dismiss" onClick={() => dismissRef.current()}>Dismiss</button>
          </div>
          <button type="button" className="toast-close" aria-label="Dismiss" onClick={() => dismissRef.current()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
