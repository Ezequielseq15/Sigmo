import { Router } from 'express'

import {
  getMonografias,
  getTutores,
  asignarTutor,
} from '../controllers/monografiaController'

const router = Router()

// Obtener todas las monografías
router.get('/', getMonografias)

// Obtener tutores disponibles
router.get('/tutores', getTutores)

// Asignar tutor a una monografía
router.put('/:id_monografia/tutor', asignarTutor)

export default router