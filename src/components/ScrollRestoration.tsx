'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function saveCurrentScrollPosition() {
  if (typeof window !== 'undefined') {
    const y = window.scrollY;
    if (y > 0) {
      sessionStorage.setItem(`scroll_pos_${window.location.pathname}`, y.toString());
      if (window.location.pathname === '/') {
        sessionStorage.setItem('homeScrollPos', y.toString());
      }
    }
  }
}

export function restoreScrollPosition(path?: string | null) {
  if (typeof window === 'undefined') return;
  const targetPath = path || window.location.pathname || '/';
  const saved =
    sessionStorage.getItem(`scroll_pos_${targetPath}`) ||
    (targetPath === '/' ? sessionStorage.getItem('homeScrollPos') : null);

  if (saved) {
    const y = parseInt(saved, 10);
    if (!isNaN(y) && y > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.scrollTo({ top: y, left: 0, behavior: 'instant' });
        }, 60);
      });
    }
  }
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  const isBackNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect browser Back / Forward popstate
    const handlePopState = () => {
      isBackNavigationRef.current = true;
    };

    // Keep session storage updated with current scroll offset
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (typeof window !== 'undefined') {
          const y = window.scrollY;
          if (y > 0) {
            sessionStorage.setItem(`scroll_pos_${window.location.pathname}`, y.toString());
            if (window.location.pathname === '/') {
              sessionStorage.setItem('homeScrollPos', y.toString());
            }
          }
        }
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isBackNavigationRef.current) {
      restoreScrollPosition(pathname || '/');
      isBackNavigationRef.current = false;
    } else {
      // If navigating directly to a detailed article, scroll to top
      if (pathname && pathname.startsWith('/article/')) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
  }, [pathname]);

  return null;
}
