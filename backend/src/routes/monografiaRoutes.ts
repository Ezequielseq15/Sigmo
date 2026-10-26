import { Router } from 'express'

import {
  getMonografias,
  getTutores,
  asignarTutor,
} from '../controllers/monografiaController'
import { requireRoles } from '../middleware/authMiddleware'

const router = Router()

// Obtener todas las monografías
router.get('/', getMonografias)

// Obtener tutores disponibles
router.get('/tutores', requireRoles('COORDINADOR'), getTutores)

// Asignar tutor a una monografía
router.put('/:id_monografia/tutor', requireRoles('COORDINADOR'), asignarTutor)

export default router
