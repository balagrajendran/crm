
import { Company, Contact, Deal } from '../models/index.js'
import { Sequelize } from 'sequelize'

export async function summary(req,res){
  const [companies, contacts, deals] = await Promise.all([
    Company.count(), Contact.count(), Deal.count()
  ])
  const won = await Deal.sum('amount', { where:{ stage:'won' } }) || 0
  res.json({ counts:{ companies, contacts, deals }, revenueWon: won })
}
