'use client';

import { firebaseApp } from '@/lib/firebase';

export function FirebaseApp() {
  return <span hidden data-firebase-project={firebaseApp.options.projectId} />;
}
