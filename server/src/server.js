
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { syncDb, User } from './models/index.js'
import authRoutes from './routes/auth.js'
import { requireAuth } from './middleware/auth.js'
import companies from './routes/companies.js'
import contacts from './routes/contacts.js'
import deals from './routes/deals.js'
import activities from './routes/activities.js'
import dashboard from './routes/dashboard.js'
import bcrypt from 'bcryptjs'
import purchaseOrders from './routes/purchaseOrders.js'
import invoices from './routes/invoices.js'
import grns from './routes/grns.js'
import sapRoutes from './routes/sap.js';

const app = express()
app.use(cors({ origin:true, credentials:true }))
app.use(express.json())
app.use(express.static(new URL('../public', import.meta.url).pathname))

app.get('/healthz', (req,res)=>res.json({ok:true}))
// open auth routes
app.use('/api/auth', authRoutes)

// protected routes
app.use('/api', requireAuth)
app.use('/api/dashboard', dashboard)
app.use('/api/companies', companies)
app.use('/api/contacts', contacts)
app.use('/api/deals', deals)
app.use('/api/activities', activities)
app.use('/api/purchase-orders', purchaseOrders)
app.use('/api/invoices', invoices)
app.use('/api/grns', grns)
app.use('/api/sap', sapRoutes);


const PORT = process.env.PORT || 4000

async function ensureAdmin(){
  const count = await User.count()
  if(count === 0){
    const passwordHash = await bcrypt.hash('admin123', 10)
    await User.create({ name:'Admin', email:'admin@example.com', passwordHash, role:'admin' })
    console.log('Seeded default admin: admin@example.com / admin123')
  }
}

syncDb().then(ensureAdmin).then(() => {
  app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`))
}).catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
