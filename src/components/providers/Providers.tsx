'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AppProvider>
        {children}
      </AppProvider>
    </ThemeProvider>
  );
}
