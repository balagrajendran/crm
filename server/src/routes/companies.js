
import { Router } from 'express'
import { list, create, update, remove } from '../controllers/companiesController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('companies','read'), list)
r.post('/', authorize('companies','create'), create)
r.put('/:id', authorize('companies','update'), update)
r.delete('/:id', authorize('companies','delete'), remove)
export default r
