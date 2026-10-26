import { Router } from 'express'
import {
  obtenerCatalogosPropuesta,
} from '../controllers/propuestaCatalogoController'
import { requireRoles } from '../middleware/authMiddleware'

const router = Router()

router.get('/propuesta', requireRoles('ESTUDIANTE'), obtenerCatalogosPropuesta)

export default router
