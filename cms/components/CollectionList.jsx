'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

export default function CollectionList({ collectionSlug, collectionDef }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(() => {
    fetch(`/api/${collectionSlug}?limit=1000`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setDocs(data.docs || []))
      .catch(() => setError('Could not load data.'));
  }, [collectionSlug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/${collectionSlug}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert('Could not delete this item.');
    } finally {
      setDeletingId(null);
    }
  }

  const titleField = collectionDef.titleField || 'title';
  const imageField = collectionDef.fields.find((f) => f.type === 'image')?.name;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark">{collectionDef.label}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{docs ? `${docs.length} item${docs.length === 1 ? '' : 's'}` : 'Loading…'}</p>
        </div>
        <Link
          href={`/admin/${collectionSlug}/new`}
          className="bg-accent text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent-light shadow-soft transition-colors"
        >
          + New
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {docs && docs.length === 0 && (
        <div className="text-sm text-gray-500 bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
          No items yet. Click <span className="font-medium text-accent">+ New</span> to add the first one.
        </div>
      )}

      {docs && docs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft divide-y divide-gray-100 overflow-hidden">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-tint/40 transition-colors">
              {imageField &&
                (doc[imageField] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc[imageField]} alt="" className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 shrink-0" />
                ))}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-brand-dark truncate">
                  {doc[titleField] || doc.title || doc.name || `#${doc.id}`}
                </div>
                {'active' in doc && (
                  <span className={`inline-flex items-center gap-1 text-[11px] mt-0.5 ${doc.active ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doc.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {doc.active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Link href={`/admin/${collectionSlug}/${doc.id}`} className="text-sm font-medium text-brand hover:text-accent transition-colors">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                >
                  {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
