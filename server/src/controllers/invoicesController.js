import { Invoice, InvoiceItem } from '../models/index.js'
import { paginator, toDateOnly } from './util.js'
import { Op } from 'sequelize'

export async function list(req,res){
  const { page, limit, offset } = paginator(req.query)
  const q = (req.query.search||'').trim()
  const like = { [Op.like]: `%${q}%` }
  const isNum = !Number.isNaN(Number(q))

  const where = q ? {
    [Op.or]: [
      isNum ? { id:Number(q) } : null,
      { number: like }, { customer: like }, { status: like },
      { '$items.description$': like }
    ].filter(Boolean)
  } : {}

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    include:[{ model: InvoiceItem, as:'items', required:false }],
    distinct:true, subQuery:false,
    limit, offset, order:[['id','DESC']]
  })
  res.json({ data: rows, total: count })
}

export async function create(req,res){
  const { items=[], ...data } = req.body
  data.invoiceDate = toDateOnly(data.invoiceDate)
  data.dueDate     = toDateOnly(data.dueDate)
  // two-step create is robust
  const inv = await Invoice.create(data)
  if(items.length){
    await InvoiceItem.bulkCreate(items.map(i=>({ ...i, InvoiceId: inv.id })))
  }
  const out = await Invoice.findByPk(inv.id, { include:[{ model: InvoiceItem, as:'items' }] })
  res.json(out)
}

export async function update(req,res){
  const { items=[], ...data } = req.body
  data.invoiceDate = toDateOnly(data.invoiceDate)
  data.dueDate     = toDateOnly(data.dueDate)
  const inv = await Invoice.findByPk(req.params.id, { include:['items'] })
  if(!inv) return res.status(404).json({error:'Not found'})
  await inv.update(data)
  await InvoiceItem.destroy({ where:{ InvoiceId: inv.id } })
  if(items.length) await InvoiceItem.bulkCreate(items.map(i=>({ ...i, InvoiceId: inv.id })))
  const refreshed = await Invoice.findByPk(inv.id, { include:['items'] })
  res.json(refreshed)
}

export async function remove(req,res){
  await Invoice.destroy({ where:{ id:req.params.id } })
  res.json({ ok:true })
}

export async function transition(req,res){
  const { id } = req.params
  const { action } = req.body // 'send'|'pay'|'void'
  const inv = await Invoice.findByPk(id)
  if(!inv) return res.status(404).json({error:'Not found'})
  if(action==='send') inv.status='sent'
  else if(action==='pay') inv.status='paid'
  else if(action==='void') inv.status='void'
  await inv.save()
  res.json(inv)
}
