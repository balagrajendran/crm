// server/src/routes/purchaseOrders.js
import express from 'express';
import * as po from '../controllers/purchaseOrdersController.js';
import { authorize } from '../middleware/rbac.js'; // if you use RBAC

const r = express.Router();

r.get('/', authorize('purchaseOrders','read'), po.list);
r.get('/:id', authorize('purchaseOrders','read'), po.getOne);
r.post('/', authorize('purchaseOrders','create'), po.create);
r.put('/:id', authorize('purchaseOrders','update'), po.update);
r.delete('/:id', authorize('purchaseOrders','delete'), po.destroy);
r.post('/:id/transition', authorize('purchaseOrders','update'), po.transition);

export default r;
