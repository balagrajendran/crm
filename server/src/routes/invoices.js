import { Router } from 'express'
import { list, create, update, remove, transition } from '../controllers/invoicesController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('invoices','read'), list)
r.post('/', authorize('invoices','create'), create)
r.put('/:id', authorize('invoices','update'), update)
r.delete('/:id', authorize('invoices','delete'), remove)
r.post('/:id/transition', authorize('invoices','update'), transition)
export default r
