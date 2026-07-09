'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FieldEditor from './FieldEditor';
import { defaultForFields } from '../lib/defaults';

export default function CollectionForm({ collectionSlug, collectionDef, id }) {
  const router = useRouter();
  const isEdit = Boolean(id);
  const [values, setValues] = useState(() => defaultForFields(collectionDef.fields));
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    fetch(`/api/${collectionSlug}/${id}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((doc) => {
        if (!cancelled) setValues({ ...defaultForFields(collectionDef.fields), ...doc });
      })
      .catch(() => !cancelled && setError('Could not load this item.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [collectionSlug, id, isEdit, collectionDef.fields]);

  async function persist(nextValues) {
    setSaving(true);
    setError('');
    setSavedAt(null);
    try {
      const url = isEdit ? `/api/${collectionSlug}/${id}` : `/api/${collectionSlug}`;
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextValues),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      if (isEdit) {
        setSavedAt(Date.now());
        setValues((prev) => ({ ...prev, ...data }));
      } else {
        router.push(`/admin/${collectionSlug}/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateField(name, val) {
    setValues((prev) => {
      const next = { ...prev, [name]: val };
      // Singleton settings-style records (e.g. Brochure) save themselves the
      // instant a field changes — there's no separate list of drafts to
      // review, so waiting for an extra "Save Changes" click just risks the
      // change silently not going live if that click gets missed.
      if (collectionDef.singleton) persist(next);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await persist(values);
  }

  async function handleDelete() {
    if (!confirm('Delete this? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/${collectionSlug}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push(`/admin/${collectionSlug}/new`);
      router.refresh();
    } catch {
      alert('Could not delete this item.');
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 space-y-6">
        {collectionDef.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-accent"> *</span>}
            </label>
            <FieldEditor
              field={field}
              value={values[field.name]}
              onChange={(v) => updateField(field.name, v)}
              allValues={values}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      {savedAt && (
        <p className="text-sm text-emerald-600 mt-4 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Saved — live on the site now.
        </p>
      )}

      <div className="flex items-center gap-4 mt-6 sticky bottom-4 z-10 bg-white border border-gray-100 rounded-2xl shadow-card px-5 py-3.5 w-fit">
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-accent-light shadow-card transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
        </button>
        {!collectionDef.singleton && (
          <button
            type="button"
            onClick={() => router.push(`/admin/${collectionSlug}`)}
            className="text-sm text-gray-500 hover:text-brand-dark transition-colors"
          >
            Back to list
          </button>
        )}
        {collectionDef.singleton && (
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-500 hover:text-brand-dark transition-colors"
          >
            Back to dashboard
          </button>
        )}
        {collectionDef.singleton && isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  );
}
