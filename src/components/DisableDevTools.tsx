'use client';

import { useEffect } from 'react';

/**
 * DisableDevTools Component
 * Prevents right-click context menu and standard browser DevTools inspection keyboard shortcuts:
 * - F12
 * - Ctrl + Shift + I (Inspect)
 * - Ctrl + Shift + J (Console)
 * - Ctrl + Shift + C (Inspect Element)
 * - Ctrl + U (View Page Source)
 * Handles both Windows/Linux (Ctrl) and macOS (Cmd/Meta + Option/Alt).
 */
export default function DisableDevTools() {
  useEffect(() => {
    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 2. Disable DevTools and View-Source Key Combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const isShiftOrAlt = e.shiftKey || e.altKey;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || 0;

      // F12 key
      if (e.key === 'F12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Opt+I (Inspect)
      // Ctrl+Shift+J / Cmd+Opt+J (Console)
      // Ctrl+Shift+C / Cmd+Opt+C (Element Inspector)
      if (isCtrlOrCmd && isShiftOrAlt) {
        if (key === 'i' || key === 'j' || key === 'c') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U / Cmd+U (View Page Source)
      if (isCtrlOrCmd && (key === 'u' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  return (
    <script
      id="tc-disable-devtools"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function block(e) {
              if (e.preventDefault) e.preventDefault();
              if (e.stopPropagation) e.stopPropagation();
              e.returnValue = false;
              return false;
            }
            function onContextMenu(e) { return block(e); }
            function onKeyDown(e) {
              var isCtrl = e.ctrlKey || e.metaKey;
              var isShift = e.shiftKey || e.altKey;
              var k = (e.key || '').toLowerCase();
              var c = e.keyCode || 0;
              if (e.key === 'F12' || c === 123) return block(e);
              if (isCtrl && isShift && (k === 'i' || k === 'j' || k === 'c')) return block(e);
              if (isCtrl && (k === 'u' || c === 85)) return block(e);
            }
            window.addEventListener('contextmenu', onContextMenu, true);
            document.addEventListener('contextmenu', onContextMenu, true);
            window.addEventListener('keydown', onKeyDown, true);
            document.addEventListener('keydown', onKeyDown, true);
          })();
        `,
      }}
    />
  );
}

