
import { Router } from 'express'
import { summary } from '../controllers/dashboardController.js'
import { authorize } from '../middleware/rbac.js'
const r = Router()
r.get('/', authorize('dashboard','read'), summary)
export default r
