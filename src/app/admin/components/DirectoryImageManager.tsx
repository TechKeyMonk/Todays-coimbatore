'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link as LinkIcon,
  X,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Star,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface ImageSlotItem {
  id: string; // unique key for react
  type: 'file' | 'url';
  file?: File;
  previewUrl: string; // blob url or external url
  urlValue?: string; // external url if type === 'url'
}

interface DirectoryImageManagerProps {
  initialImages?: string[];
  onChange?: (images: ImageSlotItem[]) => void;
  listingId?: string;
  disabled?: boolean;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
];

export const DirectoryImageManager: React.FC<DirectoryImageManagerProps> = ({
  initialImages = [],
  onChange,
  listingId = 'new',
  disabled = false,
}) => {
  const [items, setItems] = useState<ImageSlotItem[]>(() => {
    return (initialImages || [])
      .filter((url) => typeof url === 'string' && url.trim().length > 0)
      .slice(0, MAX_IMAGES)
      .map((url, idx) => ({
        id: `init-${idx}-${Date.now()}`,
        type: 'url',
        previewUrl: url.trim(),
        urlValue: url.trim(),
      }));
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (onChange) {
      onChange(items);
    }
  }, [items, onChange]);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      showError(
        `Invalid file format "${file.name}". Only PNG, JPG, JPEG, WEBP, and AVIF are allowed.`
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError(
        `File "${file.name}" exceeds 5MB size limit (${(file.size / (1024 * 1024)).toFixed(2)}MB).`
      );
      return false;
    }
    return true;
  };

  const handleAddFiles = (files: FileList | File[]) => {
    if (items.length >= MAX_IMAGES) {
      showError(`Maximum of ${MAX_IMAGES} photos allowed per business listing.`);
      return;
    }

    const remainingSlots = MAX_IMAGES - items.length;
    const fileList = Array.from(files).slice(0, remainingSlots);

    const newItems: ImageSlotItem[] = [];
    for (const file of fileList) {
      if (validateFile(file)) {
        const previewUrl = URL.createObjectURL(file);
        newItems.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: 'file',
          file,
          previewUrl,
        });
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) return;

    if (!/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(cleanUrl)) {
      showError('Please enter a valid HTTP/HTTPS image URL.');
      return;
    }

    if (items.length >= MAX_IMAGES) {
      showError(`Maximum of ${MAX_IMAGES} photos allowed per business listing.`);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'url',
        previewUrl: cleanUrl,
        urlValue: cleanUrl,
      },
    ]);
    setUrlInput('');
  };

  const handleRemove = (index: number) => {
    setItems((prev) => {
      const target = prev[index];
      if (target && target.type === 'file' && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Drag & drop zone handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-stone-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="block text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
            📸 Business Photo Gallery (Up to {MAX_IMAGES} Photos)
          </label>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
            Slot 1 serves as the primary Cover Photo on directory cards.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              items.length === MAX_IMAGES
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-stone-300'
            }`}
          >
            {items.length} / {MAX_IMAGES} Selected
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Input Mode Switcher (Upload vs External URL) */}
      {items.length < MAX_IMAGES && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-700 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Direct File Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>External Image URL</span>
            </button>
          </div>

          {/* Mode 1: Drag & Drop / File Picker */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20'
                  : 'border-stone-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-red-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-800 dark:text-white">
                  Drag &amp; drop photos here, or <span className="text-red-600 underline">browse files</span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  Supported: PNG, JPG, JPEG, WEBP, AVIF (Max Size: 5MB per image)
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: External Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or CDN link"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrl();
                    }
                  }}
                  disabled={disabled}
                  className="flex-1 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-mono text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddUrl()}
                  disabled={disabled || !urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Supported: PNG, JPG, JPEG, WEBP, AVIF (Max Size: 5MB per image)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected Photos List / Reordering Stack */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-2.5 w-full pt-1">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 border rounded-lg w-full overflow-hidden transition-all ${
                idx === 0
                  ? 'border-amber-400 dark:border-amber-500 shadow-2xs ring-1 ring-amber-400/30'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Left Section (Image + Meta Info) */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-200 dark:border-slate-800">
                  <img
                    src={item.previewUrl}
                    alt={`Listing photo ${idx + 1}`}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                    onError={(e) => {
                      // Fallback broken handling
                      const target = e.currentTarget;
                      if (!target.dataset.failed) {
                        target.dataset.failed = 'true';
                        target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=75';
                      }
                    }}
                  />
                  {idx === 0 && (
                    <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-amber-500 text-black font-black text-[7px] uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2 h-2 fill-black" />
                    </div>
                  )}
                </div>

                {/* Meta Column */}
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {idx === 0 && (
                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded w-max whitespace-nowrap bg-amber-500 text-black uppercase">
                        COVER
                      </span>
                    )}
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded w-max whitespace-nowrap bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                      {item.type === 'file' ? 'LOCAL FILE' : 'EXTERNAL URL'}
                    </span>
                  </div>

                  <p
                    title={item.type === 'file' ? item.file?.name : item.urlValue}
                    className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[160px] sm:max-w-[280px] md:max-w-[360px] font-mono"
                  >
                    {item.type === 'file' ? item.file?.name : item.urlValue}
                  </p>
                </div>
              </div>

              {/* Right Section (Action Controls) */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-auto pl-2">
                <button
                  type="button"
                  disabled={disabled || idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  title="Move Up"
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || idx === items.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  title="Move Down"
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemove(idx)}
                  title="Delete"
                  className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 text-center text-stone-400 dark:text-stone-500 text-xs italic">
          No photos added yet. Upload files or paste URLs above.
        </div>
      )}
    </div>
  );
};

/**
 * Upload helper: processes all ImageSlotItems, uploading any local files
 * to Supabase bucket `directory-gallery` at `listings/{id}/{timestamp}_{index}.ext`
 * and returning the complete merged array of public URLs (max 5).
 */
export async function uploadDirectoryImages(
  items: ImageSlotItem[],
  listingId: string
): Promise<string[]> {
  const finalUrls: string[] = [];
  const cleanListingId = listingId.replace(/[^a-zA-Z0-9_-]/g, '') || 'listing';

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.type === 'url' && item.urlValue) {
      finalUrls.push(item.urlValue.trim());
      continue;
    }

    if (item.type === 'file' && item.file) {
      const file = item.file;
      let ext = 'jpg';
      if (file.type.includes('png')) ext = 'png';
      else if (file.type.includes('webp')) ext = 'webp';
      else if (file.type.includes('avif')) ext = 'avif';
      else if (file.name.includes('.')) {
        ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      }

      const timestamp = Date.now();
      const filePath = `listings/${cleanListingId}/${timestamp}_${i}.${ext}`;

      // First attempt direct Supabase client upload
      try {
        const { error: uploadError } = await supabase.storage
          .from('directory-gallery')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadError) {
          console.warn('[DirectoryImageManager] Direct upload failed, trying server API:', uploadError.message);
          // Fallback to server API
          const formData = new FormData();
          formData.append('file', file);
          formData.append('listingId', cleanListingId);
          formData.append('slotIndex', String(i));

          const res = await fetch('/api/directory/upload', {
            method: 'POST',
            body: formData,
          });
          const json = await res.json();
          if (json.success && json.url) {
            finalUrls.push(json.url);
            continue;
          } else {
            throw new Error(json.error || 'Server upload failed');
          }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('directory-gallery')
          .getPublicUrl(filePath);

        finalUrls.push(publicUrl);
      } catch (err: any) {
        console.error(`Error uploading image slot ${i}:`, err);
        throw new Error(`Failed to upload photo "${file.name}": ${err.message || 'Unknown error'}`);
      }
    }
  }

  return finalUrls.slice(0, MAX_IMAGES);
}

export default DirectoryImageManager;
