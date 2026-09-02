'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import Footer from '../../components/Footer';
import {
  Users,
  Zap,
  ShieldCheck,
  Newspaper,
  Calendar,
  ArrowRight,
  Sparkles,
  Droplets,
} from 'lucide-react';

// Staggered Container Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

const stats = [
  { value: '100K+', label: 'Monthly Active Readers', sub: 'Across Covai & Global Diaspora', Icon: Users },
  { value: '24/7', label: 'Live Civic Alert Telemetry', sub: 'TANGEDCO, Traffic & Metro', Icon: Zap },
  { value: '100%', label: 'Independent & Hyper-Local', sub: 'Zero Corporate Agenda', Icon: ShieldCheck },
];

const coreFeatures = [
  {
    Icon: Zap,
    badge: 'Civic Priority',
    title: 'Live TANGEDCO & Traffic Alerts',
    description:
      'Continuous real-time power shutdown maps, feeder status, and Avinashi Road / Ukkadam traffic alerts powered by civic telemetry.',
    color: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    border: 'border-amber-300 dark:border-amber-800/60',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  {
    Icon: Newspaper,
    badge: 'Deep Journalism',
    title: 'Hyper-Local Industry & Culture',
    description:
      'Insightful reporting on Coimbatore’s textile giants, foundry innovations, CODISSIA expos, EV startups, and Kongu heritage.',
    color: 'from-red-500/10 to-rose-500/10 dark:from-red-500/20 dark:to-rose-500/20',
    border: 'border-red-300 dark:border-red-800/60',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  },
  {
    Icon: Droplets,
    badge: '24/7 Lifeline',
    title: 'Emergency Blood Donor Portal',
    description:
      'Direct one-click connection between emergency patients in Coimbatore hospitals and registered voluntary blood donors.',
    color: 'from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20',
    border: 'border-rose-300 dark:border-rose-800/60',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
  {
    Icon: Calendar,
    badge: 'City Life',
    title: 'Covai Events, Expos & Guide',
    description:
      'Curated directory of business expos, hackathons, marathons, cultural festivals, and weekend pop-ups across Coimbatore.',
    color: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    border: 'border-emerald-300 dark:border-emerald-800/60',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
];

const milestones = [
  { year: '1930s', title: 'Textile Capital of South India', desc: 'Stanes & G.D. Naidu laid the engineering foundations that transformed Covai into an industrial powerhouse.' },
  { year: '1970s', title: 'Pump & Precision Engineering Hub', desc: 'Manufacturing 60%+ of India agricultural pumps and critical motor assemblies.' },
  { year: '2026', title: 'Today’s Coimbatore Digital Era', desc: 'Modern digital newsroom amplifying Covai’s rise as a global SaaS, DeepTech, and sustainable industry capital.' },
];

export default function AboutUsClient() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] dark:bg-slate-950 text-[#111111] dark:text-gray-100 font-sans antialiased overflow-x-hidden selection:bg-red-500 selection:text-white transition-colors duration-300">
      {/* Main Full-Bleed Content Wrapper */}
      <main className="w-full">
        {/* 1. HERO SECTION */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative w-full border-b border-stone-200 dark:border-slate-800 bg-gradient-to-b from-[#f5f1e8]/90 via-[#FBF9F5] to-[#FBF9F5] dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950 py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Independent Digital Journalism for Coimbatore</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#111111] dark:text-white leading-[1.12]"
            >
              The Beating Pulse of <span className="text-red-600 dark:text-red-500">Coimbatore</span> — Every Minute, Every Ward.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-3xl mx-auto text-sm sm:text-base lg:text-lg text-[#333333] dark:text-gray-300 font-medium leading-relaxed"
            >
              TodaysCoimbatore.com is the definitive digital newsroom designed exclusively for the people of Coimbatore. From real-time TANGEDCO power shutdown trackers and traffic telemetry to deep industrial reporting and 24/7 emergency blood registries, we empower the city with transparent, hyper-local intelligence.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <motion.a
                href="/#climate-tech"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Live Stories</span>
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="/blood-donors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-xs hover:bg-stone-800 dark:hover:bg-gray-100 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Droplets className="w-4 h-4 text-red-500" />
                <span>Blood Donor Registry</span>
              </motion.a>
            </motion.div>
          </div>
        </motion.section>

        {/* 2. STATS COUNTER BANNER */}
        <section className="w-full bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-800 py-10 px-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="border-b border-stone-200 dark:border-slate-800 pb-2.5 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#111111] dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                OUR DIGITAL FOOTPRINT &amp; CIVIC IMPACT
              </h2>
              <span className="text-xs font-bold text-stone-500 dark:text-gray-400">Live Metrics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat, idx) => {
                const StatIcon = stat.Icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.92 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.12 }}
                    whileHover={{ scale: 1.03 }}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-[#f8f6f0] dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all group cursor-default"
                  >
                    <span className="p-3 rounded-2xl bg-white dark:bg-slate-700 border border-stone-200 dark:border-slate-600 shadow-2xs group-hover:scale-110 transition-transform">
                      <StatIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </span>
                    <div className="space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500">
                        {stat.value}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#111111] dark:text-gray-100">
                        {stat.label}
                      </div>
                      <div className="text-[11px] font-medium text-[#666666] dark:text-gray-400">
                        {stat.sub}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 3. FOUR EDITORIAL PILLARS */}
        <section className="w-full max-w-[1400px] mx-auto py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
              EDITORIAL EXCELLENCE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#111111] dark:text-white">
              Engineered for the Modern Citizen of Covai
            </h2>
            <p className="text-xs sm:text-sm text-[#555555] dark:text-gray-400 font-medium">
              We combine cutting-edge technology with high-integrity journalism to provide real-time updates and public services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, i) => {
              const FeatureIcon = feature.Icon;
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardVariants}
                  className={`p-6 rounded-2xl border ${feature.border} bg-white dark:bg-slate-900 shadow-xs hover:-translate-y-2 hover:shadow-xl hover:border-red-500/60 dark:hover:border-red-500/60 transition-all duration-300 ease-in-out flex flex-col justify-between group relative overflow-hidden`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.color}`} />

                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-2xs group-hover:scale-110 transition-transform duration-300">
                        <FeatureIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${feature.badgeColor}`}>
                        {feature.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#111111] dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {feature.title}
                    </h3>

                    <p className="text-xs sm:text-sm font-medium text-[#444444] dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-stone-500 dark:text-gray-400 group-hover:text-red-600 transition-colors">
                    <span>Explore Section</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 4. HERITAGE & CITY TIMELINE SECTION */}
        <section className="w-full bg-[#f8f6f0] dark:bg-slate-900/60 border-t border-b border-stone-300 dark:border-slate-800 py-12 sm:py-16 px-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="border-b border-[#dcd5c7] dark:border-slate-800 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                  OUR ROOTS &amp; EDITORIAL PHILOSOPHY
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#111111] dark:text-white">
                  Rooted in Coimbatore’s Entrepreneurial Spirit
                </h2>
              </div>
              <span className="text-xs font-bold text-stone-500 dark:text-gray-400">Since 1930 &bull; Maker City</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {milestones.map((m) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 shadow-2xs space-y-2.5"
                >
                  <div className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                    {m.year}
                  </div>
                  <h4 className="text-sm font-black text-[#111111] dark:text-gray-100">
                    {m.title}
                  </h4>
                  <p className="text-xs font-medium text-stone-600 dark:text-gray-300 leading-relaxed">
                    {m.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-xs sm:text-sm font-medium text-[#222222] dark:text-gray-300 leading-relaxed space-y-3 pt-2">
              <p>
                We believe hyper-local journalism should not just inform—it should solve real citizen problems. Whether it is an unexpected power feeder maintenance in Saravanampatti, a critical blood requirement at PSG Hospitals, or an emerging textile machinery export breakthrough in Peelamedu, TodaysCoimbatore is on the frontlines.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
