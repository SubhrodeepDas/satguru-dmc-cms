'use client';

import { useRef, useState } from 'react';

export default function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url);
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

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />

      {value ? (
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-100 shadow-soft" />
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-medium text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent-tint transition-colors disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Replace image'}
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
          {uploading ? 'Uploading…' : 'Click or drag an image here to upload'}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
