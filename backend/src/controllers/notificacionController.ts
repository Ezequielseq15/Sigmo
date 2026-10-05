import { Request, Response } from 'express'
import pool from '../config/database'

export const getNotificacionesByUsuario = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_usuario } = req.params

    const result = await pool.query(
      `
      SELECT
        id_notificacion,
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion
      FROM notificaciones
      WHERE id_usuario = $1
      ORDER BY fecha_creacion DESC
      `,
      [id_usuario]
    )

    return res.json({
      success: true,
      total: result.rows.length,
      notificaciones: result.rows,
    })
  } catch (error) {
    console.error(
      'Error al obtener notificaciones:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron obtener las notificaciones',
    })
  }
}

export const getNotificacionesNoLeidas = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_usuario } = req.params

    const result = await pool.query(
      `
      SELECT
        id_notificacion,
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leida,
        fecha_creacion
      FROM notificaciones
      WHERE id_usuario = $1
        AND leida = FALSE
      ORDER BY fecha_creacion DESC
      `,
      [id_usuario]
    )

    return res.json({
      success: true,
      total: result.rows.length,
      notificaciones: result.rows,
    })
  } catch (error) {
    console.error(
      'Error al obtener notificaciones no leídas:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron obtener las notificaciones no leídas',
    })
  }
}

export const crearNotificacion = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      id_usuario,
      titulo,
      mensaje,
      tipo,
    } = req.body

    if (
      !id_usuario ||
      !titulo ||
      !mensaje
    ) {
      return res.status(400).json({
        success: false,
        message:
          'id_usuario, titulo y mensaje son obligatorios',
      })
    }

    const result = await pool.query(
      `
      INSERT INTO notificaciones (
        id_usuario,
        titulo,
        mensaje,
        tipo
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        id_usuario,
        titulo,
        mensaje,
        tipo || 'GENERAL',
      ]
    )

    return res.status(201).json({
      success: true,
      message:
        'Notificación creada correctamente',
      notificacion:
        result.rows[0],
    })
  } catch (error) {
    console.error(
      'Error al crear notificación:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudo crear la notificación',
    })
  }
}

export const marcarNotificacionLeida = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_notificacion } =
      req.params

    const result = await pool.query(
      `
      UPDATE notificaciones
      SET leida = TRUE
      WHERE id_notificacion = $1
      RETURNING *
      `,
      [id_notificacion]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Notificación no encontrada',
      })
    }

    return res.json({
      success: true,
      message:
        'Notificación marcada como leída',
      notificacion:
        result.rows[0],
    })
  } catch (error) {
    console.error(
      'Error al marcar notificación:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudo actualizar la notificación',
    })
  }
}

export const marcarTodasLeidas = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_usuario } = req.params

    await pool.query(
      `
      UPDATE notificaciones
      SET leida = TRUE
      WHERE id_usuario = $1
        AND leida = FALSE
      `,
      [id_usuario]
    )

    return res.json({
      success: true,
      message:
        'Todas las notificaciones fueron marcadas como leídas',
    })
  } catch (error) {
    console.error(
      'Error al marcar todas las notificaciones:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron actualizar las notificaciones',
    })
  }
}