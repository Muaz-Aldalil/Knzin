import React from 'react';

/**
 * Scoped Page Template for seamless client-side route transitions.
 * Applies a lightweight, hardware-accelerated CSS enter effect (Protocol Sections 11, 23, & 24).
 * Preserves root layout, ThemeProvider, QueryProvider, and Server Component streaming.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-enter w-full flex-1">
      {children}
    </div>
  );
}
