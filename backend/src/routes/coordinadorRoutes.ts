import { Router } from 'express'

import {
  getMonografias,
  getTutores,
  asignarTutor,
} from '../controllers/monografiaController'

const router = Router()

// =========================================================
// MONOGRAFÍAS
// =========================================================

router.get(
  '/monografias',
  getMonografias
)

// =========================================================
// TUTORES
// =========================================================

router.get(
  '/tutores',
  getTutores
)

// =========================================================
// ASIGNAR TUTOR
// =========================================================

router.put(
  '/monografias/:id_monografia/tutor',
  asignarTutor
)

export default router