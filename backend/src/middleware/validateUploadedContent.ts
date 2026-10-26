import fs from 'fs'
import path from 'path'
import { RequestHandler } from 'express'

type AllowedContent = 'pdf' | 'profile-image'

function deleteUpload(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    console.error('No se pudo limpiar una carga que no superó la validación.')
  }
}

function hasValidSignature(filePath: string, mimeType: string, kind: AllowedContent): boolean {
  const fd = fs.openSync(filePath, 'r')
  try {
    const buffer = Buffer.alloc(1024)
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0)
    const prefix = buffer.subarray(0, bytesRead)

    if (kind === 'pdf') {
      return mimeType === 'application/pdf' &&
        path.extname(filePath).toLowerCase() === '.pdf' &&
        prefix.includes(Buffer.from('%PDF-', 'ascii'))
    }

    if (mimeType === 'image/png') {
      return path.extname(filePath).toLowerCase() === '.png' &&
        prefix.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    }

    return (mimeType === 'image/jpeg' || mimeType === 'image/jpg') &&
      ['.jpg', '.jpeg'].includes(path.extname(filePath).toLowerCase()) &&
      prefix[0] === 0xff && prefix[1] === 0xd8 && prefix[2] === 0xff
  } finally {
    fs.closeSync(fd)
  }
}

export function validateUploadedContent(kind: AllowedContent): RequestHandler {
  return (req, res, next) => {
    if (!req.file) {
      next()
      return
    }

    try {
      if (!hasValidSignature(req.file.path, req.file.mimetype, kind)) {
        deleteUpload(req.file.path)
        res.status(400).json({
          success: false,
          message: kind === 'pdf'
            ? 'El archivo no tiene una firma PDF válida.'
            : 'El archivo no tiene una firma JPEG o PNG válida.',
        })
        return
      }
      next()
    } catch {
      deleteUpload(req.file.path)
      res.status(400).json({ success: false, message: 'No se pudo validar el archivo cargado.' })
    }
  }
}
