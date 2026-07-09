'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';

// Same upload flow as ImageUploader, but for non-image files (e.g. a PDF
// brochure) — shows a file name/link instead of an image preview.
export default function FileUploader({ value, onChange, accept }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      let url;
      try {
        // Preferred: upload straight from the browser to Vercel Blob. This
        // bypasses Vercel's ~4.5 MB serverless request-body limit, so large
        // PDF brochures upload fine (the plain /api/upload route 413s on those).
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload/client',
          contentType: file.type || undefined,
        });
        url = blob.url;
      } catch (clientErr) {
        // Fallback (e.g. local dev with no Blob token): stream through the
        // server route, which writes to public/uploads.
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            data.error ||
              (res.status === 413
                ? 'File is too large to upload.'
                : 'Upload failed (' + res.status + ').')
          );
        }
        url = data.url;
      }
      // Keep the original file name alongside the (randomized, collision-safe)
      // storage URL, so the admin sees the name they actually uploaded.
      onChange({ url, name: file.name });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e) {
    uploadFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    uploadFile(e.dataTransfer.files?.[0]);
  }

  // `value` is normally { url, name }, but older/legacy data may just be a
  // plain URL string — support both so nothing already saved breaks.
  const fileUrl = typeof value === 'string' ? value : value?.url || '';
  const fileName = typeof value === 'string' || !value?.name
    ? (fileUrl ? decodeURIComponent(fileUrl.split('/').pop()) : '')
    : value.name;

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept || '*/*'} className="hidden" onChange={handleFileInput} />

      {fileUrl ? (
        <div className="flex items-center gap-3.5">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 text-sm font-medium text-brand-dark truncate border border-gray-100 rounded-xl px-3.5 py-2.5 bg-gray-50 hover:bg-brand-tint/40 transition-colors"
            title={fileName}
          >
            {fileName}
          </a>
          <div className="flex flex-col items-start gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent-tint transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Replace file'}
            </button>
            <button type="button" onClick={() => onChange('')} className="text-xs text-red-500 hover:text-red-600 transition-colors">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-7 text-center text-sm transition-colors ${
            dragOver ? 'border-accent bg-accent-tint text-accent' : 'border-gray-200 text-gray-400 hover:border-accent/40 hover:bg-gray-50'
          }`}
        >
          {uploading ? 'Uploading…' : 'Click or drag a file here to upload'}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
