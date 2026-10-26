import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import pool from '../config/database'

function eliminarArchivoSubido(ruta?: string) {
  if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta)
}

function obtenerRutaSegura(rutaRegistrada: string): string | null {
  const raizUploads = path.resolve(process.cwd(), 'uploads')
  const relativa = rutaRegistrada.replace(/^[/\\]?uploads[/\\]/i, '')
  const absoluta = path.resolve(raizUploads, relativa)
  const dentroDeUploads = path.relative(raizUploads, absoluta)
  if (!dentroDeUploads || dentroDeUploads.startsWith('..') || path.isAbsolute(dentroDeUploads)) {
    return null
  }
  return absoluta
}

export const getDocumentosByAvance = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_avance } = req.params

    const result = await pool.query(
      `
      SELECT
        id_documento,
        id_avance,
        nombre_archivo,
        nombre_original,
        ruta_archivo,
        tipo_archivo,
        tamano_bytes,
        fecha_subida
      FROM documentos
      WHERE id_avance = $1
      ORDER BY fecha_subida DESC
      `,
      [id_avance]
    )

    return res.json({
      success: true,
      total: result.rows.length,
      documentos: result.rows,
    })
  } catch (error) {
    console.error('Error al obtener documentos:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron obtener los documentos',
    })
  }
}

export const uploadDocumento = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_avance } = req.body
    const idAvance = Number(id_avance)

    if (!Number.isInteger(idAvance) || idAvance <= 0) {
      eliminarArchivoSubido(req.file?.path)
      return res.status(400).json({
        success: false,
        message:
          'El id_avance es obligatorio',
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          'Debes seleccionar un archivo PDF',
      })
    }

    const archivo = req.file

    const rutaArchivo =
      `/uploads/avances/${archivo.filename}`

    const result = await pool.query(
      `
      INSERT INTO documentos (
        id_avance,
        nombre_archivo,
        nombre_original,
        ruta_archivo,
        tipo_archivo,
        tamano_bytes,
        fecha_subida
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        CURRENT_TIMESTAMP
      )
      RETURNING *
      `,
      [
        idAvance,
        archivo.filename,
        archivo.originalname,
        rutaArchivo,
        archivo.mimetype,
        archivo.size,
      ]
    )

    return res.status(201).json({
      success: true,
      message:
        'Documento subido correctamente',
      documento: result.rows[0],
    })
  } catch (error) {
    eliminarArchivoSubido(req.file?.path)
    console.error('Error al subir documento:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message:
        'No se pudo subir el documento',
    })
  }
}

export const downloadDocumento = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_documento } = req.params

    const result = await pool.query(
      `
      SELECT
        nombre_original,
        ruta_archivo
      FROM documentos
      WHERE id_documento = $1
      `,
      [id_documento]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Documento no encontrado',
      })
    }

    const documento = result.rows[0]

    if (!documento.ruta_archivo) {
      return res.status(404).json({
        success: false,
        message:
          'El documento no tiene una ruta registrada',
      })
    }

    const rutaCompleta = obtenerRutaSegura(documento.ruta_archivo)
    if (!rutaCompleta || !fs.existsSync(rutaCompleta)) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado.' })
    }

    res.setHeader('Cache-Control', 'private, no-store')
    return res.download(
      rutaCompleta,
      documento.nombre_original
    )
  } catch (error) {
    console.error('Error al descargar documento:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message:
        'No se pudo descargar el documento',
    })
  }
}
