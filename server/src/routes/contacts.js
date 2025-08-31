
import { Router } from 'express'
import { list, create, update, remove } from '../controllers/contactsController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('contacts','read'), list)
r.post('/', authorize('contacts','create'), create)
r.put('/:id', authorize('contacts','update'), update)
r.delete('/:id', authorize('contacts','delete'), remove)
export default r
