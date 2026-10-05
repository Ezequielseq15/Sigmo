import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

import {
  getPerfil,
  uploadFotoPerfil,
} from '../controllers/usuarioController'

const router = Router()

const uploadDir = path.join(
  process.cwd(),
  'uploads',
  'perfiles'
)

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  })
}

const storage = multer.diskStorage({
  destination: (
    _req,
    _file,
    cb
  ) => {
    cb(null, uploadDir)
  },

  filename: (
    _req,
    file,
    cb
  ) => {
    const extension =
      path.extname(file.originalname)

    const nombreUnico =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`

    cb(null, nombreUnico)
  },
})

const fileFilter: multer.Options['fileFilter'] =
  (
    _req,
    file,
    cb
  ) => {
    const tiposPermitidos = [
      'image/jpeg',
      'image/jpg',
      'image/png',
    ]

    if (
      tiposPermitidos.includes(
        file.mimetype
      )
    ) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Solo se permiten imágenes JPG, JPEG o PNG'
        )
      )
    }
  }

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
})

router.get(
  '/:id_usuario',
  getPerfil
)

router.put(
  '/:id_usuario/foto',
  upload.single('foto'),
  uploadFotoPerfil
)

export default router