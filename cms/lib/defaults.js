// Pure helpers for building default form values from a collection's field schema.

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function defaultForField(field) {
  if (field.default !== undefined) return field.default;
  switch (field.type) {
    case 'boolean':
      return false;
    case 'number':
      return 0;
    case 'array':
      return [];
    default:
      return '';
  }
}

export function defaultForFields(fields) {
  const obj = {};
  for (const field of fields) {
    obj[field.name] = defaultForField(field);
  }
  return obj;
}
