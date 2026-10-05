import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

import {
  getDocumentosByAvance,
  uploadDocumento,
  downloadDocumento,
} from '../controllers/documentoController'

const router = Router()

const uploadDir = path.join(
  process.cwd(),
  'uploads',
  'avances'
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
    if (
      file.mimetype ===
      'application/pdf'
    ) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Solo se permiten archivos PDF'
        )
      )
    }
  }

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:
      10 * 1024 * 1024,
  },
})

router.get(
  '/avance/:id_avance',
  getDocumentosByAvance
)

router.get(
  '/download/:id_documento',
  downloadDocumento
)

router.post(
  '/upload',
  upload.single('archivo'),
  uploadDocumento
)

export default router