import { Router } from 'express'
import { requireRoles } from '../middleware/authMiddleware'
import {
  cancelarDefensa,
  confirmarListaDefensa,
  crearDefensa,
  listarDefensasCoordinador,
  modificarDefensa,
  obtenerDefensaMonografia,
} from '../controllers/defensaController'

const router = Router()

router.get('/gestion', requireRoles('COORDINADOR'), listarDefensasCoordinador)
router.get('/monografia/:id_monografia', obtenerDefensaMonografia)
router.put('/monografia/:id_monografia/confirmacion', requireRoles('TUTOR'), confirmarListaDefensa)
router.post('/', requireRoles('COORDINADOR'), crearDefensa)
router.put('/:id_defensa', requireRoles('COORDINADOR'), modificarDefensa)
router.patch('/:id_defensa/cancelar', requireRoles('COORDINADOR'), cancelarDefensa)

export default router
