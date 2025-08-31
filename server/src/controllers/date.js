// src/controllers/date.js
export function toDateOnly(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    // accept "2025-08-30" or any parsable string
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (v?._isAMomentObject && typeof v.format === 'function') {
    // Moment instance
    return v.format('YYYY-MM-DD');
  }
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }
  return null;
}
