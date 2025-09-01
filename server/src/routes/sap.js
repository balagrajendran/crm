import { Router } from 'express';
import { suppliers } from '../controllers/sapController.js';
import { authorize } from '../middleware/rbac.js';

const r = Router();
r.get('/suppliers', authorize('purchaseOrders','read'), suppliers);
export default r;
