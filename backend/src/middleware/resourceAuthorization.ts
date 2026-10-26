import fs from 'fs'
import { RequestHandler } from 'express'
import pool from '../config/database'
import type { AuthenticatedUser } from './authTypes'

export async function canAccessMonografia(
  idMonografia: number,
  user: AuthenticatedUser
): Promise<boolean> {
  if (!Number.isSafeInteger(idMonografia) || idMonografia <= 0) return false
  if (user.rol === 'COORDINADOR') return true

  const result = user.rol === 'ESTUDIANTE'
    ? await pool.query(
        `SELECT EXISTS (
           SELECT 1
           FROM monografias m
           WHERE m.id_monografia = $1
             AND (
               m.id_estudiante IN (
                 SELECT e.id_estudiante FROM estudiantes e WHERE e.id_usuario = $2
               )
               OR EXISTS (
                 SELECT 1
                 FROM monografia_estudiantes me
                 JOIN estudiantes e ON e.id_estudiante = me.id_estudiante
                 WHERE me.id_monografia = m.id_monografia AND e.id_usuario = $2
               )
             )
         ) AS allowed`,
        [idMonografia, user.id_usuario]
      )
    : await pool.query(
        `SELECT EXISTS (
           SELECT 1
           FROM monografias m
           JOIN tutores t ON t.id_tutor = m.id_tutor
           WHERE m.id_monografia = $1 AND t.id_usuario = $2
         ) AS allowed`,
        [idMonografia, user.id_usuario]
      )

  return result.rows[0]?.allowed === true
}

type ResourceType = 'monografia' | 'avance' | 'documento' | 'protocolo'

async function removeUploadedFile(filePath?: string): Promise<void> {
  if (!filePath) return
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('No se pudo limpiar un archivo rechazado por autorización.')
    }
  }
}

export function requireResourceAccess(
  resource: ResourceType,
  parameter: string
): RequestHandler {
  return async (req, res, next) => {
    const user = req.authUser
    if (!user) {
      res.status(401).json({ success: false, message: 'Autenticación requerida.' })
      return
    }

    const rawId = parameter.startsWith('body:')
      ? req.body?.[parameter.slice(5)]
      : req.params[parameter]
    const id = typeof rawId === 'number'
      ? rawId
      : typeof rawId === 'string' && /^\d+$/.test(rawId)
        ? Number(rawId)
        : Number.NaN
    if (!Number.isSafeInteger(id) || id <= 0) {
      await removeUploadedFile(req.file?.path)
      res.status(400).json({ success: false, message: 'El identificador no es válido.' })
      return
    }

    try {
      let idMonografia: number | undefined
      if (resource === 'monografia') {
        const result = await pool.query(
          'SELECT id_monografia FROM monografias WHERE id_monografia = $1',
          [id]
        )
        idMonografia = result.rows[0]?.id_monografia
      } else {
        const tableAndJoin = {
          avance: 'SELECT id_monografia FROM avances WHERE id_avance = $1',
          documento: `SELECT a.id_monografia
                      FROM documentos d JOIN avances a ON a.id_avance = d.id_avance
                      WHERE d.id_documento = $1`,
          protocolo: 'SELECT id_monografia FROM protocolos_monografia WHERE id_protocolo = $1',
        } as const
        const result = await pool.query(tableAndJoin[resource], [id])
        idMonografia = result.rows[0]?.id_monografia
      }

      if (!idMonografia) {
        await removeUploadedFile(req.file?.path)
        res.status(404).json({ success: false, message: 'El recurso solicitado no existe.' })
        return
      }

      if (!(await canAccessMonografia(Number(idMonografia), user))) {
        await removeUploadedFile(req.file?.path)
        res.status(404).json({ success: false, message: 'El recurso solicitado no existe.' })
        return
      }

      next()
    } catch (error) {
      await removeUploadedFile(req.file?.path)
      next(error)
    }
  }
}
