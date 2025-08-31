
import { Router } from 'express'
import { list, create, update, remove } from '../controllers/dealsController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('deals','read'), list)
r.post('/', authorize('deals','create'), create)
r.put('/:id', authorize('deals','update'), update)
r.delete('/:id', authorize('deals','delete'), remove)
export default r
