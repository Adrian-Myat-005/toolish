'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initDB() {
      try {
        // Dexie will auto-open, but we can verify it
        await db.open();
        console.log("IndexedDB (Dexie) is ready.");
        setIsReady(true);
      } catch (err) {
        console.error("Failed to open IndexedDB:", err);
        // Still set ready so app doesn't stay blank, but log error
        setIsReady(true);
      }
    }
    initDB();
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-pulse font-mono text-sm text-muted-foreground">
          Initializing Local Database...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
