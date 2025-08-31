// src/controllers/util.js (ESM)
import { Op } from 'sequelize';

/** Basic pagination helper */
export function paginator(query = {}) {
  const page  = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
  const limit = Math.max(1, parseInt(query.limit ?? '10', 10) || 10);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/** LIKE filter for simple text search across fields */
export function likeFilter(fields = [], search = '') {
  if (!search) return {};
  return {
    [Op.or]: fields.map((f) => ({ [f]: { [Op.like]: `%${search}%` } })),
  };
}

/** Normalize to YYYY-MM-DD (safe for DATEONLY) */
export function toDateOnly(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (v?._isAMomentObject && typeof v.format === 'function') {
    return v.format('YYYY-MM-DD');
  }
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }
  return null;
}
