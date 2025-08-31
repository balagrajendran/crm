
import { Router } from 'express'
import { login, register, me } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
const r = Router()
r.post('/login', login)
r.post('/register', register)
r.get('/me', requireAuth, me)
export default r
