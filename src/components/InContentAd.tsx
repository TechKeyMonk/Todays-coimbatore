'use client';

import React from 'react';
import Image from 'next/image';

export interface InContentAdData {
  title?: string;
  description?: string;
  sponsorName?: string;
  category?: string;
  imageUrl?: string;
  enquiryUrl?: string;
}

export interface InContentAdProps {
  ad?: InContentAdData;
  className?: string;
}

export const InContentAd: React.FC<InContentAdProps> = ({ ad = {}, className = '' }) => {
  const title = ad.title || 'Kongu Living Gated Villa Community in Saravanampatti';
  const description =
    ad.description ||
    'DTCP & RERA approved luxury smart villas with clubhouse, EV points, and 24/7 security.';
  const sponsorName = ad.sponsorName || 'Kongu Living Developers';
  const category = ad.category || 'PROPERTY SHOWCASE';
  const imageUrl =
    ad.imageUrl ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
  const enquiryUrl = ad.enquiryUrl || '/enquiry';

  return (
    <div
      className={`my-6 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
        {/* Extended Thumbnail + Details Flex Group */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0 flex-1">
          {/* Wider Image Area (Extended up to marked position) */}
          <div className="relative h-28 sm:h-24 w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            <Image
              src={imageUrl}
              alt={title || 'Advertisement'}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 192px"
              className="object-cover"
            />
            <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              {category}
            </span>
          </div>

          {/* Content Info Block */}
          <div className="flex flex-col min-w-0 flex-1 gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {sponsorName}
              </span>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Verified
              </span>
            </div>

            <h4 className="line-clamp-1 text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight min-w-0">
              {title}
            </h4>
            <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400 leading-normal min-w-0">
              {description}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 w-full sm:w-auto self-center">
          <a
            href={enquiryUrl}
            target={enquiryUrl.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="flex sm:inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95 text-center"
          >
            For Enquiry
          </a>
        </div>
      </div>
    </div>
  );
};

export default InContentAd;
