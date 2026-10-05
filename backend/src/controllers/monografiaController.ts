import { Request, Response } from 'express'
import pool from '../config/database'

// =========================================================
// OBTENER TODAS LAS MONOGRAFÍAS
// =========================================================

export const getMonografias = async (
  _req: Request,
  res: Response
) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id_monografia,
        m.titulo,
        m.descripcion,
        m.estado,
        m.fecha_registro,

        -- ESTUDIANTE PRINCIPAL
        e.id_estudiante,
        e.carnet,
        ue.id_usuario AS estudiante_id_usuario,
        ue.nombre AS estudiante_nombre,
        ue.apellido AS estudiante_apellido,
        ue.correo AS estudiante_correo,

        -- TUTOR
        t.id_tutor,
        ut.id_usuario AS tutor_id_usuario,
        ut.nombre AS tutor_nombre,
        ut.apellido AS tutor_apellido,
        ut.correo AS tutor_correo,

        -- INFORMACIÓN ACADÉMICA
        c.nombre AS carrera,
        ca.nombre AS ciclo,

        -- TODOS LOS INTEGRANTES
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
            INNER JOIN estudiantes ei
              ON me.id_estudiante = ei.id_estudiante
            INNER JOIN usuarios ui
              ON ei.id_usuario = ui.id_usuario
            WHERE me.id_monografia = m.id_monografia
          ),
          '[]'::json
        ) AS integrantes

      FROM monografias m

      -- ESTUDIANTE PRINCIPAL
      INNER JOIN estudiantes e
        ON m.id_estudiante = e.id_estudiante

      INNER JOIN usuarios ue
        ON e.id_usuario = ue.id_usuario

      -- TUTOR
      LEFT JOIN tutores t
        ON m.id_tutor = t.id_tutor

      LEFT JOIN usuarios ut
        ON t.id_usuario = ut.id_usuario

      -- CARRERA
      INNER JOIN carreras c
        ON m.id_carrera = c.id_carrera

      -- CICLO
      INNER JOIN ciclos_academicos ca
        ON m.id_ciclo = ca.id_ciclo

      ORDER BY m.fecha_registro DESC
    `)

    return res.json({
      success: true,
      total: result.rows.length,
      monografias: result.rows,
    })
  } catch (error) {
    console.error(
      'Error al obtener monografías:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron obtener las monografías',
    })
  }
}

// =========================================================
// OBTENER TUTORES
// =========================================================

export const getTutores = async (
  _req: Request,
  res: Response
) => {
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

      INNER JOIN usuarios u
        ON t.id_usuario = u.id_usuario

      WHERE u.rol = 'TUTOR'
        AND u.activo = TRUE

      ORDER BY
        u.apellido ASC,
        u.nombre ASC
    `)

    return res.json({
      success: true,
      total: result.rows.length,
      tutores: result.rows,
    })
  } catch (error) {
    console.error(
      'Error al obtener tutores:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudieron obtener los tutores',
    })
  }
}

// =========================================================
// ASIGNAR TUTOR
// =========================================================

export const asignarTutor = async (
  req: Request,
  res: Response
) => {
  const client = await pool.connect()

  try {
    const { id_monografia } = req.params
    const { id_tutor } = req.body

    const idMonografia = Number(id_monografia)
    const idTutor = Number(id_tutor)

    // -----------------------------------------------------
    // VALIDAR MONOGRAFÍA
    // -----------------------------------------------------

    if (!Number.isInteger(idMonografia)) {
      return res.status(400).json({
        success: false,
        message:
          'El id de la monografía no es válido',
      })
    }

    // -----------------------------------------------------
    // VALIDAR TUTOR
    // -----------------------------------------------------

    if (!Number.isInteger(idTutor)) {
      return res.status(400).json({
        success: false,
        message:
          'El id del tutor no es válido',
      })
    }

    // -----------------------------------------------------
    // BUSCAR MONOGRAFÍA
    // -----------------------------------------------------

    const monografiaResult =
      await client.query(
        `
        SELECT
          m.id_monografia,
          m.titulo,
          e.id_usuario AS id_usuario_estudiante

        FROM monografias m

        INNER JOIN estudiantes e
          ON m.id_estudiante = e.id_estudiante

        WHERE m.id_monografia = $1
        `,
        [idMonografia]
      )

    if (
      monografiaResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          'La monografía no existe',
      })
    }

    const monografia =
      monografiaResult.rows[0]

    // -----------------------------------------------------
    // BUSCAR TUTOR
    // -----------------------------------------------------

    const tutorResult =
      await client.query(
        `
        SELECT
          t.id_tutor,
          t.id_usuario,
          u.nombre,
          u.apellido,
          u.correo

        FROM tutores t

        INNER JOIN usuarios u
          ON t.id_usuario = u.id_usuario

        WHERE t.id_tutor = $1
          AND u.rol = 'TUTOR'
          AND u.activo = TRUE
        `,
        [idTutor]
      )

    if (tutorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'El tutor no existe o está inactivo',
      })
    }

    const tutor = tutorResult.rows[0]

    // -----------------------------------------------------
    // TRANSACCIÓN
    // -----------------------------------------------------

    await client.query('BEGIN')

    // -----------------------------------------------------
    // ACTUALIZAR TUTOR
    // -----------------------------------------------------

    const updateResult =
      await client.query(
        `
        UPDATE monografias
        SET id_tutor = $1
        WHERE id_monografia = $2

        RETURNING
          id_monografia,
          titulo,
          id_tutor,
          estado
        `,
        [
          idTutor,
          idMonografia,
        ]
      )

    // -----------------------------------------------------
    // NOTIFICAR AL ESTUDIANTE PRINCIPAL
    // -----------------------------------------------------

    await client.query(
      `
      INSERT INTO notificaciones (
        id_usuario,
        titulo,
        mensaje,
        tipo
      )

      VALUES (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        monografia.id_usuario_estudiante,

        'Tutor asignado',

        `Se te ha asignado como tutor a ${tutor.nombre} ${tutor.apellido} para tu monografía "${monografia.titulo}".`,

        'TUTOR',
      ]
    )

    await client.query('COMMIT')

    return res.json({
      success: true,

      message:
        'Tutor asignado correctamente',

      monografia:
        updateResult.rows[0],

      tutor: {
        id_tutor: tutor.id_tutor,
        nombre: tutor.nombre,
        apellido: tutor.apellido,
        correo: tutor.correo,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')

    console.error(
      'Error al asignar tutor:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudo asignar el tutor',
    })
  } finally {
    client.release()
  }
}