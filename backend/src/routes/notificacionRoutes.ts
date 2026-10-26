import { Router } from 'express'

import {
  getNotificacionesByUsuario,
  getNotificacionesNoLeidas,
  crearNotificacion,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '../controllers/notificacionController'
import { requireRoles } from '../middleware/authMiddleware'

const router = Router()

router.get(
  '/usuario/:id_usuario',
  getNotificacionesByUsuario
)

router.get(
  '/usuario/:id_usuario/no-leidas',
  getNotificacionesNoLeidas
)

router.post(
  '/',
  requireRoles('COORDINADOR'),
  crearNotificacion
)

router.put(
  '/:id_notificacion/leida',
  marcarNotificacionLeida
)

router.put(
  '/usuario/:id_usuario/marcar-todas-leidas',
  marcarTodasLeidas
)

export default router
