'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dbService, {
  BloodDonorRecord,
  EmergencyBloodAlert,
  DonorContactRequest,
} from '@/services/db';

export default function AdminBloodDonorsPage() {
  const [donors, setDonors] = useState<BloodDonorRecord[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyBloodAlert[]>([]);
  const [donorEnquiries, setDonorEnquiries] = useState<DonorContactRequest[]>([]);
  const [enquiryFilterStatus, setEnquiryFilterStatus] = useState<string>('ALL');
  const [actionSuccess, setActionSuccess] = useState('');

  const refreshData = async () => {
    try {
      const d = await dbService.getBloodDonors();
      setDonors(d);
      const a = await dbService.getEmergencyBloodAlerts();
      setEmergencyAlerts(a);
      const reqs = await dbService.getDonorContactRequests();
      setDonorEnquiries(reqs);
    } catch (e) {
      console.error('Error fetching blood donors admin data', e);
    }
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = dbService.subscribe(refreshData);
    if (typeof window !== 'undefined') {
      window.addEventListener('donorEnquiriesStorageUpdate', refreshData);
      window.addEventListener('donorsStorageUpdate', refreshData);
      window.addEventListener('emergencyBloodStorageUpdate', refreshData);
    }
    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('donorEnquiriesStorageUpdate', refreshData);
        window.removeEventListener('donorsStorageUpdate', refreshData);
        window.removeEventListener('emergencyBloodStorageUpdate', refreshData);
      }
    };
  }, []);

  const handleUpdateEnquiryStatus = async (id: string, status: 'Pending' | 'Verified' | 'Fulfilled') => {
    await dbService.updateDonorContactRequestStatus(id, status);
    await refreshData();
    setActionSuccess(`✓ Request status updated to "${status}"!`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact request?')) return;
    await dbService.deleteDonorContactRequest(id);
    await refreshData();
    setActionSuccess('Contact request deleted.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleApproveDonor = async (id: string) => {
    await dbService.approveBloodDonor(id);
    await refreshData();
    setActionSuccess('✓ Approved donor registration!');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleRejectDonor = async (id: string) => {
    if (!confirm('Reject this donor registration?')) return;
    await dbService.rejectBloodDonor(id);
    await refreshData();
    setActionSuccess('Rejected donor registration.');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const filteredEnquiries = useMemo(() => {
    if (enquiryFilterStatus === 'ALL') return donorEnquiries;
    return donorEnquiries.filter((r) => r.status === enquiryFilterStatus);
  }, [donorEnquiries, enquiryFilterStatus]);

  const pendingDonors = donors.filter((d) => d.status === 'pending' || (!d.isVerified && d.status !== 'rejected'));

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 font-sans p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs font-bold text-stone-500 hover:text-red-600 transition-colors"
            >
              ← Back to Main Admin Portal
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>🩸</span>
            <span>Blood Donors &amp; Patient Contact Requests</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Verify patient contact requests and volunteer donor registrations for Coimbatore.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/blood-donors"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>View Public Blood Donors Page</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-2xs">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} className="text-emerald-700 font-extrabold text-sm p-1 cursor-pointer">✕</button>
        </div>
      )}

      {/* 1. PATIENT CONTACT REQUESTS / ENQUIRIES SECTION */}
      <div className="bg-white border-2 border-red-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse"></span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-wide">
                Pending Contact Requests ({donorEnquiries.length} Total)
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                Enquiries submitted by patients/families requesting blood donor contact numbers.
              </p>
            </div>
          </div>

          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'Pending', 'Verified', 'Fulfilled'].map((st) => {
              const count = st === 'ALL' ? donorEnquiries.length : donorEnquiries.filter((r) => r.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEnquiryFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    enquiryFilterStatus === st
                      ? 'bg-red-600 text-white shadow-xs scale-105'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredEnquiries.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs font-medium bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            No contact requests found under status "{enquiryFilterStatus}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEnquiries.map((req) => (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all shadow-xs ${
                  req.status === 'Pending'
                    ? 'bg-amber-50/70 border-amber-300'
                    : req.status === 'Verified'
                    ? 'bg-blue-50/70 border-blue-300'
                    : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {req.bloodGroup}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-stone-900 leading-tight">
                          {req.patientName}
                        </h3>
                        <span className="text-[11px] text-stone-500 font-bold block mt-0.5">
                          {req.units} Unit(s) • <span className={req.urgency === 'Emergency' ? 'text-red-600 font-black' : 'text-amber-700 font-bold'}>{req.urgency}</span>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : req.status === 'Verified'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-stone-200 text-xs space-y-2 shadow-2xs">
                    <p className="text-stone-800 font-medium">
                      🏥 <strong>Hospital / Locality:</strong> {req.hospital}
                    </p>
                    <p className="text-stone-800 font-medium">
                      📞 <strong>Requester Phone:</strong>{' '}
                      <a href={`tel:${req.contactPhone}`} className="font-mono font-bold text-red-600 hover:underline">
                        {req.contactPhone}
                      </a>
                    </p>
                    {req.donorName && (
                      <div className="pt-2 border-t border-stone-100 text-xs">
                        <span className="text-stone-500 font-bold block text-[10px] uppercase tracking-wider">Requested Donor:</span>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="font-bold text-stone-900">{req.donorName} ({req.donorBloodGroup})</span>
                          {req.donorPhone && (
                            <a href={`tel:${req.donorPhone}`} className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100">
                              📞 {req.donorPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {req.notes && (
                      <p className="text-stone-600 text-[11px] italic pt-1.5 border-t border-stone-100">
                        📝 Notes: "{req.notes}"
                      </p>
                    )}
                    <div className="text-[10px] text-stone-400 font-mono pt-1" suppressHydrationWarning>
                      Submitted: {new Date(req.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateEnquiryStatus(req.id, 'Pending')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        req.status === 'Pending' ? 'bg-amber-600 text-white font-black shadow-2xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateEnquiryStatus(req.id, 'Verified')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        req.status === 'Verified' ? 'bg-blue-600 text-white font-black shadow-2xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      Verified
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateEnquiryStatus(req.id, 'Fulfilled')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        req.status === 'Fulfilled' ? 'bg-emerald-600 text-white font-black shadow-2xs' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      Fulfilled
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEnquiry(req.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                    title="Delete Request"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. PENDING DONOR REGISTRATIONS */}
      {pendingDonors.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Pending Donor Registrations ({pendingDonors.length} Awaiting Approval)
              </h2>
            </div>
            <span className="text-xs text-amber-800 font-bold bg-amber-200/60 px-3 py-1 rounded-full border border-amber-300">
              Hidden from public page until verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDonors.map((donor) => (
              <div
                key={donor.id}
                className="bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {donor.bloodGroup}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                          {donor.name}
                        </h4>
                        <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                          📍 {donor.area}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[9px] uppercase border border-amber-200">
                      Pending
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium text-[11px]">Phone:</span>
                      <a href={`tel:${donor.phone}`} className="font-mono font-bold text-red-600 hover:underline">
                        {donor.phone}
                      </a>
                    </div>
                    {donor.whatsapp && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">WhatsApp:</span>
                        <span className="font-mono text-emerald-700 font-semibold">{donor.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApproveDonor(donor.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>✓</span>
                    <span>Approve &amp; Publish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectDonor(donor.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
