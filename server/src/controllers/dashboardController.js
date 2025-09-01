
import { Company, PurchaseOrder, Invoice, GRN } from '../models/index.js'
import { Sequelize } from 'sequelize'

export async function summary(req,res){
  const [companies, purchaseOrder, invoice, grn] = await Promise.all([
    Company.count(), PurchaseOrder.count(), Invoice.count(), GRN.count()
  ])
 // const won = await Deal.sum('amount', { where:{ stage:'won' } }) || 0
  res.json({ counts:{ companies, purchaseOrder, invoice, grn }, revenueWon: "100" })
}
