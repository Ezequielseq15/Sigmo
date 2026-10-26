import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'

import {
  crearPropuesta,
  obtenerProtocolosPendientes,
  obtenerProtocolosPorMonografia,
  descargarProtocolo,
  revisarProtocolo,
  representarProtocolo,
} from '../controllers/protocoloController'
import { requireRoles } from '../middleware/authMiddleware'
import { requireResourceAccess } from '../middleware/resourceAuthorization'
import { validateUploadedContent } from '../middleware/validateUploadedContent'

const router = Router()

const directorioProtocolos = path.join(
  process.cwd(),
  'uploads',
  'protocolos'
)

fs.mkdirSync(directorioProtocolos, { recursive: true })

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, directorioProtocolos)
  },
  filename: (_req, file, callback) => {
    const nombre = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`
    callback(null, nombre)
  },
})

const upload = multer({
  storage: almacenamiento,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
  if (file.mimetype !== 'application/pdf' || path.extname(file.originalname).toLowerCase() !== '.pdf') {
      callback(Object.assign(new Error('Solo se permiten archivos PDF.'), { status: 400 }))
      return
    }

    callback(null, true)
  },
})

// Registrar propuesta y protocolo inicial
router.post('/', requireRoles('ESTUDIANTE'), upload.single('archivo'), validateUploadedContent('pdf'), crearPropuesta)

// Consultar protocolos pendientes de revisión
router.get('/pendientes', requireRoles('COORDINADOR'), obtenerProtocolosPendientes)

// Consultar versiones de una monografía
router.get(
  '/monografia/:id_monografia',
  requireResourceAccess('monografia', 'id_monografia'),
  obtenerProtocolosPorMonografia
)

// Descargar un protocolo
router.get('/:id_protocolo/descargar', requireResourceAccess('protocolo', 'id_protocolo'), descargarProtocolo)

// Aprobar o rechazar una versión
router.put('/:id_protocolo/revisar', requireRoles('COORDINADOR'), revisarProtocolo)

// Volver a presentar el protocolo después de un rechazo
router.post(
  '/monografia/:id_monografia/representar',
  requireRoles('ESTUDIANTE'),
  upload.single('archivo'),
  validateUploadedContent('pdf'),
  requireResourceAccess('monografia', 'id_monografia'),
  representarProtocolo
)

export default router
