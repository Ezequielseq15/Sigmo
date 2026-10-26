import { Request, Response } from 'express'
import type { PoolClient } from 'pg'
import pool from '../config/database'
import { canAccessMonografia } from '../middleware/resourceAuthorization'

type DefensaInput = {
  fecha: string
  hora: string
  lugar: string
  observaciones: string | null
}

function parseMonografiaId(raw: unknown): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

function validateInput(body: Record<string, unknown>): DefensaInput | null {
  const fecha = typeof body.fecha === 'string' ? body.fecha.trim() : ''
  const hora = typeof body.hora === 'string' ? body.hora.trim() : ''
  const lugar = typeof body.lugar === 'string' ? body.lugar.trim() : ''
  const observaciones = body.observaciones == null
    ? null
    : typeof body.observaciones === 'string' ? body.observaciones.trim() : undefined

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(hora) ||
    !lugar || lugar.length > 200 || observaciones === undefined ||
    (observaciones !== null && observaciones.length > 4000)
  ) return null

  const [year, month, day] = fecha.split('-').map(Number)
  const [hour, minute, second = 0] = hora.split(':').map(Number)
  const scheduled = new Date(year, month - 1, day, hour, minute, second)
  if (
    scheduled.getFullYear() !== year ||
    scheduled.getMonth() !== month - 1 ||
    scheduled.getDate() !== day ||
    scheduled.getHours() !== hour ||
    scheduled.getMinutes() !== minute ||
    scheduled.getSeconds() !== second ||
    scheduled.getTime() < Date.now()
  ) return null

  return { fecha, hora, lugar, observaciones }
}

async function checkReadiness(client: PoolClient, idMonografia: number) {
  const result = await client.query(
    `SELECT m.id_monografia,
            m.id_tutor,
            t.id_usuario AS id_usuario_tutor,
            ut.rol AS rol_tutor,
            ut.activo AS tutor_activo,
            protocolo.id_protocolo AS id_protocolo_actual,
            protocolo.estado AS estado_protocolo,
            confirmacion.confirmada,
            confirmacion.id_usuario_tutor AS confirmada_por,
            confirmacion.id_protocolo AS id_protocolo_confirmacion
       FROM monografias m
       LEFT JOIN tutores t ON t.id_tutor = m.id_tutor
       LEFT JOIN usuarios ut ON ut.id_usuario = t.id_usuario
       LEFT JOIN LATERAL (
         SELECT p.id_protocolo, p.estado
           FROM protocolos_monografia p
          WHERE p.id_monografia = m.id_monografia
          ORDER BY p.numero_version DESC
          LIMIT 1
       ) protocolo ON TRUE
       LEFT JOIN LATERAL (
         SELECT c.confirmada, c.id_usuario_tutor, c.id_protocolo
           FROM confirmaciones_defensa c
          WHERE c.id_monografia = m.id_monografia AND c.vigente = TRUE
          ORDER BY c.fecha_confirmacion DESC, c.id_confirmacion DESC
          LIMIT 1
       ) confirmacion ON TRUE
      WHERE m.id_monografia = $1
      FOR UPDATE OF m`,
    [idMonografia]
  )
  return result.rows[0]
}

function hasCurrentReadiness(readiness: Record<string, unknown> | undefined): boolean {
  return Boolean(
    readiness &&
    readiness.id_tutor &&
    readiness.rol_tutor === 'TUTOR' &&
    readiness.tutor_activo === true &&
    readiness.estado_protocolo === 'APROBADO' &&
    readiness.confirmada === true &&
    Number(readiness.confirmada_por) === Number(readiness.id_usuario_tutor) &&
    Number(readiness.id_protocolo_confirmacion) === Number(readiness.id_protocolo_actual)
  )
}

export async function listarDefensasCoordinador(_req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT m.id_monografia, m.titulo, m.estado,
              e.carnet, u.nombre AS estudiante_nombre, u.apellido AS estudiante_apellido,
              t.id_tutor, ut.nombre AS tutor_nombre, ut.apellido AS tutor_apellido,
              protocolo.estado AS estado_protocolo,
              CASE WHEN confirmacion.id_usuario_tutor = ut.id_usuario
                         AND confirmacion.id_protocolo = protocolo.id_protocolo
                         AND protocolo.estado = 'APROBADO'
                         AND ut.rol = 'TUTOR' AND ut.activo = TRUE
                   THEN confirmacion.confirmada ELSE FALSE END AS tutor_confirmo,
              CASE WHEN confirmacion.id_usuario_tutor = ut.id_usuario
                         AND confirmacion.id_protocolo = protocolo.id_protocolo
                         AND protocolo.estado = 'APROBADO'
                         AND ut.rol = 'TUTOR' AND ut.activo = TRUE
                         AND confirmacion.confirmada = TRUE
                   THEN TRUE ELSE FALSE END AS confirmacion_vigente,
              d.id_defensa, d.fecha, d.hora, d.lugar, d.estado AS estado_defensa, d.observaciones,
              COALESCE(historial.eventos, '[]'::json) AS historial_defensas,
              (protocolo.estado = 'APROBADO'
               AND confirmacion.confirmada = TRUE
               AND confirmacion.id_usuario_tutor = ut.id_usuario
               AND confirmacion.id_protocolo = protocolo.id_protocolo
               AND ut.rol = 'TUTOR' AND ut.activo = TRUE
               AND NOT EXISTS (
                 SELECT 1 FROM defensas activa
                  WHERE activa.id_monografia = m.id_monografia
                    AND activa.estado IN ('PROGRAMADA', 'REALIZADA')
               )) AS puede_programar
         FROM monografias m
         JOIN estudiantes e ON e.id_estudiante = m.id_estudiante
         JOIN usuarios u ON u.id_usuario = e.id_usuario
         LEFT JOIN tutores t ON t.id_tutor = m.id_tutor
         LEFT JOIN usuarios ut ON ut.id_usuario = t.id_usuario
         LEFT JOIN LATERAL (
           SELECT p.id_protocolo, p.estado FROM protocolos_monografia p
            WHERE p.id_monografia = m.id_monografia
            ORDER BY p.numero_version DESC LIMIT 1
         ) protocolo ON TRUE
         LEFT JOIN LATERAL (
           SELECT c.confirmada, c.id_usuario_tutor, c.id_protocolo
             FROM confirmaciones_defensa c
            WHERE c.id_monografia = m.id_monografia AND c.vigente = TRUE
            ORDER BY c.fecha_confirmacion DESC, c.id_confirmacion DESC LIMIT 1
         ) confirmacion ON TRUE
         LEFT JOIN LATERAL (
           SELECT d0.id_defensa, d0.fecha, d0.hora, d0.lugar, d0.estado, d0.observaciones
             FROM defensas d0
            WHERE d0.id_monografia = m.id_monografia
            ORDER BY d0.id_defensa DESC LIMIT 1
         ) d ON TRUE
         LEFT JOIN LATERAL (
           SELECT json_agg(json_build_object(
                    'id_historial', h.id_historial,
                    'id_defensa', h.id_defensa,
                    'accion', h.accion,
                    'detalle', h.detalle,
                    'fecha_evento', h.fecha_evento,
                    'coordinador_nombre', uc.nombre,
                    'coordinador_apellido', uc.apellido
                  ) ORDER BY h.fecha_evento DESC, h.id_historial DESC) AS eventos
             FROM historial_defensas h
             JOIN usuarios uc ON uc.id_usuario = h.id_usuario_coordinador
            WHERE h.id_monografia = m.id_monografia
         ) historial ON TRUE
        ORDER BY d.fecha NULLS FIRST, m.fecha_registro DESC`
    )
    return res.json({ success: true, defensas: result.rows })
  } catch (error) {
    console.error('Error al consultar defensas para coordinación:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudieron consultar las defensas.' })
  }
}

export async function obtenerDefensaMonografia(req: Request, res: Response) {
  const user = req.authUser
  const idMonografia = parseMonografiaId(req.params.id_monografia)
  if (!user) return res.status(401).json({ success: false, message: 'Autenticación requerida.' })
  if (!idMonografia) return res.status(400).json({ success: false, message: 'El identificador de monografía no es válido.' })

  try {
    if (!(await canAccessMonografia(idMonografia, user))) {
      return res.status(404).json({ success: false, message: 'La monografía no existe.' })
    }
    const result = await pool.query(
      `SELECT d.id_defensa, d.id_monografia, d.fecha, d.hora, d.lugar,
              d.estado, d.observaciones,
              protocolo.id_protocolo AS id_protocolo_actual,
              protocolo.estado AS estado_protocolo,
              CASE WHEN c.id_usuario_tutor = t.id_usuario
                         AND c.id_protocolo = protocolo.id_protocolo
                         AND protocolo.estado = 'APROBADO'
                         AND ut.rol = 'TUTOR' AND ut.activo = TRUE
                   THEN c.confirmada ELSE FALSE END AS tutor_confirmo
         FROM monografias m
         LEFT JOIN tutores t ON t.id_tutor = m.id_tutor
         LEFT JOIN usuarios ut ON ut.id_usuario = t.id_usuario
         LEFT JOIN LATERAL (
           SELECT d0.id_defensa, d0.id_monografia, d0.fecha, d0.hora,
                  d0.lugar, d0.estado, d0.observaciones
             FROM defensas d0
            WHERE d0.id_monografia = m.id_monografia
            ORDER BY d0.id_defensa DESC LIMIT 1
         ) d ON TRUE
         LEFT JOIN LATERAL (
           SELECT p.id_protocolo, p.estado FROM protocolos_monografia p
            WHERE p.id_monografia = m.id_monografia
            ORDER BY p.numero_version DESC LIMIT 1
         ) protocolo ON TRUE
         LEFT JOIN LATERAL (
           SELECT c0.confirmada, c0.id_usuario_tutor, c0.id_protocolo
             FROM confirmaciones_defensa c0
            WHERE c0.id_monografia = m.id_monografia AND c0.vigente = TRUE
            ORDER BY c0.fecha_confirmacion DESC, c0.id_confirmacion DESC LIMIT 1
         ) c ON TRUE
        WHERE m.id_monografia = $1`,
      [idMonografia]
    )
    const row = result.rows[0]
    return res.json({
      success: true,
      defensa: row?.id_defensa ? row : null,
      protocolo_aprobado: row?.estado_protocolo === 'APROBADO',
      tutor_confirmo: row?.tutor_confirmo === true,
    })
  } catch (error) {
    console.error('Error al consultar defensa:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo consultar la defensa.' })
  }
}

export async function confirmarListaDefensa(req: Request, res: Response) {
  const user = req.authUser
  const idMonografia = parseMonografiaId(req.params.id_monografia)
  if (!user) return res.status(401).json({ success: false, message: 'Autenticación requerida.' })
  if (!idMonografia) return res.status(400).json({ success: false, message: 'El identificador de monografía no es válido.' })
  if (typeof req.body?.confirmada !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Indica confirmada como verdadero o falso.' })
  }

  const client = await pool.connect()
  let inTransaction = false
  try {
    await client.query('BEGIN')
    inTransaction = true
    const readiness = await checkReadiness(client, idMonografia)
    if (!readiness) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(404).json({ success: false, message: 'La monografía no existe.' })
    }
    if (
      Number(readiness.id_usuario_tutor) !== user.id_usuario ||
      user.rol !== 'TUTOR' ||
      readiness.rol_tutor !== 'TUTOR' ||
      readiness.tutor_activo !== true
    ) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(403).json({ success: false, message: 'Solo el tutor asignado puede confirmar que está lista para defensa.' })
    }
    if (readiness.estado_protocolo !== 'APROBADO') {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'El protocolo debe estar aprobado antes de confirmar la preparación para defensa.' })
    }
    if (!readiness.id_protocolo_actual) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'No hay una versión aprobada del protocolo para confirmar.' })
    }
    if (!req.body.confirmada) {
      const activeDefense = await client.query(
        `SELECT 1 FROM defensas WHERE id_monografia = $1 AND estado = 'PROGRAMADA'`,
        [idMonografia]
      )
      if (activeDefense.rowCount) {
        await client.query('ROLLBACK'); inTransaction = false
        return res.status(409).json({ success: false, message: 'La defensa debe cancelarse antes de retirar la confirmación.' })
      }
    }
    await client.query(
      `UPDATE confirmaciones_defensa SET vigente = FALSE
        WHERE id_monografia = $1 AND vigente = TRUE`,
      [idMonografia]
    )
    await client.query(
      `INSERT INTO confirmaciones_defensa
         (id_monografia, id_usuario_tutor, id_protocolo, confirmada, vigente)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [idMonografia, user.id_usuario, readiness.id_protocolo_actual, req.body.confirmada]
    )
    await client.query('COMMIT'); inTransaction = false
    return res.json({ success: true, confirmada: req.body.confirmada, message: 'Se registró la confirmación del tutor.' })
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK')
    console.error('Error al registrar confirmación de defensa:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo registrar la confirmación.' })
  } finally {
    client.release()
  }
}

export async function crearDefensa(req: Request, res: Response) {
  const idCoordinador = req.authUser?.rol === 'COORDINADOR' ? req.authUser.id_usuario : null
  if (!idCoordinador) return res.status(403).json({ success: false, message: 'Solo coordinación puede programar defensas.' })
  const idMonografia = parseMonografiaId(req.body?.id_monografia)
  const input = validateInput(req.body || {})
  if (!idMonografia) return res.status(400).json({ success: false, message: 'El identificador de monografía no es válido.' })
  if (!input) return res.status(400).json({ success: false, message: 'Revisa fecha futura, hora, lugar y observaciones.' })

  const client = await pool.connect()
  let inTransaction = false
  try {
    await client.query('BEGIN'); inTransaction = true
    const readiness = await checkReadiness(client, idMonografia)
    if (!readiness) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(404).json({ success: false, message: 'La monografía no existe.' })
    }
    if (!readiness.id_tutor || readiness.estado_protocolo !== 'APROBADO' || readiness.rol_tutor !== 'TUTOR' || readiness.tutor_activo !== true) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'La monografía debe tener tutor asignado y protocolo aprobado.' })
    }
    if (!hasCurrentReadiness(readiness)) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'El tutor asignado debe confirmar que la monografía está lista para defensa.' })
    }
    const existingDefense = await client.query(
      `SELECT id_defensa, estado, fecha, hora, lugar, observaciones
         FROM defensas WHERE id_monografia = $1
        ORDER BY id_defensa DESC FOR UPDATE`,
      [idMonografia]
    )
    if (existingDefense.rows.some(row => row.estado === 'PROGRAMADA')) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'La monografía ya tiene una defensa programada.' })
    }
    if (existingDefense.rows.some(row => row.estado === 'REALIZADA')) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'No se puede programar otra defensa para una monografía cuya defensa ya fue realizada.' })
    }
    const result = await client.query(
      `INSERT INTO defensas (id_monografia, fecha, hora, lugar, observaciones)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_defensa, id_monografia, fecha, hora, lugar, estado, observaciones`,
      [idMonografia, input.fecha, input.hora, input.lugar, input.observaciones]
    )
    const reprogramacion = existingDefense.rows[0]
    await client.query(
      `INSERT INTO historial_defensas
         (id_defensa, id_monografia, id_usuario_coordinador, accion, detalle)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        result.rows[0].id_defensa,
        idMonografia,
        idCoordinador,
        reprogramacion ? 'REPROGRAMADA' : 'PROGRAMADA',
        JSON.stringify({
          nueva: input,
          defensa_anterior_id: reprogramacion?.id_defensa ?? null,
          defensa_anterior_estado: reprogramacion?.estado ?? null,
        }),
      ]
    )
    await client.query('COMMIT'); inTransaction = false
    return res.status(201).json({ success: true, defensa: result.rows[0] })
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK')
    const code = (error as { code?: string }).code
    if (code === '23505') return res.status(409).json({ success: false, message: 'La monografía ya tiene una defensa registrada.' })
    console.error('Error al programar defensa:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo programar la defensa.' })
  } finally { client.release() }
}

export async function modificarDefensa(req: Request, res: Response) {
  const idCoordinador = req.authUser?.rol === 'COORDINADOR' ? req.authUser.id_usuario : null
  if (!idCoordinador) return res.status(403).json({ success: false, message: 'Solo coordinación puede modificar defensas.' })
  const idDefensa = parseMonografiaId(req.params.id_defensa)
  const input = validateInput(req.body || {})
  if (!idDefensa) return res.status(400).json({ success: false, message: 'El identificador de defensa no es válido.' })
  if (!input) return res.status(400).json({ success: false, message: 'Revisa fecha futura, hora, lugar y observaciones.' })

  const client = await pool.connect()
  let inTransaction = false
  try {
    await client.query('BEGIN'); inTransaction = true
    const existing = await client.query(
      `SELECT id_monografia FROM defensas WHERE id_defensa = $1`,
      [idDefensa]
    )
    if (!existing.rowCount) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(404).json({ success: false, message: 'La defensa no existe.' })
    }
    const readiness = await checkReadiness(client, Number(existing.rows[0].id_monografia))
    if (!hasCurrentReadiness(readiness)) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'No se puede reprogramar: se requiere protocolo aprobado y confirmación vigente del tutor asignado.' })
    }
    const current = await client.query(
      `SELECT id_monografia, fecha, hora, lugar, observaciones, estado
         FROM defensas WHERE id_defensa = $1 FOR UPDATE`,
      [idDefensa]
    )
    if (!current.rowCount || current.rows[0].estado !== 'PROGRAMADA') {
      await client.query('ROLLBACK'); inTransaction = false
      if (!current.rowCount) return res.status(404).json({ success: false, message: 'La defensa no existe.' })
      return res.status(409).json({ success: false, message: 'Solo se pueden modificar defensas programadas.' })
    }
    const result = await client.query(
      `UPDATE defensas SET fecha = $1, hora = $2, lugar = $3, observaciones = $4
        WHERE id_defensa = $5 AND estado = 'PROGRAMADA'
        RETURNING id_defensa, id_monografia, fecha, hora, lugar, estado, observaciones`,
      [input.fecha, input.hora, input.lugar, input.observaciones, idDefensa]
    )
    if (!result.rowCount) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'La defensa cambió de estado y ya no se puede modificar.' })
    }
    await client.query(
      `INSERT INTO historial_defensas
         (id_defensa, id_monografia, id_usuario_coordinador, accion, detalle)
       VALUES ($1, $2, $3, 'MODIFICADA', $4::jsonb)`,
      [
        idDefensa,
        Number(existing.rows[0].id_monografia),
        idCoordinador,
        JSON.stringify({
          anterior: {
            fecha: current.rows[0].fecha,
            hora: current.rows[0].hora,
            lugar: current.rows[0].lugar,
            observaciones: current.rows[0].observaciones,
          },
          nuevo: input,
        }),
      ]
    )
    await client.query('COMMIT'); inTransaction = false
    return res.json({ success: true, defensa: result.rows[0] })
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK')
    console.error('Error al modificar defensa:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo modificar la defensa.' })
  } finally { client.release() }
}

export async function cancelarDefensa(req: Request, res: Response) {
  const idCoordinador = req.authUser?.rol === 'COORDINADOR' ? req.authUser.id_usuario : null
  if (!idCoordinador) return res.status(403).json({ success: false, message: 'Solo coordinación puede cancelar defensas.' })
  const idDefensa = parseMonografiaId(req.params.id_defensa)
  if (!idDefensa) return res.status(400).json({ success: false, message: 'El identificador de defensa no es válido.' })
  const client = await pool.connect()
  let inTransaction = false
  try {
    await client.query('BEGIN'); inTransaction = true
    const relation = await client.query(
      `SELECT id_monografia FROM defensas WHERE id_defensa = $1`,
      [idDefensa]
    )
    if (!relation.rowCount) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(404).json({ success: false, message: 'La defensa no existe.' })
    }
    await client.query(
      `SELECT id_monografia FROM monografias WHERE id_monografia = $1 FOR UPDATE`,
      [relation.rows[0].id_monografia]
    )
    const existing = await client.query(
      `SELECT id_monografia, fecha, hora, lugar, observaciones, estado
         FROM defensas WHERE id_defensa = $1 FOR UPDATE`,
      [idDefensa]
    )
    if (!existing.rowCount || existing.rows[0].estado !== 'PROGRAMADA') {
      await client.query('ROLLBACK'); inTransaction = false
      if (!existing.rowCount) return res.status(404).json({ success: false, message: 'La defensa no existe.' })
      return res.status(409).json({ success: false, message: 'Solo se pueden cancelar defensas programadas.' })
    }
    const result = await client.query(
      `UPDATE defensas SET estado = 'CANCELADA'
        WHERE id_defensa = $1 AND estado = 'PROGRAMADA'
        RETURNING id_defensa, id_monografia, fecha, hora, lugar, estado, observaciones`,
      [idDefensa]
    )
    if (!result.rowCount) {
      await client.query('ROLLBACK'); inTransaction = false
      return res.status(409).json({ success: false, message: 'La defensa cambió de estado y ya no se puede cancelar.' })
    }
    await client.query(
      `INSERT INTO historial_defensas
         (id_defensa, id_monografia, id_usuario_coordinador, accion, detalle)
       VALUES ($1, $2, $3, 'CANCELADA', $4::jsonb)`,
      [
        idDefensa,
        Number(existing.rows[0].id_monografia),
        idCoordinador,
        JSON.stringify({
          anterior: {
            fecha: existing.rows[0].fecha,
            hora: existing.rows[0].hora,
            lugar: existing.rows[0].lugar,
            observaciones: existing.rows[0].observaciones,
            estado: existing.rows[0].estado,
          },
          nuevo_estado: 'CANCELADA',
        }),
      ]
    )
    await client.query('COMMIT'); inTransaction = false
    return res.json({ success: true, defensa: result.rows[0], message: 'Defensa cancelada.' })
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK')
    console.error('Error al cancelar defensa:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudo cancelar la defensa.' })
  } finally { client.release() }
}
