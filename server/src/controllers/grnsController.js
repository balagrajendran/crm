// src/controllers/grnsController.js
import { sequelize, PurchaseOrder, PurchaseOrderItem, GRN, GRNItem } from '../models/index.js';


import { paginator, toDateOnly } from './util.js'
import { Op } from 'sequelize'

async function loadPOWithItems(poId) {
  return PurchaseOrder.findByPk(poId, {
    include: [{ model: PurchaseOrderItem, as:'items' }]
  });
}

export async function list(req,res){
  const { page, limit, offset } = paginator(req.query)
  const q = (req.query.search||'').trim()
  const like = { [Op.like]: `%${q}%` }
  const where = q ? { [Op.or]: [{ number: like }, { '$PurchaseOrder.vendor$': like }, { status: like }] } : {}
  const { rows, count } = await GRN.findAndCountAll({
    where,
    include: [
      { model: PurchaseOrder, include: [{ model: PurchaseOrderItem, as:'items' }] },
      { model: GRNItem, as:'items' },
    ],
    distinct:true, subQuery:false, limit, offset, order:[['id','DESC']]
  })
  res.json({ data: rows, total: count })
}


export const create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { PurchaseOrderId, receivedDate, notes, items = [] } = req.body || {};
    if (!PurchaseOrderId) throw new Error('PurchaseOrderId required');
    if (!Array.isArray(items) || items.length === 0) throw new Error('No lines to receive');

    // load PO with items for validations
    const po = await PurchaseOrder.findByPk(PurchaseOrderId, {
      include: [{ model: PurchaseOrderItem, as: 'items' }],
      transaction: t,
      lock: t.LOCK.UPDATE
    });
    if (!po) throw new Error('Purchase Order not found');

    const poItemsById = new Map(po.items.map(i => [i.id, i]));

    // Build rows with validation
    const rows = items.map((line, idx) => {
      const poi = poItemsById.get(Number(line.PurchaseOrderItemId));
      if (!poi) throw new Error(`Line ${idx + 1}: PO item not found`);

      const ordered = Number(poi.qtyOrdered ?? poi.qty ?? 0);
      const alreadyReceived = Number(poi.qtyReceived ?? 0);
      const remaining = Math.max(0, ordered - alreadyReceived);

      // incoming quantities
      const receiveQty = Number(line.receiveQty ?? remaining);     // If not provided, assume remaining
      let acceptedQty = line.acceptedQty != null ? Number(line.acceptedQty) : Math.min(receiveQty, remaining);
      let rejectedQty = Number(line.rejectedQty ?? (receiveQty - acceptedQty));

      // sanitize
      if (receiveQty < 0) throw new Error(`Line ${idx + 1}: receiveQty < 0`);
      if (acceptedQty < 0) throw new Error(`Line ${idx + 1}: acceptedQty < 0`);
      if (rejectedQty < 0) throw new Error(`Line ${idx + 1}: rejectedQty < 0`);
      if (acceptedQty + rejectedQty !== receiveQty)
        throw new Error(`Line ${idx + 1}: accepted + rejected must equal receiveQty`);
      if (acceptedQty > remaining)
        throw new Error(`Line ${idx + 1}: acceptedQty exceeds remaining (${remaining})`);

      return {
        poi,
        ordered,
        alreadyReceived,
        remaining,
        receiveQty,
        acceptedQty,
        rejectedQty,
      };
    });

    // create header
    const number = await nextGRNNumber(t);
    const grn = await GRN.create({
      number,
      PurchaseOrderId,
      receivedDate: receivedDate || new Date().toISOString().slice(0,10),
      status: 'approved', // or 'draft' if you prefer
      notes: notes || null,
    }, { transaction: t });

    // create items + update PO items
    for (const r of rows) {
      await GRNItem.create({
        GRNId: grn.id,
        PurchaseOrderItemId: r.poi.id,

        product: r.poi.product || r.poi.description || r.poi.materialCode || null,
        qtyOrdered: r.ordered,
        qtyReceived: r.receiveQty,
        acceptedQty: r.acceptedQty,
        rejectedQty: r.rejectedQty,

        uom: r.poi.uom,
        materialCode: r.poi.materialCode,
        description: r.poi.description,
        storageLocation: r.poi.storageLocation,
      }, { transaction: t });

      // bump accepted into PO's received
      await r.poi.update(
        { qtyReceived: Number(r.poi.qtyReceived ?? 0) + r.acceptedQty },
        { transaction: t }
      );
    }

    // if everything fully received => mark PO as 'received'
    const freshItems = await PurchaseOrderItem.findAll({ where: { PurchaseOrderId }, transaction: t });
    const allComplete = freshItems.every(it =>
      Number(it.qtyReceived ?? 0) >= Number(it.qtyOrdered ?? it.qty ?? 0)
    );
    if (allComplete && po.status !== 'received') {
      await po.update({ status: 'received' }, { transaction: t });
    }

    await t.commit();

    const out = await GRN.findByPk(grn.id, {
      include: [{ model: GRNItem, as: 'items' }, { model: PurchaseOrder }],
    });
    res.json(out);
  } catch (err) {
    await t.rollback();
    console.error('GRN create error:', err);
    res.status(400).json({ error: String(err.message || err) });
  }
};


// Generate GRN-YYYY-00001 style numbers safely
async function nextGRNNumber(t) {
  const last = await GRN.findOne({
    attributes: ['id'],
    order: [['id', 'DESC']],
    transaction: t,
    lock: t?.LOCK?.UPDATE
  });
  const year = new Date().getFullYear();
  const seq = (last?.id ?? 0) + 1;
  return `GRN-${year}-${String(seq).padStart(5, '0')}`;
}

export const createGRN = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { PurchaseOrderId, items, receivedDate } = req.body

    // 1) Find last GRN number
    const last = await GRN.findOne({
      order: [['createdAt', 'DESC']],
      transaction: t,
    })

    let seq = 1
    if (last && last.number) {
      const m = last.number.match(/GRN-(\d{4})-(\d+)/)
      if (m) {
        seq = parseInt(m[2], 10) + 1
      }
    }
    const year = new Date().getFullYear()
    const grnNumber = `GRN-${year}-${String(seq).padStart(5, '0')}`

    // 2) Create GRN header
    const grn = await GRN.create(
      {
        number: grnNumber,
        PurchaseOrderId,
        receivedDate: receivedDate || new Date(),
        status: 'received',
      },
      { transaction: t }
    )

    // 3) Loop items and update received qty
    for (const it of items) {
      const poi = await PurchaseOrderItem.findByPk(it.PurchaseOrderItemId, { transaction: t })
      if (!poi) throw new Error(`Item ${it.PurchaseOrderItemId} not found`)
      if (it.qtyReceived > poi.qty - (poi.received || 0)) {
        throw new Error(`Over-receipt on item ${poi.product}`)
      }
      poi.received = (poi.received || 0) + it.qtyReceived
      await poi.save({ transaction: t })
    }

    // Optionally update PO status
    const po = await PurchaseOrder.findByPk(PurchaseOrderId, { include: [PurchaseOrderItem], transaction: t })
    const allReceived = po.items.every(i => (i.received || 0) >= i.qty)
    if (allReceived) {
      po.status = 'received'
      await po.save({ transaction: t })
    }

    await t.commit()
    res.json(grn)
  } catch (err) {
    await t.rollback()
    console.error('GRN create error', err)
    res.status(400).json({ error: err.message })
  }
}

export async function remove(req,res){
  const grn = await GRN.findByPk(req.params.id, { include:['items'] })
  if(!grn) return res.status(404).json({ error:'Not found' })
  if (grn.status === 'approved') return res.status(400).json({ error:'Cannot delete approved GRN (void instead)' })
  await grn.destroy()
  res.json({ ok:true })
}

export async function transition(req,res){
  const { id } = req.params
  const { action } = req.body // 'cancel' (void) only in this simple flow
  const grn = await GRN.findByPk(id)
  if(!grn) return res.status(404).json({ error:'Not found' })
  if(action === 'cancel') {
    await grn.update({ status:'cancelled' })
  }
  res.json(grn)
}
