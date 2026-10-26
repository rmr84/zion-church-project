'use client';

import { useEffect, useId, useRef } from 'react';
import { NotificationsFeed } from '@/components/NotificationsFeed';

export function NotificationsPanel({
  open,
  onClose,
  assignments = [],
  reviews = [],
  isAdmin = false,
}) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (event.target.closest('.desk-note-wrap')) return;
      onClose?.();
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="desk-notifications-panel"
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <NotificationsFeed
        compact
        titleId={titleId}
        assignments={assignments}
        reviews={reviews}
        isAdmin={isAdmin}
        onItemClick={onClose}
        onMarkedAll={onClose}
      />
    </div>
  );
}
