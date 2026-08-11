'use client';

import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
