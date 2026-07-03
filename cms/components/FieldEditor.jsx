'use client';

import { useEffect, useRef, useState } from 'react';
import ImageUploader from './ImageUploader';
import { defaultForFields, slugify } from '../lib/defaults';

// Renders a single field's input based on its schema type. Recurses into itself
// for `array` fields so nested repeaters (e.g. itinerary days -> highlights) work
// at any depth without bespoke per-collection code.
// `allValues` (the whole form's current values) is only needed by `slug` fields,
// which look up their sibling `sourceField` to auto-derive from.
export default function FieldEditor({ field, value, onChange, allValues }) {
  switch (field.type) {
    case 'slug':
      return (
        <SlugField
          field={field}
          value={value}
          sourceValue={allValues ? allValues[field.sourceField] : ''}
          onChange={onChange}
        />
      );
    case 'reference':
      return <ReferenceSelect field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return (
        <textarea
          rows={4}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          required={field.required}
        />
      );
    case 'boolean':
      return (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className="inline-flex items-center gap-2.5 select-none"
        >
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              value ? 'bg-accent' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
                value ? 'translate-x-[22px]' : 'translate-x-1'
              }`}
            />
          </span>
          <span className="text-sm text-gray-600">{value ? 'Yes' : 'No'}</span>
        </button>
      );
    case 'image':
      return <ImageUploader value={value} onChange={onChange} />;
    case 'array':
      return (
        <ArrayField field={field} value={Array.isArray(value) ? value : []} onChange={onChange} />
      );
    case 'text':
    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );
  }
}

// Auto-generates from `sourceValue` (a sibling field, e.g. title) as the user
// types — until they edit the slug directly, at which point it stops following
// and stays exactly what they typed. Starts "locked" (manual) whenever the form
// already has a saved slug on mount, so editing an existing item's title never
// silently rewrites its URL.
function SlugField({ field, value, sourceValue, onChange }) {
  const [locked, setLocked] = useState(() => !!value);
  const lastAutoRef = useRef(value || '');

  useEffect(() => {
    if (locked) return;
    const generated = slugify(sourceValue);
    if (generated !== value) {
      lastAutoRef.current = generated;
      onChange(generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceValue, locked]);

  function handleChange(e) {
    const v = e.target.value;
    onChange(v);
    setLocked(v !== lastAutoRef.current);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input type="text" value={value ?? ''} onChange={handleChange} required={field.required} />
        {locked && (
          <button
            type="button"
            onClick={() => setLocked(false)}
            className="text-xs font-medium text-accent whitespace-nowrap hover:underline"
          >
            Auto-generate
          </button>
        )}
      </div>
      {!locked && (
        <p className="text-xs text-gray-400 mt-1">
          Auto-generated from {field.sourceLabel || 'the title above'}
        </p>
      )}
    </div>
  );
}

// Dropdown populated live from another collection, so a "reference" field
// (e.g. an excursion's destinationSlug) can only ever point at a value that
// actually exists — instead of a free-typed string that can silently drift
// out of sync with the real listing.
function ReferenceSelect({ field, value, onChange }) {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/${field.referenceCollection}?limit=200&sort=order`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const docs = data.docs || [];
        setOptions(
          docs.map((doc) => ({
            value: doc[field.referenceValueField],
            label: doc[field.referenceLabelField] || doc[field.referenceValueField],
          }))
        );
      })
      .catch(() => !cancelled && setError('Could not load options.'));
    return () => {
      cancelled = true;
    };
  }, [field.referenceCollection, field.referenceValueField, field.referenceLabelField]);

  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!options) return <p className="text-sm text-gray-400">Loading options…</p>;

  const currentIsKnown = !value || options.some((o) => o.value === value);

  return (
    <div>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={field.required}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {!currentIsKnown && (
        <p className="text-xs text-red-500 mt-1">
          Current value "{value}" doesn't match any {field.referenceCollection.replace(/-/g, ' ')} — pick one from the list.
        </p>
      )}
      {options.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">
          No {field.referenceCollection.replace(/-/g, ' ')} exist yet — add one first.
        </p>
      )}
    </div>
  );
}

function ArrayField({ field, value, onChange }) {
  function addItem() {
    onChange([...value, defaultForFields(field.fields)]);
  }
  function removeItem(idx) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function moveItem(idx, dir) {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }
  function updateItem(idx, patch) {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {value.map((item, idx) => {
        const heading = (field.itemLabel && item[field.itemLabel]) || `Item ${idx + 1}`;
        return (
          <div key={idx} className="border border-gray-100 rounded-xl p-3.5 bg-brand-tint/40">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-brand-dark/70 truncate">{heading}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveItem(idx, -1)} className="text-xs w-6 h-6 rounded-md hover:bg-white transition-colors" title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => moveItem(idx, 1)} className="text-xs w-6 h-6 rounded-md hover:bg-white transition-colors" title="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => removeItem(idx)} className="text-xs px-2 h-6 rounded-md text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                  Remove
                </button>
              </div>
            </div>
            <div className="space-y-2.5">
              {field.fields.map((sub) => (
                <div key={sub.name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{sub.label}</label>
                  <FieldEditor
                    field={sub}
                    value={item[sub.name]}
                    onChange={(v) => updateItem(idx, { [sub.name]: v })}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-accent border border-accent/30 rounded-lg px-3.5 py-1.5 hover:bg-accent-tint transition-colors"
      >
        + Add {field.label || 'Item'}
      </button>
    </div>
  );
}
