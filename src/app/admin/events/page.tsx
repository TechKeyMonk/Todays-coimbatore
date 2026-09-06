'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dbService, { EventRecord } from '@/services/db';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRecord | null>(null);

  // New Event Form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newMapLink, setNewMapLink] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOrganizer, setNewOrganizer] = useState('');
  const [newFeatured, setNewFeatured] = useState(false);

  // Load events
  const loadEvents = async () => {
    try {
      const data = await dbService.getEvents();
      setEvents(data || []);
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    const unsubscribe = dbService.subscribe(loadEvents);
    if (typeof window !== 'undefined') {
      window.addEventListener('eventsStorageUpdate', loadEvents);
      window.addEventListener('todayscoimbatore:db-updated', loadEvents);
    }
    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('eventsStorageUpdate', loadEvents);
        window.removeEventListener('todayscoimbatore:db-updated', loadEvents);
      }
    };
  }, []);

  // Sync helper
  const syncEvents = async (updated: EventRecord[]) => {
    setEvents(updated);
    await dbService.saveEvents(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('t_covai_events', JSON.stringify(updated));
      } catch (err) {
        console.warn('localStorage write failed:', err);
      }
      window.dispatchEvent(new Event('eventsStorageUpdate'));
      window.dispatchEvent(new CustomEvent('todayscoimbatore:db-updated', { detail: { table: 'events' } }));
    }
  };

  // Image Upload Handler with 10MB validation & allowed formats
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
      e.target.value = '';
      return;
    }

    const validMimes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/avif',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
    ];

    if (!validMimes.includes(file.type.toLowerCase())) {
      alert('Unsupported image format. Allowed: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (isEdit && editingEvent) {
        setEditingEvent({ ...editingEvent, posterUrl: base64 });
      } else {
        setNewPosterUrl(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Event Handler
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newTitle.trim() || !newVenue.trim()) {
      alert('Please fill in required fields (Event Title and Venue).');
      return;
    }

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const title = newTitle.trim();
      const venue = newVenue.trim() || 'Coimbatore';
      const description = newDesc.trim() || 'Coimbatore public exhibition and community event.';
      const imageUrl = newPosterUrl.trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80';
      const date = newDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const time = newTime.trim() || '10:00 AM – 06:00 PM';
      const organizer = newOrganizer.trim() || 'Coimbatore Event Bureau';
      const mapLink = newMapLink.trim() || `https://maps.google.com/?q=${encodeURIComponent(venue + ' Coimbatore')}`;
      const videoUrl = newVideoUrl.trim() || undefined;

      const payload = {
        title,
        event_name: title,
        description,
        image_url: imageUrl,
        poster_url: imageUrl,
        posterUrl: imageUrl,
        venue,
        location: venue,
        event_date: date,
        event_time: time,
        date,
        time,
        contact_phone: '+91 98765 43210',
        category: 'EVENT',
        is_featured: newFeatured,
        featured: newFeatured,
        organizer,
        mapLink,
        videoUrl,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.success === false) {
        throw new Error(resJson.error || 'Server error inserting event into database.');
      }

      const serverRecord = resJson.data;
      const created: EventRecord = {
        id: serverRecord?.id || `evt-${Date.now()}`,
        title,
        category: 'EVENT',
        date,
        time,
        venue,
        mapLink,
        posterUrl: imageUrl,
        videoUrl,
        description,
        organizer,
        status: 'upcoming',
        featured: newFeatured,
        createdAt: serverRecord?.created_at || nowIso,
        updatedAt: serverRecord?.created_at || nowIso,
      };

      const updated = [created, ...events];
      await syncEvents(updated);
      await loadEvents();

      setIsAddingEvent(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewVenue('');
      setNewMapLink('');
      setNewPosterUrl('');
      setNewVideoUrl('');
      setNewDesc('');
      setNewOrganizer('');
      setNewFeatured(false);

      setActionSuccess(`✓ Published event "${created.title}" successfully!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to create event:', err);
      alert('Failed to publish event: ' + (err?.message || 'Unknown server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const title = (editingEvent.title || '').trim();
      const venue = (editingEvent.venue || 'Coimbatore').trim();
      const description = (editingEvent.description || 'Coimbatore public event.').trim();
      const imageUrl = (editingEvent.posterUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80').trim();
      const date = editingEvent.date || new Date().toISOString().split('T')[0];
      const time = (editingEvent.time || '10:00 AM – 06:00 PM').trim();

      const payload = {
        id: editingEvent.id,
        title,
        event_name: title,
        description,
        image_url: imageUrl,
        poster_url: imageUrl,
        posterUrl: imageUrl,
        venue,
        location: venue,
        event_date: date,
        event_time: time,
        date,
        time,
        contact_phone: '+91 98765 43210',
        category: 'EVENT',
        is_featured: editingEvent.featured || false,
        featured: editingEvent.featured || false,
        organizer: editingEvent.organizer || 'Coimbatore Event Bureau',
        mapLink: editingEvent.mapLink || `https://maps.google.com/?q=${encodeURIComponent(venue + ' Coimbatore')}`,
        videoUrl: editingEvent.videoUrl || undefined,
      };

      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.success === false) {
        throw new Error(resJson.error || 'Server error updating event.');
      }

      const updatedRecord: EventRecord = {
        ...editingEvent,
        title,
        venue,
        description,
        posterUrl: imageUrl,
        category: 'EVENT',
        updatedAt: nowIso,
      };

      const updated = events.map((ev) => (ev.id === editingEvent.id ? updatedRecord : ev));
      await syncEvents(updated);
      await loadEvents();

      setEditingEvent(null);
      setActionSuccess(`✓ Updated event "${editingEvent.title}"!`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      alert('Failed to update event: ' + (err?.message || 'Unknown server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete event "${title}"?`)) return;
    const updated = events.filter((ev) => ev.id !== id);
    await syncEvents(updated);

    try {
      await fetch(`/api/events?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (delErr) {
      console.warn('API /api/events DELETE notice:', delErr);
    }

    setActionSuccess(`Deleted event "${title}"`);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  // Toggle Featured
  const handleToggleFeatured = async (id: string) => {
    const updated = events.map((ev) => (ev.id === id ? { ...ev, featured: !ev.featured } : ev));
    await syncEvents(updated);
    setActionSuccess('Updated event featured status!');
    setTimeout(() => setActionSuccess(''), 2000);
  };

  // Filtered list by search query (no subcategory pills!)
  const filteredEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.venue && ev.venue.toLowerCase().includes(q)) ||
      (ev.organizer && ev.organizer.toLowerCase().includes(q)) ||
      (ev.description && ev.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs font-bold text-stone-500 hover:text-emerald-700 transition-colors"
            >
              ← Back to Main Admin Portal
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight flex items-center gap-2">
              <span>🎟️</span>
              <span>Events &amp; Expos Management</span>
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300">
              CMS PORTAL
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Publish and manage informative Coimbatore exhibitions, summits, conferences, and community festivals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/events"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>View Public /events Page</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span>➕</span>
            <span>Add New Event</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn shadow-2xs">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-700 font-extrabold text-sm p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats and Search Bar (NO sub-category filter pills container) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-4 text-xs font-bold text-stone-600">
          <span>Total Events: <strong className="text-stone-900">{events.length}</strong></span>
          <span>•</span>
          <span>Featured: <strong className="text-amber-600">{events.filter(e => e.featured).length}</strong></span>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search events by title, venue, organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-stone-400 font-bold">
          Loading Coimbatore events records...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🎟️</div>
          <h3 className="text-sm font-bold text-stone-800">No events found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `No events matched your search "${searchQuery}".`
              : 'No Coimbatore events published yet. Click "Add New Event" to get started.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs"
          >
            + Create First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col h-full justify-between hover:border-[#153d3b] transition-all"
            >
              <div>
                {/* Media Preview with Zero-Crash Fallback */}
                <div className="relative w-full aspect-[16/9] bg-slate-900/90 overflow-hidden rounded-t-xl flex items-center justify-center group">
                  {ev.posterUrl ? (
                    <>
                      <img
                        src={ev.posterUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-sm opacity-35 scale-110 pointer-events-none"
                      />
                      <img
                        src={ev.posterUrl}
                        alt={ev.title || 'Event'}
                        className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-stone-600">
                      🎟️
                    </div>
                  )}

                  {/* Video Badge */}
                  {ev.videoUrl && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <span className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center text-sm shadow-md">
                        ▶
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    {ev.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-900 text-[10px] font-black uppercase shadow-xs">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-red-600 font-bold">
                    <span>📅 {ev.date || 'TBD'}</span>
                    <span>•</span>
                    <span>⏰ {ev.time || '10:00 AM – 06:00 PM'}</span>
                  </div>

                  <h3 className="text-sm font-black text-stone-900 line-clamp-2 leading-snug">
                    {ev.title || 'Untitled Event'}
                  </h3>

                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {ev.description || 'Public Coimbatore exhibition and festival.'}
                  </p>

                  <div className="pt-2 border-t border-stone-100 text-xs space-y-1">
                    <p className="text-stone-700 font-medium truncate flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{ev.venue || 'Coimbatore, Tamil Nadu'}</span>
                    </p>
                    {ev.organizer && (
                      <p className="text-[11px] text-stone-400 truncate">
                        Organizer: <strong className="text-stone-600">{ev.organizer}</strong>
                      </p>
                    )}
                    {ev.mapLink && (
                      <a
                        href={ev.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:underline inline-block pt-0.5"
                      >
                        View Location on Google Maps &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(ev.id)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    ev.featured
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {ev.featured ? '⭐ Featured' : '☆ Feature'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEvent(ev)}
                    className="px-2.5 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id, ev.title)}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CREATE NEW EVENT                                            */}
      {/* ------------------------------------------------------------------ */}
      {isAddingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>🎟️</span>
                  <span>Create Coimbatore Event / Festival</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Publish a new expo, conference, cultural carnival or sports event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                disabled={isSubmitting}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CODISSIA INTEC 2026 Machinery Expo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="10:00 AM – 06:00 PM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Venue &amp; Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CODISSIA Trade Fair Complex, Halls A to E, Coimbatore"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={newMapLink}
                    onChange={(e) => setNewMapLink(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Organizer Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CODISSIA / INTEC Association"
                    value={newOrganizer}
                    onChange={(e) => setNewOrganizer(e.target.value)}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Enhanced All-Format Poster Image Upload & Validation */}
              <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Event Poster Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, image/svg+xml, image/bmp"
                    onChange={(e) => handleImageFileChange(e, false)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#153d3b] file:text-white hover:file:bg-[#0d4d4d] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Or Image URL:</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={newPosterUrl}
                      onChange={(e) => setNewPosterUrl(e.target.value)}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP (Max Size: 10MB per Image)
                  </p>
                  {newPosterUrl && (
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shadow-xs">
                      <img src={newPosterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewPosterUrl('')}
                        className="absolute top-1 right-1 bg-black/75 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Promo Video URL (YouTube or MP4)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  placeholder="Key highlights, exhibitors, agenda, and target audience..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFeatured}
                    onChange={(e) => setNewFeatured(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Mark as Featured Event on Homepage</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing Event Live...</span>
                    </>
                  ) : (
                    <span>Publish Event Live</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: EDIT EVENT                                                  */}
      {/* ------------------------------------------------------------------ */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-[#1a1a1a] flex items-center gap-2">
                  <span>✏️</span>
                  <span>Edit Event Record</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Update timings, media links, and venue information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                disabled={isSubmitting}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Time Window *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Venue &amp; Location *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.venue}
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold"
                />
              </div>

              {/* Enhanced All-Format Poster Image Upload & Validation */}
              <div className="space-y-2 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                <label className="block text-xs font-bold text-stone-700 uppercase">
                  Event Poster Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif, image/svg+xml, image/bmp"
                    onChange={(e) => handleImageFileChange(e, true)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#153d3b] file:text-white hover:file:bg-[#0d4d4d] cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase shrink-0">Or Image URL:</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or CDN link"
                      value={editingEvent.posterUrl || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, posterUrl: e.target.value })}
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-mono text-stone-900"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium">
                    Supported: PNG, JPG, JPEG, WEBP, AVIF, GIF, SVG, BMP (Max Size: 10MB per Image)
                  </p>
                  {editingEvent.posterUrl && (
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shadow-xs">
                      <img src={editingEvent.posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingEvent({ ...editingEvent, posterUrl: '' })}
                        className="absolute top-1 right-1 bg-black/75 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={editingEvent.mapLink || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, mapLink: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Promo Video URL
                  </label>
                  <input
                    type="url"
                    value={editingEvent.videoUrl || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, videoUrl: e.target.value })}
                    className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Event Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="w-full bg-[#f8f6f0] border border-stone-300 rounded-xl p-2.5 text-xs text-stone-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingEvent.featured}
                    onChange={(e) => setEditingEvent({ ...editingEvent, featured: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span>⭐ Featured Event</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl bg-[#153d3b] hover:bg-[#0d4d4d] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                    isSubmitting ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Event Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
