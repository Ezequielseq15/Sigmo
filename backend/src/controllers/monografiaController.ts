import { Request, Response } from 'express'
import pool from '../config/database'

// Obtener todas las monografías, incluyendo el estado de la última versión del protocolo.
export const getMonografias = async (req: Request, res: Response) => {
  try {
    const user = req.authUser
    if (!user) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida.' })
    }

    let filtro = ''
    const params: number[] = []
    if (user.rol === 'ESTUDIANTE') {
      filtro = `WHERE EXISTS (
        SELECT 1 FROM estudiantes e0
        WHERE e0.id_estudiante = m.id_estudiante AND e0.id_usuario = $1
      ) OR EXISTS (
        SELECT 1 FROM monografia_estudiantes me0
        JOIN estudiantes e0 ON e0.id_estudiante = me0.id_estudiante
        WHERE me0.id_monografia = m.id_monografia AND e0.id_usuario = $1
      )`
      params.push(user.id_usuario)
    } else if (user.rol === 'TUTOR') {
      filtro = `WHERE EXISTS (
        SELECT 1 FROM tutores t0
        WHERE t0.id_tutor = m.id_tutor AND t0.id_usuario = $1
      )`
      params.push(user.id_usuario)
    } else if (user.rol !== 'COORDINADOR') {
      return res.status(403).json({ success: false, message: 'No tienes permiso para consultar monografías.' })
    }

    const result = await pool.query(`
      SELECT
        m.id_monografia,
        m.titulo,
        m.descripcion,
        m.estado,
        m.estado_propuesta,
        m.fecha_registro,
        e.id_estudiante,
        e.carnet,
        ue.id_usuario AS estudiante_id_usuario,
        ue.nombre AS estudiante_nombre,
        ue.apellido AS estudiante_apellido,
        ue.correo AS estudiante_correo,
        t.id_tutor,
        ut.id_usuario AS tutor_id_usuario,
        ut.nombre AS tutor_nombre,
        ut.apellido AS tutor_apellido,
        ut.correo AS tutor_correo,
        c.nombre AS carrera,
        ca.nombre AS ciclo,
        protocolo.estado_protocolo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id_estudiante', ei.id_estudiante,
                'id_usuario', ui.id_usuario,
                'carnet', ei.carnet,
                'nombre', ui.nombre,
                'apellido', ui.apellido,
                'correo', ui.correo
              )
              ORDER BY ui.apellido ASC, ui.nombre ASC
            )
            FROM monografia_estudiantes me
            INNER JOIN estudiantes ei ON me.id_estudiante = ei.id_estudiante
            INNER JOIN usuarios ui ON ei.id_usuario = ui.id_usuario
            WHERE me.id_monografia = m.id_monografia
          ),
          '[]'::json
        ) AS integrantes
      FROM monografias m
      INNER JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
      INNER JOIN usuarios ue ON e.id_usuario = ue.id_usuario
      LEFT JOIN tutores t ON m.id_tutor = t.id_tutor
      LEFT JOIN usuarios ut ON t.id_usuario = ut.id_usuario
      INNER JOIN carreras c ON m.id_carrera = c.id_carrera
      INNER JOIN ciclos_academicos ca ON m.id_ciclo = ca.id_ciclo
      LEFT JOIN LATERAL (
        SELECT pm.estado AS estado_protocolo
        FROM protocolos_monografia pm
        WHERE pm.id_monografia = m.id_monografia
        ORDER BY pm.numero_version DESC
        LIMIT 1
      ) protocolo ON TRUE
      ${filtro}
      ORDER BY m.fecha_registro DESC
    `, params)

    return res.json({
      success: true,
      total: result.rows.length,
      monografias: result.rows,
    })
  } catch (error) {
    console.error('Error al obtener monografías:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener las monografías',
    })
  }
}

// Obtener tutores activos.
export const getTutores = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id_tutor,
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.correo,
        u.activo
      FROM tutores t
      INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
      WHERE u.rol = 'TUTOR'
        AND u.activo = TRUE
      ORDER BY u.apellido ASC, u.nombre ASC
    `)

    return res.json({
      success: true,
      total: result.rows.length,
      tutores: result.rows,
    })
  } catch (error) {
    console.error('Error al obtener tutores:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los tutores',
    })
  }
}

// Asignar tutor a una monografía.
export const asignarTutor = async (req: Request, res: Response) => {
  const client = await pool.connect()
  let transaccionIniciada = false

  try {
    const idMonografia = Number(req.params.id_monografia)
    const idTutor = Number(req.body.id_tutor)

    if (!Number.isInteger(idMonografia) || idMonografia <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El id de la monografía no es válido',
      })
    }

    if (!Number.isInteger(idTutor) || idTutor <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El id del tutor no es válido',
      })
    }

    const monografiaResult = await client.query(
      `
      SELECT m.id_monografia, m.titulo, m.id_tutor, e.id_usuario AS id_usuario_estudiante
      FROM monografias m
      INNER JOIN estudiantes e ON m.id_estudiante = e.id_estudiante
      WHERE m.id_monografia = $1
      `,
      [idMonografia]
    )

    if (monografiaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'La monografía no existe',
      })
    }

    const tutorResult = await client.query(
      `
      SELECT t.id_tutor, t.id_usuario, u.nombre, u.apellido, u.correo
      FROM tutores t
      INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
      WHERE t.id_tutor = $1
        AND u.rol = 'TUTOR'
        AND u.activo = TRUE
      `,
      [idTutor]
    )

    if (tutorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El tutor no existe o está inactivo',
      })
    }

    const monografia = monografiaResult.rows[0]
    const tutor = tutorResult.rows[0]

    await client.query('BEGIN')
    transaccionIniciada = true

    const asignacionActual = await client.query(
      `SELECT id_tutor FROM monografias WHERE id_monografia = $1 FOR UPDATE`,
      [idMonografia]
    )
    if (!asignacionActual.rowCount) {
      await client.query('ROLLBACK')
      transaccionIniciada = false
      return res.status(404).json({ success: false, message: 'La monografía ya no existe.' })
    }

    if (Number(asignacionActual.rows[0].id_tutor || 0) !== idTutor) {
      await client.query(
        `UPDATE confirmaciones_defensa
         SET vigente = FALSE
         WHERE id_monografia = $1 AND vigente = TRUE`,
        [idMonografia]
      )
    }

    const updateResult = await client.query(
      `
      UPDATE monografias
      SET id_tutor = $1
      WHERE id_monografia = $2
      RETURNING id_monografia, titulo, id_tutor, estado
      `,
      [idTutor, idMonografia]
    )

    await client.query(
      `
      INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo)
      VALUES ($1, $2, $3, $4)
      `,
      [
        monografia.id_usuario_estudiante,
        'Tutor asignado',
        `Se te ha asignado como tutor a ${tutor.nombre} ${tutor.apellido} para tu monografía "${monografia.titulo}".`,
        'TUTOR',
      ]
    )

    await client.query('COMMIT')
    transaccionIniciada = false

    return res.json({
      success: true,
      message: 'Tutor asignado correctamente',
      monografia: updateResult.rows[0],
      tutor: {
        id_tutor: tutor.id_tutor,
        nombre: tutor.nombre,
        apellido: tutor.apellido,
        correo: tutor.correo,
      },
    })
  } catch (error) {
    if (transaccionIniciada) {
      await client.query('ROLLBACK')
    }
    console.error('Error al asignar tutor:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({
      success: false,
      message: 'No se pudo asignar el tutor',
    })
  } finally {
    client.release()
  }
}
