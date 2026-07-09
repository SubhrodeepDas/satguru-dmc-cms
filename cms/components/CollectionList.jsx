'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CollectionList({ collectionSlug, collectionDef }) {
  const router = useRouter();
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [relatedCounts, setRelatedCounts] = useState(null);
  const [referenceLabels, setReferenceLabels] = useState(null);
  const referenceField = collectionDef.fields.find((f) => f.type === 'reference');

  const load = useCallback(() => {
    fetch(`/api/${collectionSlug}?limit=1000`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setDocs(data.docs || []))
      .catch(() => setError('Could not load data.'));
  }, [collectionSlug]);

  useEffect(() => {
    load();
  }, [load]);

  // Optional "N related items" column (e.g. how many Excursions belong to
  // each Explore Listing) — counted from the related collection's own data,
  // not stored on this doc, so it always reflects the current live count.
  useEffect(() => {
    if (!collectionDef.relatedCount) return;
    const { collection, matchField } = collectionDef.relatedCount;
    fetch(`/api/${collection}?limit=1000`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const counts = {};
        (data.docs || []).forEach((d) => {
          const key = d[matchField];
          counts[key] = (counts[key] || 0) + 1;
        });
        setRelatedCounts(counts);
      })
      .catch(() => setRelatedCounts({}));
  }, [collectionDef.relatedCount]);

  // Resolves a `reference` field's stored value (e.g. a destination slug) to
  // its human-readable label (e.g. the city name), for a "which city" column —
  // reuses the same referenceCollection/referenceValueField/referenceLabelField
  // metadata the edit form's dropdown already relies on.
  useEffect(() => {
    if (!referenceField) return;
    fetch(`/api/${referenceField.referenceCollection}?limit=1000`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const labels = {};
        (data.docs || []).forEach((d) => {
          labels[d[referenceField.referenceValueField]] = d[referenceField.referenceLabelField];
        });
        setReferenceLabels(labels);
      })
      .catch(() => setReferenceLabels({}));
  }, [referenceField]);

  // Singleton collections (e.g. Brochure) skip the list entirely — there's
  // only ever one record, so go straight to editing it (or creating it the
  // very first time) instead of showing a list with a "+ New" button.
  useEffect(() => {
    if (!collectionDef.singleton || !docs) return;
    router.replace(docs[0] ? `/admin/${collectionSlug}/${docs[0].id}` : `/admin/${collectionSlug}/new`);
  }, [collectionDef.singleton, docs, collectionSlug, router]);

  if (collectionDef.singleton) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

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
                {!('active' in doc) && 'featured' in doc && (
                  <span className={`inline-flex items-center gap-1 text-[11px] mt-0.5 ${doc.featured ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doc.featured ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {doc.featured ? 'Featured' : 'Not featured'}
                  </span>
                )}
              </div>
              {collectionDef.relatedCount && (
                <div className="text-xs text-gray-400 shrink-0 w-24 text-center">
                  {relatedCounts ? (
                    <span className={relatedCounts[doc[collectionDef.relatedCount.ownField]] ? 'text-brand-dark font-medium' : ''}>
                      {relatedCounts[doc[collectionDef.relatedCount.ownField]] || 0} {collectionDef.relatedCount.label}
                    </span>
                  ) : (
                    '…'
                  )}
                </div>
              )}
              {referenceField && (
                <div className="text-xs text-gray-500 shrink-0 w-36 truncate text-center" title={referenceLabels ? referenceLabels[doc[referenceField.name]] : ''}>
                  {referenceLabels
                    ? referenceLabels[doc[referenceField.name]] || (doc[referenceField.name] || '—')
                    : '…'}
                </div>
              )}
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
