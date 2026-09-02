'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dbService, { SocialLinksRecord, INITIAL_SOCIAL_LINKS_DB } from '../services/db';

export const Footer: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLinksRecord>(INITIAL_SOCIAL_LINKS_DB);

  useEffect(() => {
    let isMounted = true;
    const syncSocial = async () => {
      try {
        const links = await dbService.getSocialLinks();
        if (isMounted && links) {
          setSocialLinks(links);
        }
      } catch (e) {
        console.error('Error fetching social links in footer', e);
      }
    };

    syncSocial();
    const unsubscribe = dbService.subscribe(syncSocial);

    if (typeof window !== 'undefined') {
      window.addEventListener('socialLinksStorageUpdate', syncSocial);
      window.addEventListener('storage', syncSocial);
    }

    return () => {
      isMounted = false;
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('socialLinksStorageUpdate', syncSocial);
        window.removeEventListener('storage', syncSocial);
      }
    };
  }, []);

  return (
    <footer className="mt-16 sm:mt-24 clear-both w-full max-w-[100vw] mx-0 px-4 sm:px-8 bg-[#FBF9F5] dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-colors duration-200 box-border overflow-x-hidden">
      {/* MAIN TOP ROW: LOGO & SLOGAN (LEFT) | ABOUT US & CONTACT US & SOCIAL ICONS (RIGHT) */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 py-6 box-border transition-all">
        
        {/* Left Section: Logo */}
        <div className="flex items-center justify-center sm:justify-start">
          <Link
            href="/"
            aria-label="Today's Coimbatore Home"
            className="flex items-center justify-center sm:justify-start flex-shrink-0 my-auto w-fit h-fit overflow-hidden touch-manipulation"
          >
            <Image
              src="/images/logo.png"
              alt="Today's Coimbatore"
              width={240}
              height={60}
              className="w-[180px] sm:w-[210px] md:w-[240px] h-auto object-contain block dark:hidden"
            />
            <Image
              src="/images/logo-dark.png"
              alt="Today's Coimbatore"
              width={240}
              height={60}
              className="w-[180px] sm:w-[210px] md:w-[240px] h-auto object-contain hidden dark:block"
            />
          </Link>
        </div>

        {/* Right Section: Navigation Links (About Us & Contact Us) + Social Media Icons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/about-us"
              className="text-xs sm:text-sm font-bold text-[#111111] dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-slate-800 touch-manipulation min-h-[36px] inline-flex items-center"
            >
              About Us
            </Link>

            <span className="text-stone-300 dark:text-gray-700 font-bold">•</span>

            <Link
              href="/contact-us"
              className="text-xs sm:text-sm font-bold text-[#111111] dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-slate-800 touch-manipulation min-h-[36px] inline-flex items-center"
            >
              Contact Us
            </Link>
          </div>

          <span className="text-stone-300 dark:text-gray-700 font-bold">|</span>

          {/* Interactive Social Media Icons List */}
          <div className="flex items-center gap-3 sm:gap-3.5 text-stone-700 dark:text-gray-300">
            {/* Instagram */}
            <a
              href={socialLinks.instagram || 'https://instagram.com/todayscoimbatore'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Follow us on Instagram"
              className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-700 dark:text-gray-300 hover:text-[#E4405F] dark:hover:text-[#E4405F] transition-all duration-200 cursor-pointer inline-flex items-center justify-center touch-manipulation"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href={socialLinks.youtube || 'https://youtube.com/@todayscoimbatore'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="Subscribe on YouTube"
              className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-700 dark:text-gray-300 hover:text-[#FF0000] dark:hover:text-[#FF0000] transition-all duration-200 cursor-pointer inline-flex items-center justify-center touch-manipulation"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* Facebook */}
            <a
              href={socialLinks.facebook || 'https://facebook.com/todayscoimbatore'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Follow us on Facebook"
              className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-700 dark:text-gray-300 hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-all duration-200 cursor-pointer inline-flex items-center justify-center touch-manipulation"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* X / Twitter */}
            <a
              href={socialLinks.twitter || 'https://x.com/todayscoimbatore'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (formerly Twitter)"
              title="Follow us on X"
              className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-slate-800 text-stone-700 dark:text-gray-300 hover:text-[#1DA1F2] dark:hover:text-[#1DA1F2] transition-all duration-200 cursor-pointer inline-flex items-center justify-center touch-manipulation"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

      </div>

      {/* BOTTOM COPYRIGHT BAR */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 py-3 border-t border-gray-200/60 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400 font-bold box-border transition-all">
        <span>&copy; {new Date().getFullYear()} TodaysCoimbatore.com. All rights reserved.</span>
        <span>
          Designed and Developed by{' '}
          <a
            href="https://techkeymonk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline text-red-600 transition-colors"
          >
            techkeymonk
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
