'use client';

import React, { useState } from 'react';
import dbService, { DirectoryListing, DirectoryReview } from '../../../services/db';

interface DirectoryReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: DirectoryListing | null;
  onReviewSubmitted: (newReview: DirectoryReview) => void;
}

export const DirectoryReviewModal: React.FC<DirectoryReviewModalProps> = ({
  isOpen,
  onClose,
  listing,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState('');
  const [userContact, setUserContact] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !listing) return null;

  const RATING_LABELS: Record<number, string> = {
    1: '⭐ 1.0 - Poor Experience',
    2: '⭐ 2.0 - Fair / Needs Improvement',
    3: '⭐ 3.0 - Good Experience',
    4: '⭐ 4.0 - Very Good & Recommended',
    5: '⭐ 5.0 - Excellent & Outstanding',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userName.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMessage('Please write a review of at least 5 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const isEmail = userContact.includes('@');
      const isPhone = !isEmail && userContact.trim() !== '';

      const createdReview = await dbService.saveDirectoryReview({
        listingId: listing.id,
        listingName: listing.name,
        userName: userName.trim(),
        userEmail: isEmail ? userContact.trim() : undefined,
        userPhone: isPhone ? userContact.trim() : undefined,
        rating,
        comment: comment.trim(),
        status: 'approved',
      });

      setIsSuccess(true);
      onReviewSubmitted(createdReview);

      setTimeout(() => {
        setIsSuccess(false);
        setUserName('');
        setUserContact('');
        setComment('');
        setRating(5);
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting review', err);
      setErrorMessage('Failed to submit review. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
              ⭐
            </span>
            <div>
              <h3 className="text-base font-black text-[#111111] dark:text-white">
                Rate &amp; Review Business
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-gray-400 font-medium">
                Share your genuine customer experience with the Coimbatore community
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-gray-300 font-bold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close review modal"
          >
            ✕
          </button>
        </div>

        {/* Target Business Card Header */}
        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 block">
              {listing.category}
            </span>
            <p className="text-xs font-black text-stone-900 dark:text-gray-100 truncate">
              {listing.name}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-gray-400 truncate">
              📍 {listing.area}, Coimbatore
            </p>
          </div>

          <div className="text-right pl-3 shrink-0">
            <span className="text-xs font-black text-amber-500 flex items-center justify-end gap-1">
              <span>★</span>
              <span className="text-stone-900 dark:text-white">{listing.rating}</span>
            </span>
            <span className="text-[10px] text-stone-500 dark:text-gray-400 block">
              ({listing.reviewsCount} reviews)
            </span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
            <span className="text-4xl block animate-bounce">🌟</span>
            <h4 className="text-base font-black text-emerald-800 dark:text-emerald-300">
              Review Submitted Successfully!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Thank you for contributing to Covai&apos;s trusted business directory. Average rating has been updated dynamically.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Interactive 5-Star Selector */}
            <div className="p-4 rounded-xl bg-[#fcfbf7] dark:bg-slate-800/40 border border-stone-200 dark:border-slate-700 space-y-2 text-center">
              <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 text-xs">
                Select Your Star Rating
              </label>

              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-3xl sm:text-4xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                      aria-label={`Rate ${star} star`}
                    >
                      <span className={isFilled ? 'text-amber-400 drop-shadow-xs' : 'text-stone-300 dark:text-gray-600'}>
                        ★
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 h-5 flex items-center justify-center">
                {RATING_LABELS[hoverRating || rating]}
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Karthikeyan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                  Mobile / Email (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98422 00000"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 mb-1">
                Your Review &amp; Feedback *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Share specific details about service quality, pricing, staff behavior, cleanliness, and overall experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
              />
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2 rounded-lg border border-red-200 dark:border-red-900">
                ⚠️ {errorMessage}
              </p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-800 dark:text-gray-200 font-black cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>{isSubmitting ? 'Posting...' : '★ Submit Verified Rating'}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default DirectoryReviewModal;
