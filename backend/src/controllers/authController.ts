import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { PoolClient } from 'pg'
import pool from '../config/database'
import { getJwtSecret } from '../config/jwtConfig'

type PublicUser = {
  id_usuario: number
  nombre: string
  apellido: string
  correo: string
  rol: 'ESTUDIANTE' | 'TUTOR' | 'COORDINADOR'
}

function createSession(user: PublicUser) {
  const token = jwt.sign(
    { id_usuario: user.id_usuario, rol: user.rol },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '8h' }
  )
  return {
    token,
    user: {
      id: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      rol: user.rol,
    },
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function duplicateMessage(error: unknown): string | null {
  const databaseError = error as { code?: string; constraint?: string }
  if (databaseError?.code !== '23505') return null
  const constraint = String(databaseError.constraint || '').toLowerCase()
  if (constraint.includes('correo')) return 'Ya existe una cuenta con ese correo.'
  if (constraint.includes('carnet')) return 'Ya existe un estudiante con ese carnet.'
  return 'El correo o carnet ya está registrado.'
}

export const login = async (req: Request, res: Response) => {
  try {
    const correo = text(req.body?.correo).toLowerCase()
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!correo || !password) {
      return res.status(400).json({ success: false, message: 'El correo y la contraseña son obligatorios.' })
    }

    const result = await pool.query(
      `SELECT id_usuario, nombre, apellido, correo, password_hash, rol, activo
         FROM usuarios WHERE LOWER(correo) = $1 LIMIT 1`,
      [correo]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' })
    }
    if (!user.activo) {
      return res.status(403).json({ success: false, message: 'El usuario está desactivado.' })
    }

    const passwordValida = await bcrypt.compare(password, user.password_hash)
    if (!passwordValida) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos.' })
    }

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      ...createSession(user),
    })
  } catch (error) {
    console.error('Error en login:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const getRegistrationCareers = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id_carrera, nombre FROM carreras
        WHERE activo = TRUE ORDER BY nombre ASC`
    )
    return res.json({ success: true, carreras: result.rows })
  } catch (error) {
    console.error('No se pudieron cargar las carreras:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudieron cargar las carreras.' })
  }
}

export const getCurrentSession = async (req: Request, res: Response) => {
  const idUsuario = req.authUser?.id_usuario
  if (!idUsuario) {
    return res.status(401).json({ success: false, message: 'Autenticación requerida.' })
  }

  try {
    const result = await pool.query<PublicUser>(
      `SELECT id_usuario, nombre, apellido, correo, rol
         FROM usuarios WHERE id_usuario = $1 AND activo = TRUE`,
      [idUsuario]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ success: false, message: 'La cuenta no está activa.' })
    }
    return res.json({
      success: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    })
  } catch (error) {
    console.error('No se pudo validar la sesión:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(503).json({ success: false, message: 'No se pudo validar la sesión.' })
  }
}

export const register = async (req: Request, res: Response) => {
  const nombre = text(req.body?.nombre)
  const apellido = text(req.body?.apellido)
  const correo = text(req.body?.correo).toLowerCase()
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const confirmPassword = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : ''
  const rol = req.body?.rol
  const carnet = text(req.body?.carnet)
  const idCarrera = Number(req.body?.id_carrera)
  const departamento = text(req.body?.departamento)
  const especialidad = text(req.body?.especialidad)

  if (!['ESTUDIANTE', 'TUTOR'].includes(rol)) {
    return res.status(400).json({ success: false, message: 'El rol debe ser ESTUDIANTE o TUTOR.' })
  }
  if (
    !nombre || nombre.length > 100 || !apellido || apellido.length > 100 ||
    !correo || correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    return res.status(400).json({ success: false, message: 'Nombre, apellido, correo y contraseña son obligatorios o tienen un formato inválido.' })
  }
  if (password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres y no exceder el límite admitido.' })
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' })
  }
  if (rol === 'ESTUDIANTE' && (!carnet || carnet.length > 30 || !Number.isSafeInteger(idCarrera) || idCarrera <= 0)) {
    return res.status(400).json({ success: false, message: 'Para estudiantes, el carnet y una carrera válida son obligatorios.' })
  }
  if (rol === 'TUTOR' && (departamento.length > 150 || especialidad.length > 200)) {
    return res.status(400).json({ success: false, message: 'El departamento o la especialidad exceden la longitud permitida.' })
  }

  // Mantener la política de dominios que valida el formulario público.
  const domain = correo.split('@').pop()
  if (rol === 'ESTUDIANTE' && domain !== 'std.uni.edu.ni') {
    return res.status(400).json({ success: false, message: 'Los estudiantes deben utilizar un correo @std.uni.edu.ni.' })
  }
  if (rol === 'TUTOR' && domain !== 'dactic.uni.edu.ni') {
    return res.status(400).json({ success: false, message: 'Los tutores deben utilizar un correo @dactic.uni.edu.ni.' })
  }

  let client: PoolClient | undefined
  let transactionStarted = false
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true

    const existingEmail = await client.query(
      'SELECT 1 FROM usuarios WHERE LOWER(correo) = $1 LIMIT 1',
      [correo]
    )
    if (existingEmail.rowCount) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese correo.' })
    }

    if (rol === 'ESTUDIANTE') {
      const existingCarnet = await client.query(
        'SELECT 1 FROM estudiantes WHERE carnet = $1 LIMIT 1',
        [carnet]
      )
      if (existingCarnet.rowCount) {
        await client.query('ROLLBACK')
        transactionStarted = false
        return res.status(409).json({ success: false, message: 'Ya existe un estudiante con ese carnet.' })
      }
      const career = await client.query(
        'SELECT 1 FROM carreras WHERE id_carrera = $1 AND activo = TRUE',
        [idCarrera]
      )
      if (!career.rowCount) {
        await client.query('ROLLBACK')
        transactionStarted = false
        return res.status(400).json({ success: false, message: 'La carrera seleccionada no existe o está inactiva.' })
      }
    }

    const userResult = await client.query<PublicUser>(
      `INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol, activo)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id_usuario, nombre, apellido, correo, rol`,
      [nombre, apellido, correo, passwordHash, rol]
    )
    const user = userResult.rows[0]

    if (rol === 'ESTUDIANTE') {
      await client.query(
        'INSERT INTO estudiantes (id_usuario, carnet, id_carrera) VALUES ($1, $2, $3)',
        [user.id_usuario, carnet, idCarrera]
      )
    } else {
      await client.query(
        'INSERT INTO tutores (id_usuario, departamento, especialidad) VALUES ($1, $2, $3)',
        [user.id_usuario, departamento || null, especialidad || null]
      )
    }

    const session = createSession(user)
    await client.query('COMMIT')
    transactionStarted = false
    return res.status(201).json({
      success: true,
      message: 'Registro completado correctamente.',
      ...session,
    })
  } catch (error) {
    if (client && transactionStarted) {
      try { await client.query('ROLLBACK') } catch { /* No exponer detalles de PostgreSQL. */ }
    }
    const conflict = duplicateMessage(error)
    if (conflict) return res.status(409).json({ success: false, message: conflict })
    console.error('No se pudo completar el registro:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo completar el registro. Inténtalo nuevamente.' })
  } finally {
    client?.release()
  }
}
