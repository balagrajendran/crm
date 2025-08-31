// src/routes/grns.js
import { Router } from 'express'
import { list, create, remove, transition } from '../controllers/grnsController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('grns','read'), list)
r.post('/', authorize('grns','create'), create)
r.delete('/:id', authorize('grns','delete'), remove)
r.post('/:id/transition', authorize('grns','update'), transition)
export default r
