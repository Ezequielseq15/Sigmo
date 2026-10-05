import { Router } from 'express'

import {
  getAvancesByMonografia,
  createAvance,
  revisarAvance,
} from '../controllers/avanceController'

const router = Router()

// Obtener avances de una monografía
router.get(
  '/monografia/:id_monografia',
  getAvancesByMonografia
)

// Crear avance
router.post(
  '/',
  createAvance
)

// Revisar avance como tutor
router.put(
  '/:id_avance/revisar',
  revisarAvance
)

export default router