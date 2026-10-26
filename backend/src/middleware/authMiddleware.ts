
import { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import pool from '../config/database'
import { getJwtSecret } from '../config/jwtConfig'
import type { AuthenticatedUser, UserRole } from './authTypes'

export type { AuthenticatedUser, UserRole } from './authTypes'

export type AuthenticatedRequest = Request & {
  authUser?: AuthenticatedUser
  /** Compatibilidad para consumidores antiguos; el código actual usa authUser. */
  usuario?: AuthenticatedUser
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser
      usuario?: AuthenticatedUser
    }
  }
}

const validRoles: UserRole[] = ['ESTUDIANTE', 'TUTOR', 'COORDINADOR']

export const authMiddleware: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const match = req.header('Authorization')?.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    res.status(401).json({ success: false, message: 'Autenticación requerida.' })
    return
  }

  let payload: JwtPayload
  try {
    const decoded = jwt.verify(match[1], getJwtSecret(), { algorithms: ['HS256'] })
    if (typeof decoded === 'string') throw new Error('Invalid JWT payload')
    payload = decoded
  } catch {
    res.status(401).json({ success: false, message: 'La sesión no es válida o expiró.' })
    return
  }

  const idUsuario = payload.id_usuario
  if (typeof idUsuario !== 'number' || !Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    res.status(401).json({ success: false, message: 'La sesión no es válida.' })
    return
  }

  try {
    const result = await pool.query(
      'SELECT rol, activo FROM usuarios WHERE id_usuario = $1',
      [idUsuario]
    )
    const currentUser = result.rows[0]

    if (!currentUser?.activo || !validRoles.includes(currentUser.rol)) {
      res.status(401).json({ success: false, message: 'La cuenta no está activa.' })
      return
    }

    // Los roles vigentes se leen de PostgreSQL; no se confía en el rol del JWT.
    const authenticatedUser: AuthenticatedUser = {
      id_usuario: idUsuario,
      rol: currentUser.rol,
    }
    req.authUser = authenticatedUser
    req.usuario = authenticatedUser
    next()
  } catch (error) {
    next(error)
  }
}

export function requireRoles(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.authUser) {
      res.status(401).json({ success: false, message: 'Autenticación requerida.' })
      return
    }
    if (!roles.includes(req.authUser.rol)) {
      res.status(403).json({ success: false, message: 'No tienes permiso para esta operación.' })
      return
    }
    next()
  }
}

/** Alias para mantener compatible el nombre anterior del middleware. */
export const verificarToken = authMiddleware
