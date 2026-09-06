'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import Footer from '../../components/Footer';
import dbService from '../../services/db';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export default function ContactUsClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('News Tip & Press Release');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Message).');
      return;
    }

    setIsSubmitting(true);
    try {
      await dbService.saveContactEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || 'N/A',
        category: subject.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccessMessage('Thank you! Your enquiry has been received by the TodaysCoimbatore Editorial Bureau.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setErrorMessage('Failed to send enquiry. Please try again or email todayscoimbatore@gmail.com.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#fcfbf7] dark:bg-slate-950 text-[#111111] dark:text-gray-100 flex flex-col font-sans">
      {/* MAIN CONTAINER */}
      <main className="w-full max-w-full px-0 mx-0 flex-1 space-y-0">
        
        {/* HERO BANNER SECTION */}
        <section className="w-full border-b border-stone-300 dark:border-slate-800 bg-gradient-to-br from-white via-[#f8f6f0] to-[#f3ede2] dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 py-10 sm:py-14 px-0 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/10 dark:bg-red-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Editorial Bureau & Civic Helpdesk
              </span>
              <span className="text-xs font-bold text-stone-500 dark:text-gray-400">
                24/7 Citizen Connect
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111111] dark:text-white">
              Contact <span className="text-red-600 dark:text-red-500">TodaysCoimbatore</span>
            </h1>

            <p className="text-sm sm:text-base text-[#333333] dark:text-gray-300 font-medium max-w-2xl">
              Have a breaking story, civic alert, press release, or business enquiry in Coimbatore? Connect directly with our editorial newsroom.
            </p>
          </div>
        </section>

        {/* 2-COLUMN CONTACT GRID */}
        <section className="w-full py-12 sm:py-16 px-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              
              {/* LEFT COLUMN: BUREAU INFO & DIRECT CHANNELS (5 COLS) */}
              <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="border-b border-stone-200 dark:border-slate-800 pb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-red-600 block mb-1">
                      DIRECT DESK REACH
                    </span>
                    <h3 className="text-xl font-black text-[#111111] dark:text-white">
                      Coimbatore Newsroom
                    </h3>
                  </div>

                  {/* Channel 1: Email */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-lg shrink-0 border border-red-200 dark:border-red-900">
                      ✉
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-500 dark:text-gray-400">Email</div>
                      <a
                        href="mailto:todayscoimbatore@gmail.com"
                        className="text-sm font-black text-[#111111] dark:text-white hover:text-red-600 transition-colors"
                      >
                        todayscoimbatore@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Channel 2: Location */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0 border border-amber-200 dark:border-amber-900">
                      📍
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-500 dark:text-gray-400">Location</div>
                      <div className="text-sm font-black text-[#111111] dark:text-white leading-relaxed">
                        Coimbatore
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Links Card */}
                <div className="p-6 rounded-2xl bg-[#f8f6f0] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#111111] dark:text-gray-200 block">
                    URGENT EMERGENCY SERVICES?
                  </span>
                  <p className="text-xs text-[#444444] dark:text-gray-400 leading-relaxed">
                    If you need immediate voluntary blood donation in Coimbatore, visit our live 24/7 registry:
                  </p>
                  <Link
                    href="/blood-donors"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all"
                  >
                    <span>🩸 24/7 Blood Donor Registry</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT COLUMN: INTERACTIVE CONTACT FORM (7 COLS) */}
              <motion.div variants={itemVariants} className="lg:col-span-7">
                <div className="p-6 sm:p-10 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="border-b border-stone-200 dark:border-slate-800 pb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-red-600 block mb-1">
                      SUBMIT AN ENQUIRY OR NEWS TIP
                    </span>
                    <h2 className="text-2xl font-black text-[#111111] dark:text-white">
                      Send a Message to the Editors
                    </h2>
                  </div>

                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      <span>✓</span>
                      <span>{successMessage}</span>
                    </motion.div>
                  )}

                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      <span>⚠</span>
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#111111] dark:text-gray-200">
                          Your Name <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Senthil Kumar"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#fcfbf7] dark:bg-slate-800 text-xs sm:text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#111111] dark:text-gray-200">
                          Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. senthil@domain.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#fcfbf7] dark:bg-slate-800 text-xs sm:text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#111111] dark:text-gray-200">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98422 12345"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#fcfbf7] dark:bg-slate-800 text-xs sm:text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        />
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#111111] dark:text-gray-200">
                          Enquiry Category <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#fcfbf7] dark:bg-slate-800 text-xs sm:text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all cursor-pointer"
                        >
                          <option value="News Tip & Press Release">📰 News Tip & Press Release</option>
                          <option value="Civic & Traffic Alert">⚡ Civic & Traffic Alert</option>
                          <option value="Advertisement & Sponsorship">💼 Advertisement & Sponsorship</option>
                          <option value="Event Listing Submission">🎪 Event Listing Submission</option>
                          <option value="Correction / Editorial Feedback">✍ Correction / Editorial Feedback</option>
                          <option value="General Query">💬 General Query</option>
                        </select>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#111111] dark:text-gray-200">
                        Your Message / Story Details <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please write the details of your story, area/locality in Coimbatore, dates, or enquiry..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-[#fcfbf7] dark:bg-slate-800 text-xs sm:text-sm text-[#111111] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all resize-y"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending Message...</span>
                      ) : (
                        <>
                          <span>Submit Enquiry to Desk</span>
                          <span>&rarr;</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

      </main>

      {/* GLOBAL SITE FOOTER */}
      <Footer />
    </div>
  );
}
