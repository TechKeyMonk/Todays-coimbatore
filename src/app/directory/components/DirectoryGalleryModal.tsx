'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Phone, MessageSquare, ShieldCheck, Eye } from 'lucide-react';
import { DirectoryListing } from '@/services/db';

interface DirectoryGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: DirectoryListing | null;
  onOpenEnquiry?: (listing: DirectoryListing) => void;
  isUserVerified?: boolean;
  onUnlockContact?: (listing: DirectoryListing) => void;
}

export const DirectoryGalleryModal: React.FC<DirectoryGalleryModalProps> = ({
  isOpen,
  onClose,
  listing,
  onOpenEnquiry,
  isUserVerified,
  onUnlockContact,
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!isOpen || !listing) return null;

  // Generate gallery photos for this listing
  const photos = [
    {
      url: listing.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      title: `${listing.name} — Main Facade & Entrance`,
      caption: `Exterior view of ${listing.name} located in ${listing.area || 'Coimbatore'}.`,
    },
    {
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      title: `${listing.name} — Customer Service & Lounge`,
      caption: `Dedicated customer desk and reception area in ${listing.area || 'Coimbatore'}.`,
    },
    {
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      title: `${listing.name} — Operations & Service Area`,
      caption: `Verified commercial facilities offering premium ${listing.category} services.`,
    },
  ];

  const currentPhoto = photos[activePhotoIdx] || photos[0];

  const handleNext = () => {
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-stone-50/80 dark:bg-slate-900/80">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                {listing.category}
              </span>
              {listing.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Business
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white truncate">
              {listing.name} — Photo Gallery
            </h3>
            {listing.ownerName && (
              <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold">
                👤 Business Owner: <span className="text-red-600 font-bold">{listing.ownerName}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Photo Showcase */}
        <div className="relative flex-1 bg-stone-950 flex items-center justify-center min-h-[300px] sm:min-h-[420px] overflow-hidden group">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.title}
            className="max-h-[60vh] w-full object-contain select-none transition-all duration-300"
          />

          {/* Navigation Arrows */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg opacity-80 group-hover:opacity-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg opacity-80 group-hover:opacity-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Photo Counter */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-mono font-bold backdrop-blur-xs">
            {activePhotoIdx + 1} / {photos.length}
          </div>

          {/* Bottom Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white space-y-1">
            <h4 className="text-xs sm:text-sm font-black">{currentPhoto.title}</h4>
            <p className="text-[11px] text-stone-300 line-clamp-1">{currentPhoto.caption}</p>
          </div>
        </div>

        {/* Thumbnails & Action Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  activePhotoIdx === i
                    ? 'border-red-600 ring-2 ring-red-600/30 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={p.url} alt={p.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isUserVerified ? (
              <a
                href={`tel:${listing.phone}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call: {listing.phone}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onUnlockContact) onUnlockContact(listing);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Contact Number</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenEnquiry) onOpenEnquiry(listing);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send Enquiry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectoryGalleryModal;
