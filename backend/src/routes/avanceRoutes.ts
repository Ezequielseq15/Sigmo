import { Router } from 'express'
import {
  getAvancesByMonografia,
  getEtapasAvance,
  createAvanceWithDocument,
  revisarAvance,
} from '../controllers/avanceController'
import { requireRoles } from '../middleware/authMiddleware'
import { requireResourceAccess } from '../middleware/resourceAuthorization'
import { uploadAvancePdf } from '../middleware/avancePdfUpload'

const router = Router()

router.get('/etapas', getEtapasAvance)

router.get(
  '/monografia/:id_monografia',
  requireResourceAccess('monografia', 'id_monografia'),
  getAvancesByMonografia
)

router.post(
  '/',
  requireRoles('ESTUDIANTE'),
  uploadAvancePdf,
  requireResourceAccess('monografia', 'body:id_monografia'),
  createAvanceWithDocument
)

router.put(
  '/:id_avance/revisar',
  requireRoles('TUTOR'),
  requireResourceAccess('avance', 'id_avance'),
  revisarAvance
)

export default router
