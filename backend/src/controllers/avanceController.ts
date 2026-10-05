import { Request, Response } from 'express'
import pool from '../config/database'

/**
 * Obtener todos los avances de una monografía
 */
export const getAvancesByMonografia = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_monografia } = req.params

    const result = await pool.query(
      `
      SELECT
        a.id_avance,
        a.id_monografia,
        a.id_etapa,
        a.descripcion,
        a.estado,
        a.fecha_entrega,
        a.comentario_tutor,
        a.fecha_revision,
        e.nombre AS etapa_nombre
      FROM avances a
      INNER JOIN etapas_monografia e
        ON a.id_etapa = e.id_etapa
      WHERE a.id_monografia = $1
      ORDER BY a.fecha_entrega DESC
      `,
      [id_monografia]
    )

    return res.json({
      success: true,
      total: result.rows.length,
      avances: result.rows,
    })
  } catch (error) {
    console.error('Error al obtener avances:', error)

    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los avances',
    })
  }
}

/**
 * Crear un nuevo avance
 */
export const createAvance = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      id_monografia,
      id_etapa,
      descripcion,
    } = req.body

    if (!id_monografia || !id_etapa || !descripcion) {
      return res.status(400).json({
        success: false,
        message:
          'id_monografia, id_etapa y descripcion son obligatorios',
      })
    }

    const result = await pool.query(
      `
      INSERT INTO avances (
        id_monografia,
        id_etapa,
        descripcion,
        estado,
        fecha_entrega
      )
      VALUES ($1, $2, $3, 'PENDIENTE', CURRENT_TIMESTAMP)
      RETURNING *
      `,
      [
        id_monografia,
        id_etapa,
        descripcion,
      ]
    )

    return res.status(201).json({
      success: true,
      message: 'Avance registrado correctamente',
      avance: result.rows[0],
    })
  } catch (error) {
    console.error('Error al registrar avance:', error)

    return res.status(500).json({
      success: false,
      message: 'No se pudo registrar el avance',
    })
  }
}

/**
 * Revisar un avance como tutor
 *
 * Estados permitidos:
 * APROBADO
 * RECHAZADO
 *
 * Si el avance es rechazado,
 * el comentario del tutor es obligatorio.
 *
 * La notificación se envía a TODOS
 * los integrantes de la monografía.
 */
export const revisarAvance = async (
  req: Request,
  res: Response
) => {
  const client = await pool.connect()

  try {
    const { id_avance } = req.params

    const {
      estado,
      comentario_tutor,
    } = req.body

    if (!id_avance) {
      return res.status(400).json({
        success: false,
        message: 'El id_avance es obligatorio',
      })
    }

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es obligatorio',
      })
    }

    const estadoNormalizado = String(estado)
      .trim()
      .toUpperCase()

    const estadosPermitidos = [
      'APROBADO',
      'RECHAZADO',
    ]

    if (!estadosPermitidos.includes(estadoNormalizado)) {
      return res.status(400).json({
        success: false,
        message:
          'El estado debe ser APROBADO o RECHAZADO',
      })
    }

    const comentario =
      comentario_tutor
        ? String(comentario_tutor).trim()
        : ''

    if (
      estadoNormalizado === 'RECHAZADO' &&
      !comentario
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Debes indicar el motivo del rechazo',
      })
    }

    await client.query('BEGIN')

    /*
     * Obtener el avance y la monografía.
     */
    const avanceResult = await client.query(
      `
      SELECT
        a.id_avance,
        a.id_monografia,
        a.estado,
        m.titulo AS titulo_monografia
      FROM avances a
      INNER JOIN monografias m
        ON a.id_monografia = m.id_monografia
      WHERE a.id_avance = $1
      `,
      [id_avance]
    )

    if (avanceResult.rows.length === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Avance no encontrado',
      })
    }

    const avance = avanceResult.rows[0]

    /*
     * Actualizar el avance.
     */
    const updateResult = await client.query(
      `
      UPDATE avances
      SET
        estado = $1,
        comentario_tutor = $2,
        fecha_revision = CURRENT_TIMESTAMP
      WHERE id_avance = $3
      RETURNING *
      `,
      [
        estadoNormalizado,
        comentario || null,
        id_avance,
      ]
    )

    /*
     * Preparar la notificación.
     */
    let tituloNotificacion = ''
    let mensajeNotificacion = ''

    if (estadoNormalizado === 'APROBADO') {
      tituloNotificacion = 'Avance aprobado'

      if (comentario) {
        mensajeNotificacion =
          `Tu avance de la monografía ` +
          `"${avance.titulo_monografia}" ` +
          `fue aprobado por el tutor. ` +
          `Comentario: ${comentario}`
      } else {
        mensajeNotificacion =
          `Tu avance de la monografía ` +
          `"${avance.titulo_monografia}" ` +
          `fue aprobado por el tutor.`
      }
    } else {
      tituloNotificacion = 'Avance rechazado'

      mensajeNotificacion =
        `Tu avance de la monografía ` +
        `"${avance.titulo_monografia}" ` +
        `fue rechazado por el tutor. ` +
        `Observaciones: ${comentario}`
    }

    /*
     * Obtener TODOS los integrantes de la monografía.
     *
     * monografia_estudiantes relaciona:
     * monografía -> estudiantes -> usuarios
     */
    const integrantesResult = await client.query(
      `
      SELECT DISTINCT
        u.id_usuario
      FROM monografia_estudiantes me
      INNER JOIN estudiantes e
        ON me.id_estudiante = e.id_estudiante
      INNER JOIN usuarios u
        ON e.id_usuario = u.id_usuario
      WHERE me.id_monografia = $1
      `,
      [avance.id_monografia]
    )

    /*
     * Crear una notificación para cada integrante.
     */
    for (const integrante of integrantesResult.rows) {
      await client.query(
        `
        INSERT INTO notificaciones (
          id_usuario,
          titulo,
          mensaje,
          tipo
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          integrante.id_usuario,
          tituloNotificacion,
          mensajeNotificacion,
          'AVANCE',
        ]
      )
    }

    await client.query('COMMIT')

    return res.json({
      success: true,
      message:
        estadoNormalizado === 'APROBADO'
          ? 'Avance aprobado correctamente'
          : 'Avance rechazado correctamente',
      avance: updateResult.rows[0],
      notificaciones_enviadas:
        integrantesResult.rows.length,
    })
  } catch (error) {
    await client.query('ROLLBACK')

    console.error(
      'Error al revisar avance:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'No se pudo revisar el avance',
    })
  } finally {
    client.release()
  }
}