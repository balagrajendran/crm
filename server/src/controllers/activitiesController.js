
import { Activity } from '../models/index.js'
import { paginator, likeFilter } from './util.js'

export async function list(req,res){
  const { page, limit, offset } = paginator(req.query)
  const where = likeFilter(['type','subject','status'], req.query.search)
  const { rows, count } = await Activity.findAndCountAll({ where, limit, offset, order:[['id','DESC']] })
  res.json({ data: rows, total: count })
}
export async function create(req,res){ const c = await Activity.create(req.body); res.json(c) }
export async function update(req,res){ const c = await Activity.findByPk(req.params.id); if(!c) return res.status(404).json({error:'Not found'}); await c.update(req.body); res.json(c) }
export async function remove(req,res){ const n = await Activity.destroy({ where:{ id:req.params.id } }); res.json({ ok: n>0 }) }
