import { Request, Response } from 'express'
import pool from '../config/database'

export const obtenerCatalogosPropuesta = async (
  _req: Request,
  res: Response
) => {
  try {
    const [ciclos, estudiantes] = await Promise.all([
      pool.query(`
        SELECT
          id_ciclo,
          nombre,
          activo
        FROM ciclos_academicos
        WHERE activo = TRUE
        ORDER BY fecha_inicio DESC NULLS LAST, nombre DESC
      `),

      pool.query(`
        SELECT
          e.id_estudiante,
          e.carnet,
          u.nombre,
          u.apellido,
          u.correo
        FROM estudiantes e
        INNER JOIN usuarios u
          ON u.id_usuario = e.id_usuario
        WHERE u.activo = TRUE
          AND u.rol = 'ESTUDIANTE'
        ORDER BY u.apellido, u.nombre
      `),
    ])

    return res.json({
      success: true,
      ciclos: ciclos.rows,
      estudiantes: estudiantes.rows,
    })
  } catch (error) {
    console.error('Error al cargar catálogos para propuesta:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudieron cargar los ciclos y los integrantes.',
    })
  }
}
