import { Router } from 'express'
import {
  getRegistrationCareers,
  getCurrentSession,
  login,
  register,
} from '../controllers/authController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.post('/login', login)
router.get('/carreras', getRegistrationCareers)
router.post('/register', register)
router.get('/session', authMiddleware, getCurrentSession)

export default router
