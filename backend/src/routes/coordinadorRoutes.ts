import { Router } from 'express'

import {
  getMonografias,
  getTutores,
  asignarTutor,
} from '../controllers/monografiaController'
import { requireRoles } from '../middleware/authMiddleware'

const router = Router()

// =========================================================
// MONOGRAFÍAS
// =========================================================

router.get(
  '/monografias',
  requireRoles('COORDINADOR'),
  getMonografias
)

// =========================================================
// TUTORES
// =========================================================

router.get(
  '/tutores',
  requireRoles('COORDINADOR'),
  getTutores
)

// =========================================================
// ASIGNAR TUTOR
// =========================================================

router.put(
  '/monografias/:id_monografia/tutor',
  requireRoles('COORDINADOR'),
  asignarTutor
)

export default router
