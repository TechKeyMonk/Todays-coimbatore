'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Phone, MessageSquare, ShieldCheck, Camera } from 'lucide-react';
import { DirectoryListing } from '@/services/db';
import { getCategoryFallbackImage } from './DirectoryIcons';

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

  // Reset active photo index when listing changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActivePhotoIdx(0);
    }
  }, [isOpen, listing?.id]);

  // Extract gallery photos strictly from listing.images or fallback
  const photos: string[] = React.useMemo(() => {
    if (!listing) return [];

    let imgs: string[] = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      imgs = listing.images.filter((url) => typeof url === 'string' && url.trim().length > 0);
    }

    if (imgs.length === 0 && listing.imageUrl) {
      imgs = [listing.imageUrl.trim()];
    }

    if (imgs.length === 0) {
      imgs = [getCategoryFallbackImage(listing.category, listing.categorySlug)];
    }

    return imgs;
  }, [listing]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !listing) return null;

  const currentPhotoUrl = photos[activePhotoIdx] || photos[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-stone-50/90 dark:bg-slate-900/90 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                {listing.category}
              </span>
              {listing.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Business
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-stone-300 font-bold text-[10px] border border-stone-200 dark:border-slate-700">
                <Camera className="w-3 h-3 text-amber-500" />
                {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white truncate">
              {listing.name}
            </h3>

            {listing.ownerName && (
              <p className="text-xs text-stone-600 dark:text-stone-300 font-semibold truncate">
                👤 Business Owner: <span className="text-red-600 font-bold">{listing.ownerName}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo gallery modal"
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Photo Showcase */}
        <div className="relative flex-1 bg-stone-950 flex items-center justify-center min-h-[280px] sm:min-h-[420px] max-h-[60vh] overflow-hidden group select-none">
          <img
            key={currentPhotoUrl}
            src={currentPhotoUrl}
            alt={`${listing.name} - Photo ${activePhotoIdx + 1}`}
            className="max-h-[58vh] w-full object-contain select-none transition-all duration-300 animate-in fade-in"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true';
                target.src = getCategoryFallbackImage(listing.category, listing.categorySlug);
              }
            }}
          />

          {/* Navigation Arrows (rendered if more than 1 photo) */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg opacity-85 hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer backdrop-blur-xs shadow-lg opacity-85 hover:scale-105"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Photo Counter Pill */}
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 text-white text-xs font-mono font-bold backdrop-blur-xs border border-white/10 shadow-md">
            {activePhotoIdx + 1} / {photos.length}
          </div>

          {/* Bottom Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-4 text-white space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black truncate">
              {activePhotoIdx === 0 ? 'Cover Photo' : `Gallery Photo ${activePhotoIdx + 1}`} — {listing.name}
            </h4>
            <p className="text-[11px] text-stone-300 truncate">
              📍 {listing.address || listing.area || 'Coimbatore'}
            </p>
          </div>
        </div>

        {/* Thumbnails & Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Scrollable Thumbnails Strip */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1 scrollbar-thin">
            {photos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePhotoIdx(i)}
                aria-label={`Select photo ${i + 1}`}
                className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  activePhotoIdx === i
                    ? 'border-red-600 ring-2 ring-red-600/40 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={p}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = getCategoryFallbackImage(listing.category, listing.categorySlug);
                    }
                  }}
                />
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isUserVerified ? (
              <a
                href={`tel:${listing.phone}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all"
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
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Unlock Number</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenEnquiry) onOpenEnquiry(listing);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer"
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
