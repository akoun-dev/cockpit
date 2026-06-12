'use client';

import React, { useEffect, useState } from 'react';
import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="size-12 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 size-12 animate-spin rounded-full border-4 border-transparent border-t-fun-blue" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Chargement...
        </p>
      </div>
    </div>
  );
}

function SessionInitializer({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return <AuthLoader />;
  }

  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionInitializer>{children}</SessionInitializer>
    </NextAuthSessionProvider>
  );
}