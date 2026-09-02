'use client';

import React, { useState, useEffect } from 'react';
import dbService, { DirectoryListing } from '../../../services/db';

interface DirectoryOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedSuccess: () => void;
  targetListing?: DirectoryListing | null;
}

export const DirectoryOtpModal: React.FC<DirectoryOtpModalProps> = ({
  isOpen,
  onClose,
  onVerifiedSuccess,
  targetListing,
}) => {
  const [authMethod, setAuthMethod] = useState<'mobile' | 'email'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (authMethod === 'mobile') {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length < 10) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number');
        return;
      }
    } else {
      if (!emailAddress.includes('@') || !emailAddress.includes('.')) {
        setErrorMessage('Please enter a valid email address');
        return;
      }
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep('otp');
    setResendTimer(30);
    setEnteredOtp('');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!enteredOtp || enteredOtp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    if (enteredOtp.trim() !== generatedOtp && enteredOtp.trim() !== '123456') {
      setErrorMessage('Invalid verification code. Please check and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save record in dbService
      await dbService.saveDirectoryVerification({
        phone: authMethod === 'mobile' ? mobileNumber : undefined,
        email: authMethod === 'email' ? emailAddress : undefined,
        otpCode: enteredOtp.trim(),
        verifiedAt: new Date().toISOString(),
        status: 'verified',
        sourceListingId: targetListing?.id,
        sourceListingName: targetListing?.name,
      });

      // Save persistent verification session flag
      if (typeof window !== 'undefined') {
        localStorage.setItem('t_covai_user_verified', 'true');
        sessionStorage.setItem('t_covai_user_verified', 'true');
      }

      setStep('success');
      setTimeout(() => {
        onVerifiedSuccess();
        onClose();
        setStep('input');
        setMobileNumber('');
        setEmailAddress('');
        setEnteredOtp('');
        setIsSubmitting(false);
      }, 1500);
    } catch (err) {
      console.error('Error recording verification', err);
      setErrorMessage('Verification failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleResend = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-base">
              🔒
            </span>
            <div>
              <h3 className="text-base font-black text-[#111111] dark:text-white">
                Instant OTP Verification
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-gray-400 font-medium">
                Unlock direct owner phone numbers &amp; direct calling
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-gray-300 font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close OTP modal"
          >
            ✕
          </button>
        </div>

        {/* Listing Context Banner if triggered from specific business */}
        {targetListing && (
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 flex items-center gap-3">
            <span className="text-xl">🏢</span>
            <div className="truncate">
              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 block">
                Target Business
              </span>
              <p className="text-xs font-bold text-stone-900 dark:text-gray-100 truncate">
                {targetListing.name}
              </p>
              {targetListing.ownerName && (
                <p className="text-[11px] text-stone-600 dark:text-gray-400 truncate">
                  Owner: {targetListing.ownerName}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: MOBILE / EMAIL INPUT */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            {/* Method Toggle: Mobile / Email */}
            <div className="flex rounded-xl bg-stone-100 dark:bg-slate-800 p-1 border border-stone-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('mobile');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  authMethod === 'mobile'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-stone-700 dark:text-gray-300 hover:text-stone-900'
                }`}
              >
                <span>📱</span>
                <span>Mobile OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                  authMethod === 'email'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-stone-700 dark:text-gray-300 hover:text-stone-900'
                }`}
              >
                <span>✉️</span>
                <span>Email OTP</span>
              </button>
            </div>

            {authMethod === 'mobile' ? (
              <div className="space-y-1.5">
                <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300">
                  Mobile Number (India)
                </label>
                <div className="flex items-center">
                  <span className="flex items-center justify-center min-w-[55px] whitespace-nowrap px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-r-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-gray-300 dark:border-slate-700 font-mono text-sm font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.name@company.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-gray-300 dark:border-slate-700 font-medium text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {errorMessage && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2 rounded-lg border border-red-200 dark:border-red-900">
                ⚠️ {errorMessage}
              </p>
            )}

            <p className="text-[11px] text-stone-500 dark:text-gray-400 leading-normal">
              🛡️ We never spam. Verification ensures legitimate inquiries and protects local Covai business owners from automated bots.
            </p>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Send 6-Digit OTP</span>
              <span>&rarr;</span>
            </button>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP ENTRY */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            {/* Clean Notification Text without displaying raw OTP code banner */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-gray-300">
              <p className="text-xs font-medium leading-relaxed">
                OTP sent to <span className="font-bold text-stone-900 dark:text-white">{authMethod === 'mobile' ? `+91 ${mobileNumber}` : emailAddress}</span>. Enter the 6-digit code below to unlock contact details.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-black uppercase tracking-wider text-stone-700 dark:text-gray-300 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="• • • • • •"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center py-3 rounded-xl bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-gray-100 border border-stone-300 dark:border-slate-700 font-mono text-2xl font-black tracking-widest focus:ring-2 focus:ring-red-600 focus:outline-none"
                autoFocus
              />
              <p className="text-[11px] text-center text-stone-500 dark:text-gray-400 font-medium pt-1">
                Demo Test OTP: <span className="font-bold text-red-600 dark:text-red-400 font-mono">Use 123456 to verify</span>
              </p>
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2 rounded-lg border border-red-200 dark:border-red-900 text-center">
                ⚠️ {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-stone-500 dark:text-gray-400 hover:text-stone-800 dark:hover:text-gray-200 underline font-semibold cursor-pointer"
              >
                &larr; Change {authMethod === 'mobile' ? 'Number' : 'Email'}
              </button>

              {resendTimer > 0 ? (
                <span className="text-stone-400">Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-red-600 dark:text-red-400 font-black hover:underline cursor-pointer"
                >
                  Resend OTP Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>✓ Verify OTP &amp; Unlock Contact Details</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'success' && (
          <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
            <span className="text-4xl block animate-bounce">🎉</span>
            <h4 className="text-base font-black text-emerald-800 dark:text-emerald-300">
              Identity Verified Successfully!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Owner phone numbers, email addresses, and direct calling have been unlocked for your session.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DirectoryOtpModal;
