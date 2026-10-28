import fs from 'fs'
import path from 'path'
import multer, { MulterError } from 'multer'
import { RequestHandler } from 'express'

const uploadDirectory = path.join(process.cwd(), 'uploads', 'avances')
fs.mkdirSync(uploadDirectory, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, _file, callback) => {
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`)
  },
})

const uploadSinglePdf = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    // Browsers may send an empty or generic MIME type for a legitimate PDF.
    // The controller validates the actual PDF signature after upload.
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      const error = Object.assign(new Error('Invalid PDF'), { status: 400 })
      callback(error)
      return
    }
    callback(null, true)
  },
}).single('archivo')

export const uploadAvancePdf: RequestHandler = (req, res, next) => {
  uploadSinglePdf(req, res, (error?: unknown) => {
    if (!error) {
      next()
      return
    }

    const uploadError = error as { status?: number; code?: string }
    const status = error instanceof MulterError
      ? uploadError.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      : uploadError.status === 400 ? 400 : 500

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(status).json({
      success: false,
      message: status === 413
        ? 'El archivo PDF no puede superar los 10 MB.'
        : status === 400
          ? 'Debes adjuntar un único archivo PDF válido.'
          : 'No se pudo procesar el archivo PDF.',
    })
  })
}
