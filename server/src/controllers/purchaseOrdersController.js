// server/src/controllers/purchaseOrdersController.js
import { Op, literal } from 'sequelize';
import {
  sequelize,
  PurchaseOrder,
  PurchaseOrderItem,
  // Company, // uncomment if you want to include Company
} from '../models/index.js';

/* -----------------------------------------------------------------------------
 * Utilities
 * ---------------------------------------------------------------------------*/

// simple paginator that tolerates bad inputs
function getPaginator(q = {}) {
  const page = Math.max(1, parseInt(q.page ?? 1, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? 10, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// basic LIKE search on PO header + (optionally) items
function searchWhere(search) {
  if (!search) return undefined;
  const like = `%${search}%`;
  return {
    [Op.or]: [
      { number: { [Op.like]: like } },
      { vendor: { [Op.like]: like } },
      { status: { [Op.like]: like } },
      // if you want to search currency/plant/supplier/pterms as well:
      { currency: { [Op.like]: like } },
      { supplierCode: { [Op.like]: like } },
      { paymentTerms: { [Op.like]: like } },
      { plantLocation: { [Op.like]: like } },
    ],
  };
}

// generate next PO number like PO-2025-00001
async function nextPONumber(t) {
  const last = await PurchaseOrder.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction: t,
    lock: t?.LOCK?.UPDATE ?? undefined, // lock if inside a transaction
  });
  const year = new Date().getFullYear();
  const seq = (last?.id ?? 0) + 1;
  return `PO-${year}-${String(seq).padStart(5, '0')}`;
}

function calcTotal(items = []) {
  return items.reduce((sum, it) => {
    const q = Number(it.qtyOrdered ?? it.qty ?? 0);
    const p = Number(it.netPrice ?? it.price ?? 0);
    return sum + q * p;
  }, 0);
}

/* -----------------------------------------------------------------------------
 * List / Get
 * ---------------------------------------------------------------------------*/

export const list = async (req, res) => {
  try {
    const { page, limit, offset } = getPaginator(req.query);
    const where = searchWhere(req.query.search);

    const { rows, count } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: PurchaseOrderItem,
          as: 'items',
          required: false,
          // when counting, duplicate rows can appear with include;
          // we'll use DISTINCT on PurchaseOrder.id via distinct flag.
        },
        // { model: Company, as: 'Company' },
      ],
      order: [['id', 'DESC']],
      offset,
      limit,
      distinct: true, // important when including hasMany
    });

    res.json({
      data: rows,
      total: count,
      page,
      limit,
    });
  } catch (err) {
    console.error('PO list error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};

export const getOne = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
    });
    if (!po) return res.status(404).json({ error: 'Not found' });
    res.json(po);
  } catch (err) {
    console.error('PO get error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};

/* -----------------------------------------------------------------------------
 * Create / Update / Delete
 * ---------------------------------------------------------------------------*/

export const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      // header (existing + new)
      number,
      vendor,
      status, // optional, default draft
      total,  // optional, will recompute if missing
      CompanyId,

      // NEW Header (common)
      documentDate,
      supplierCode,
      currency,
      paymentTerms,
      plantLocation,

      // items
      items = [],
    } = req.body || {};

    // Generate PO number if not provided
    const poNumber = number && number.trim() ? number.trim() : await nextPONumber(t);

    const po = await PurchaseOrder.create(
      {
        number: poNumber,
        vendor: vendor ?? '',
        status: status || 'draft',
        total: total ?? calcTotal(items),
        CompanyId: CompanyId ?? null,

        // header (common)
        documentDate: documentDate || null,
        supplierCode: supplierCode || null,
        currency: currency || null,
        paymentTerms: paymentTerms || null,
        plantLocation: plantLocation || null,
      },
      { transaction: t }
    );

    if (Array.isArray(items) && items.length) {
      const rows = items.map((it) => ({
        PurchaseOrderId: po.id,
        // keep backward compatible keys (product/qty/price) + allow extended ones
        product: it.product,
        qty: it.qty,
        price: it.price,

        // optional extended fields (won’t break if your model doesn’t have them)
        itemNo: it.itemNo,
        materialCode: it.materialCode,
        description: it.description,
        qtyRequisitioned: it.qtyRequisitioned,
        qtyOrdered: it.qtyOrdered ?? it.qty, // map if you use qtyOrdered
        qtyReceived: it.qtyReceived,
        qtyInvoiced: it.qtyInvoiced,
        uom: it.uom,
        deliveryDate: it.deliveryDate,
        netPrice: it.netPrice ?? it.price,
        storageLocation: it.storageLocation,
        prReference: it.prReference,
        poReference: it.poReference,
      }));

      await PurchaseOrderItem.bulkCreate(rows, { transaction: t });
    }

    await t.commit();

    const saved = await PurchaseOrder.findByPk(po.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
    });
    res.json(saved);
  } catch (err) {
    await t.rollback();
    console.error('PO create error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};

export const update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!po) {
      await t.rollback();
      return res.status(404).json({ error: 'Not found' });
    }

    const {
      number,
      vendor,
      status,
      total,
      CompanyId,

      // new header (common)
      documentDate,
      supplierCode,
      currency,
      paymentTerms,
      plantLocation,

      items = [],
    } = req.body || {};

    // update header
    await po.update(
      {
        number: number ?? po.number,
        vendor: vendor ?? po.vendor,
        status: status ?? po.status,
        total: (total ?? calcTotal(items ?? [])),
        CompanyId: CompanyId ?? po.CompanyId,

        documentDate: documentDate ?? po.documentDate,
        supplierCode: supplierCode ?? po.supplierCode,
        currency: currency ?? po.currency,
        paymentTerms: paymentTerms ?? po.paymentTerms,
        plantLocation: plantLocation ?? po.plantLocation,
      },
      { transaction: t }
    );

    // replace items (simple, reliable strategy)
    if (Array.isArray(items)) {
      await PurchaseOrderItem.destroy({
        where: { PurchaseOrderId: po.id },
        transaction: t,
      });

      if (items.length) {
        const rows = items.map((it) => ({
          PurchaseOrderId: po.id,
          product: it.product,
          qty: it.qty,
          price: it.price,

          itemNo: it.itemNo,
          materialCode: it.materialCode,
          description: it.description,
          qtyRequisitioned: it.qtyRequisitioned,
          qtyOrdered: it.qtyOrdered ?? it.qty,
          qtyReceived: it.qtyReceived,
          qtyInvoiced: it.qtyInvoiced,
          uom: it.uom,
          deliveryDate: it.deliveryDate,
          netPrice: it.netPrice ?? it.price,
          storageLocation: it.storageLocation,
          prReference: it.prReference,
          poReference: it.poReference,
        }));

        await PurchaseOrderItem.bulkCreate(rows, { transaction: t });
      }
    }

    await t.commit();

    const saved = await PurchaseOrder.findByPk(po.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
    });
    res.json(saved);
  } catch (err) {
    await t.rollback();
    console.error('PO update error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};

export const destroy = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!po) {
      await t.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    await PurchaseOrderItem.destroy({ where: { PurchaseOrderId: po.id }, transaction: t });
    await po.destroy({ transaction: t });
    await t.commit();
    res.json({ ok: true });
  } catch (err) {
    await t.rollback();
    console.error('PO delete error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};

/* -----------------------------------------------------------------------------
 * Transitions
 *  POST /purchase-orders/:id/transition { action: 'approve'|'receive'|'cancel' }
 * ---------------------------------------------------------------------------*/

export const transition = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { action } = req.body || {};
    const po = await PurchaseOrder.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!po) {
      await t.rollback();
      return res.status(404).json({ error: 'Not found' });
    }

    if (action === 'approve') {
      if (po.status === 'cancelled') throw new Error('Cannot approve a cancelled PO');
      await po.update({ status: 'approved' }, { transaction: t });
    } else if (action === 'cancel') {
      if (po.status === 'received') throw new Error('Cannot cancel a received PO');
      await po.update({ status: 'cancelled' }, { transaction: t });
    } else if (action === 'receive') {
      // normally this is driven by GRN, but allowed here if you need it
      await po.update({ status: 'received' }, { transaction: t });
    } else {
      throw new Error('Unsupported action');
    }

    await t.commit();
    const fresh = await PurchaseOrder.findByPk(po.id, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
    });
    res.json(fresh);
  } catch (err) {
    await t.rollback();
    console.error('PO transition error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};
