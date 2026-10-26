'use client';

import { useState } from 'react';

export function MemberAvatar({ member, className = 'member-avatar' }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(member?.photo && member?.uid && !failed);

  if (!member) {
    return <span className={`${className} member-avatar-empty`} aria-hidden="true" />;
  }

  if (showPhoto) {
    return (
      <img
        className={className}
        src={`/api/profile-photo?uid=${encodeURIComponent(member.uid)}&v=${encodeURIComponent(member.photoUpdatedAt || '')}`}
        alt=""
        width={32}
        height={32}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`${className} member-avatar-initials`} aria-hidden="true">
      {member.initials || '?'}
    </span>
  );
}
