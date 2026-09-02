'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, ArrowRight } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(true);

  // Auto-redirect countdown to homepage
  useEffect(() => {
    if (!isAutoRedirecting) return;

    if (countdown <= 0) {
      router.push('/');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isAutoRedirecting, router]);

  return (
    <div className="min-h-screen w-full bg-[#fcfbf7] dark:bg-slate-950 text-stone-900 dark:text-gray-100 flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Large Clean 404 */}
        <div className="space-y-1">
          <div className="text-8xl sm:text-9xl font-black text-stone-900 dark:text-white tracking-tighter leading-none select-none">
            4<span className="text-red-600">0</span>4
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
        </div>

        {/* Concise Message */}
        <p className="text-sm text-stone-600 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Redirecting Option Buttons */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Go to Homepage</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-stone-200/80 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 active:scale-95 text-stone-800 dark:text-gray-200 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Automatic Redirect Countdown */}
          {isAutoRedirecting && (
            <div className="text-xs text-stone-500 dark:text-gray-400 pt-1 flex items-center justify-center gap-1.5 font-medium">
              <span>Redirecting to homepage in <strong className="text-red-600 dark:text-red-400 font-black">{countdown}s</strong></span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsAutoRedirecting(false)}
                className="underline hover:text-stone-900 dark:hover:text-white cursor-pointer font-bold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
