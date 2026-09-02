'use client';

import React from 'react';

export interface UniversalSideLayoutProps {
  children: React.ReactNode;
  pageType?: 'home' | 'category' | 'article' | 'about' | 'contact' | 'directory' | 'donor';
  className?: string;
  style?: React.CSSProperties;
}

export default function UniversalSideLayout({
  children,
  className = '',
  style = {},
}: UniversalSideLayoutProps) {
  return (
    <div className={`w-full min-w-0 ${className}`} style={style}>
      {children}
    </div>
  );
}

export { UniversalSideLayout };
