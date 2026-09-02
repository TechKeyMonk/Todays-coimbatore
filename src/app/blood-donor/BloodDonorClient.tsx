'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import UniversalSideLayout from '@/components/UniversalSideLayout';
import dbService, { BloodDonorRecord, EmergencyBloodAlert } from '@/services/db';

export default function BloodDonorClient() {
  const [donors, setDonors] = useState<BloodDonorRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBloodAlert[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Form State for Donor Registration
  const [donorName, setDonorName] = useState('');
  const [donorGroup, setDonorGroup] = useState('O+');
  const [donorArea, setDonorArea] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorWhatsapp, setDonorWhatsapp] = useState('');
  const [donorAvailable, setDonorAvailable] = useState(true);

  // Enquiry / Request Contact Modal State
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedDonorForEnquiry, setSelectedDonorForEnquiry] = useState<BloodDonorRecord | null>(null);
  const [enquiryPatientName, setEnquiryPatientName] = useState('');
  const [enquiryHospital, setEnquiryHospital] = useState('');
  const [enquiryBloodGroup, setEnquiryBloodGroup] = useState('O+');
  const [enquiryUnits, setEnquiryUnits] = useState(1);
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryUrgency, setEnquiryUrgency] = useState<'Emergency' | 'Within 24 Hours'>('Emergency');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState('');

  const handleOpenEnquiry = (donor?: BloodDonorRecord) => {
    if (donor) {
      setSelectedDonorForEnquiry(donor);
      setEnquiryBloodGroup(donor.bloodGroup);
    } else {
      setSelectedDonorForEnquiry(null);
      setEnquiryBloodGroup('O+');
    }
    setIsEnquiryOpen(true);
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryPatientName.trim() || !enquiryHospital.trim() || !enquiryPhone.trim()) return;

    setIsSubmittingEnquiry(true);
    try {
      const payload = {
        donorId: selectedDonorForEnquiry?.id,
        donorName: selectedDonorForEnquiry?.name,
        donorPhone: selectedDonorForEnquiry?.phone,
        donorBloodGroup: selectedDonorForEnquiry?.bloodGroup,
        patientName: enquiryPatientName.trim(),
        hospital: enquiryHospital.trim(),
        bloodGroup: enquiryBloodGroup,
        units: enquiryUnits,
        contactPhone: enquiryPhone.trim(),
        urgency: enquiryUrgency,
        notes: enquiryNotes.trim(),
      };

      const res = await fetch('/api/blood-donors/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEnquiryOpen(false);
        setEnquiryPatientName('');
        setEnquiryHospital('');
        setEnquiryPhone('');
        setEnquiryNotes('');
        setSelectedDonorForEnquiry(null);
        setEnquirySuccess('Request submitted! Admin will verify and contact you shortly.');
        setTimeout(() => setEnquirySuccess(''), 7000);
      } else {
        alert(data.error || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting donor enquiry:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const loadData = async () => {
    try {
      const d = await dbService.getBloodDonors();
      setDonors(d);
      const a = await dbService.getEmergencyBloodAlerts();
      setEmergencyAlerts(a);
    } catch (e) {
      console.error('Failed to load blood donors', e);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('donorsStorageUpdate', handleSync);
    window.addEventListener('emergencyBloodStorageUpdate', handleSync);
    window.addEventListener('todayscoimbatore:db-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('donorsStorageUpdate', handleSync);
      window.removeEventListener('emergencyBloodStorageUpdate', handleSync);
      window.removeEventListener('todayscoimbatore:db-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donorPhone.trim() || !donorArea.trim()) return;

    const newRecord: BloodDonorRecord = {
      id: `donor-${Date.now()}`,
      name: donorName.trim(),
      bloodGroup: donorGroup,
      area: donorArea.trim(),
      phone: donorPhone.trim(),
      whatsapp: donorWhatsapp.trim() || donorPhone.trim(),
      isAvailable: donorAvailable,
      isVerified: false,
      status: 'pending',
      lastDonated: 'Never / Eligible',
      registeredDate: new Date().toISOString().split('T')[0],
    };

    await dbService.createBloodDonor(newRecord);
    setIsRegisterOpen(false);
    setDonorName('');
    setDonorArea('');
    setDonorPhone('');
    setDonorWhatsapp('');
    setRegisterSuccess("Thank you for registering! Your profile is pending verification by Today's Coimbatore Admin.");
    setTimeout(() => setRegisterSuccess(''), 7000);
  };

  const filteredDonors = donors.filter((d) => {
    // Only display approved donors on the public page
    const isApproved = d.status === 'approved' || (d.isVerified && d.status !== 'pending' && d.status !== 'rejected');
    if (!isApproved) return false;

    if (selectedGroup !== 'ALL' && d.bloodGroup.toUpperCase() !== selectedGroup) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.area.toLowerCase().includes(q) ||
        d.bloodGroup.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeUrgentAlerts = emergencyAlerts.filter((a) => a.isActive);

  return (
    <div className="w-full bg-[#fcfbf7] dark:bg-slate-950 text-[#1a1a1a] dark:text-gray-100 font-sans antialiased transition-colors duration-200">
      {/* Universal Side Layout */}
      <UniversalSideLayout pageType="article" className="mt-0 pt-0">
        <div className="w-full max-w-full space-y-8">
        
        {/* Top Emergency Requirement Alert Banner */}
        {activeUrgentAlerts.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-500/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                  🚨 URGENT BLOOD REQUIREMENTS IN COIMBATORE ({activeUrgentAlerts.length})
                </h2>
              </div>
              <span className="text-[11px] font-bold bg-black/25 px-2.5 py-0.5 rounded-full">
                Live Verification Status: Verified ICU Need
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeUrgentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-white text-red-700 font-black text-xs px-2 py-0.5 rounded-md shadow-xs">
                        {alert.bloodGroup}
                      </span>
                      <span className="text-xs font-black">
                        {alert.unitsNeeded} Unit(s) Needed
                      </span>
                      <span className="text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded uppercase">
                        {alert.urgency}
                      </span>
                    </div>
                    <p className="text-xs font-bold truncate text-white/95">
                      🏥 {alert.hospital}
                    </p>
                    <p className="text-[11px] text-white/80 font-medium truncate">
                      Patient: {alert.patientName}
                    </p>
                  </div>

                  <a
                    href={`tel:${alert.contactNumber}`}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs shadow-md transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>CALL ICU</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#153d3b] via-[#0f2e2d] to-[#122423] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300 text-xs font-black tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              24/7 Community Blood Network · Coimbatore
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Save a Life in <span className="text-red-400">Coimbatore</span>.
              <br />
              Find Verified Donors Instantly.
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm md:text-base leading-relaxed">
              Direct access to volunteer blood donors across Gandhipuram, RS Puram, Peelamedu, Saravanampatti, Singanallur, and greater Covai. Zero middleman, 100% free community service.
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenEnquiry()}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>🩸</span>
                <span>Request Contact</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(true)}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>➕</span>
                <span>Register as Donor</span>
              </button>

              <a
                href="tel:108"
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors"
              >
                <span>🚑</span>
                <span>108 Ambulance Hotline</span>
              </a>
            </div>
          </div>
        </div>

        {enquirySuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>{enquirySuccess}</span>
            </div>
            <button onClick={() => setEnquirySuccess('')} className="text-emerald-700 font-black p-1 text-sm cursor-pointer">✕</button>
          </div>
        )}

        {registerSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <span>{registerSuccess}</span>
            </div>
            <button onClick={() => setRegisterSuccess('')} className="text-emerald-700 font-black p-1 text-sm cursor-pointer">✕</button>
          </div>
        )}

        {/* Search & Blood Group Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-stone-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by area (e.g. Peelamedu, RS Puram) or donor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Total Results Count */}
            <div className="text-xs font-bold text-stone-500 dark:text-gray-400 shrink-0 text-right">
              Showing <strong className="text-stone-900 dark:text-white">{filteredDonors.length}</strong> verified donors
            </div>
          </div>

          {/* Blood Group Filter Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-stone-400 dark:text-gray-500 mr-1 shrink-0">
              Group:
            </span>
            {['ALL', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setSelectedGroup(grp)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shrink-0 ${
                  selectedGroup === grp
                    ? 'bg-red-600 text-white shadow-md scale-105'
                    : 'bg-[#f8f6f0] dark:bg-slate-800 text-stone-700 dark:text-gray-300 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        </div>

        {/* Donors Grid */}
        {filteredDonors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDonors.map((donor) => (
              <div
                key={donor.id}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-red-400 dark:hover:border-red-500 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {donor.bloodGroup}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-stone-900 dark:text-white leading-snug group-hover:text-red-600 transition-colors">
                          {donor.name}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                          <span>📍</span>
                          <span>{donor.area}</span>
                        </p>
                      </div>
                    </div>

                    {donor.isVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#fcfbf7] dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/60 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-gray-400 font-medium">Availability:</span>
                      <span className={`font-bold flex items-center gap-1 text-[11px] ${
                        donor.isAvailable ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${donor.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`}></span>
                        {donor.isAvailable ? 'Ready to Donate' : 'Busy / Contact Later'}
                      </span>
                    </div>

                    {donor.lastDonated && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-400 dark:text-gray-500">Last Donated:</span>
                        <span className="text-stone-700 dark:text-gray-300 font-medium">{donor.lastDonated}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Request Contact Button */}
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEnquiry(donor)}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <span>🩸</span>
                    <span>Request Contact</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <span className="text-4xl block">🩸</span>
            <h3 className="text-base font-black text-stone-900 dark:text-white">
              No matching donors found for blood group "{selectedGroup}" in "{searchQuery}"
            </h3>
            <p className="text-xs text-stone-500 dark:text-gray-400 max-w-md mx-auto">
              You can register as the first volunteer donor for this group or contact the Coimbatore Central Blood Bank.
            </p>
            <button
              onClick={() => { setSelectedGroup('ALL'); setSearchQuery(''); }}
              className="inline-block px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
            >
              Reset Filters &amp; View All
            </button>
          </div>
        )}

        {/* Important Covai Blood Banks & Helplines */}
        <div className="bg-[#f3ede2] dark:bg-slate-900 border border-stone-300 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-2">
            <span>🏥</span>
            <span>24/7 Coimbatore Hospital Blood Banks Directory</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-stone-900 dark:text-white block">Coimbatore Medical College (CMCH)</span>
              <p className="text-stone-500 dark:text-gray-400 text-[11px]">Trichy Road, Coimbatore</p>
              <a href="tel:04222300151" className="font-mono font-bold text-red-600 block">📞 0422 230 0151</a>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-stone-900 dark:text-white block">PSG Hospitals Blood Bank</span>
              <p className="text-stone-500 dark:text-gray-400 text-[11px]">Peelamedu, Avinashi Road</p>
              <a href="tel:04224345353" className="font-mono font-bold text-red-600 block">📞 0422 434 5353</a>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-stone-900 dark:text-white block">Ganga Hospital Trauma Blood Bank</span>
              <p className="text-stone-500 dark:text-gray-400 text-[11px]">Ram Nagar / Mettupalayam Rd</p>
              <a href="tel:04222485000" className="font-mono font-bold text-red-600 block">📞 0422 248 5000</a>
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-stone-900 dark:text-white block">IMA Blood Bank Coimbatore</span>
              <p className="text-stone-500 dark:text-gray-400 text-[11px]">State Bank Road, Near Railway Stn</p>
              <a href="tel:04222300400" className="font-mono font-bold text-red-600 block">📞 0422 230 0400</a>
            </div>
          </div>
        </div>

        </div>
      </UniversalSideLayout>

      {/* Public Donor Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span className="text-red-600">🩸</span>
                  Register as a Volunteer Blood Donor
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                  Your phone number will be listed for citizens facing medical emergencies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDonor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Karthik"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-black text-red-600 cursor-pointer"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RS Puram, Peelamedu"
                    value={donorArea}
                    onChange={(e) => setDonorArea(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Mobile Number (Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98422 00000"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-stone-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98422 00000"
                    value={donorWhatsapp}
                    onChange={(e) => setDonorWhatsapp(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donorAvailable}
                    onChange={(e) => setDonorAvailable(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                  />
                  <span>🟢 I am currently healthy and available to donate if needed.</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-gray-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wide shadow-md transition-all cursor-pointer"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enquiry / Request Contact Modal */}
      {isEnquiryOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>🩸</span>
                  <span>Request Blood Contact</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">
                  Submit patient details to get donor contact verified by Admin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-white font-black text-sm p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedDonorForEnquiry && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 block tracking-wider">
                    Selected Volunteer Donor
                  </span>
                  <span className="font-extrabold text-stone-900 dark:text-white">
                    {selectedDonorForEnquiry.name} ({selectedDonorForEnquiry.bloodGroup})
                  </span>
                  <span className="text-stone-500 dark:text-gray-400 text-[11px] block">
                    📍 {selectedDonorForEnquiry.area}
                  </span>
                </div>
                <span className="w-8 h-8 rounded-xl bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  {selectedDonorForEnquiry.bloodGroup}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitEnquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name of patient"
                  value={enquiryPatientName}
                  onChange={(e) => setEnquiryPatientName(e.target.value)}
                  className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                  Hospital / Location in Coimbatore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PSG Hospitals, Peelamedu / KMCH Avinashi Rd"
                  value={enquiryHospital}
                  onChange={(e) => setEnquiryHospital(e.target.value)}
                  className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Required Blood Group *
                  </label>
                  <select
                    value={enquiryBloodGroup}
                    onChange={(e) => setEnquiryBloodGroup(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Units Required *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={enquiryUnits}
                    onChange={(e) => setEnquiryUnits(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98422 00000"
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-stone-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                    Urgency Level *
                  </label>
                  <select
                    value={enquiryUrgency}
                    onChange={(e) => setEnquiryUrgency(e.target.value as 'Emergency' | 'Within 24 Hours')}
                    className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-stone-900 dark:text-white font-bold"
                  >
                    <option value="Emergency">🚨 Emergency (Immediate Need)</option>
                    <option value="Within 24 Hours">⏱️ Within 24 Hours (Scheduled)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-gray-300 uppercase mb-1">
                  Additional Notes (Doctor / ICU / Case No.)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details e.g. ICU Ward 3, Dr. Suresh"
                  value={enquiryNotes}
                  onChange={(e) => setEnquiryNotes(e.target.value)}
                  className="w-full bg-[#f8f6f0] dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-stone-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnquiryOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-gray-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEnquiry}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEnquiry ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
