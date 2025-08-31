import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import { sequelize } from './models/index.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import contactRoutes from './routes/contacts.js';
import dealRoutes from './routes/deals.js';
import activityRoutes from './routes/activities.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:5173';

app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: ALLOW_ORIGIN, credentials: true }));

app.get('/', (req, res) => res.json({ ok: true, service: 'CRM API' }));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Sync DB if needed (not force in prod)
async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.sync(); // { alter: true } for dev if needed
    app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
