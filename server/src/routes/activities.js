
import { Router } from 'express'
import { list, create, update, remove } from '../controllers/activitiesController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('activities','read'), list)
r.post('/', authorize('activities','create'), create)
r.put('/:id', authorize('activities','update'), update)
r.delete('/:id', authorize('activities','delete'), remove)
export default r
