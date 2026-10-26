import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { PoolClient } from 'pg'
import pool from '../config/database'

async function removeUploadedFile(filePath?: string): Promise<void> {
  if (!filePath) return
  try {
    await fs.promises.unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('No se pudo limpiar un archivo de avance temporal.')
    }
  }
}

async function isPdfFile(filePath: string): Promise<boolean> {
  const handle = await fs.promises.open(filePath, 'r')
  try {
    const signature = Buffer.alloc(1024)
    const { bytesRead } = await handle.read(signature, 0, signature.length, 0)
    return signature.subarray(0, bytesRead).includes(Buffer.from('%PDF-', 'ascii'))
  } finally {
    await handle.close()
  }
}

export const getAvancesByMonografia = async (
  req: Request,
  res: Response
) => {
  try {
    const idMonografia = Number(req.params.id_monografia)

    if (!Number.isInteger(idMonografia) || idMonografia <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la monografía no es válido.',
      })
    }

    const result = await pool.query(
      `
      SELECT
        a.id_avance,
        a.id_monografia,
        a.id_etapa,
        a.descripcion,
        a.estado,
        a.fecha_entrega,
        a.enviado_por,
        ue.nombre AS enviado_por_nombre,
        ue.apellido AS enviado_por_apellido,
        a.comentario_tutor,
        a.fecha_revision,
        a.revisado_por,
        ur.nombre AS revisado_por_nombre,
        ur.apellido AS revisado_por_apellido,
        e.nombre AS etapa_nombre
      FROM avances a
      INNER JOIN etapas_monografia e
        ON e.id_etapa = a.id_etapa
      LEFT JOIN usuarios ue
        ON ue.id_usuario = a.enviado_por
      LEFT JOIN usuarios ur
        ON ur.id_usuario = a.revisado_por
      WHERE a.id_monografia = $1
      ORDER BY a.fecha_entrega DESC, a.id_avance DESC
      `,
      [idMonografia]
    )

    return res.json({
      success: true,
      total: result.rows.length,
      avances: result.rows,
    })
  } catch (error) {
    console.error('Error al obtener avances:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudieron obtener los avances.',
    })
  }
}

export const getEtapasAvance = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id_etapa, nombre, orden
         FROM etapas_monografia
        ORDER BY orden ASC, id_etapa ASC`
    )
    return res.json({ success: true, etapas: result.rows })
  } catch (error) {
    console.error('No se pudieron cargar las etapas de avance:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({ success: false, message: 'No se pudieron cargar las etapas de avance.' })
  }
}

export const createAvance = async (
  req: Request,
  res: Response
) => {
  const {
    id_monografia,
    id_etapa,
    descripcion,
  } = req.body

  const idMonografia = Number(id_monografia)
  const idEtapa = Number(id_etapa)
  const idUsuarioEnvio = req.authUser!.id_usuario

  const descripcionNormalizada =
    typeof descripcion === 'string'
      ? descripcion.trim()
      : ''

  if (
    !Number.isInteger(idMonografia) ||
    idMonografia <= 0 ||
    !Number.isInteger(idEtapa) ||
    idEtapa <= 0 ||
    !Number.isInteger(idUsuarioEnvio) ||
    idUsuarioEnvio <= 0 ||
    !descripcionNormalizada
  ) {
    return res.status(400).json({
      success: false,
      message:
        'La monografía, la etapa, el remitente y una descripción válida son obligatorios.',
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const monografiaResult = await client.query(
      `
      SELECT
        m.id_monografia,
        m.id_estudiante,
        m.estado_propuesta,
        (
          SELECT p.estado
          FROM protocolos_monografia p
          WHERE p.id_monografia = m.id_monografia
          ORDER BY p.numero_version DESC
          LIMIT 1
        ) AS estado_ultimo_protocolo
      FROM monografias m
      WHERE m.id_monografia = $1
      FOR UPDATE
      `,
      [idMonografia]
    )

    if (monografiaResult.rowCount === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'La monografía no existe.',
      })
    }

    const monografia = monografiaResult.rows[0]

    const estadoPropuesta = String(
      monografia.estado_propuesta || ''
    ).trim().toUpperCase()

    const estadoProtocolo = String(
      monografia.estado_ultimo_protocolo || ''
    ).trim().toUpperCase()

    if (
      estadoPropuesta !== 'APROBADO' ||
      estadoProtocolo !== 'APROBADO'
    ) {
      await client.query('ROLLBACK')

      return res.status(403).json({
        success: false,
        code: 'PROTOCOLO_NO_APROBADO',
        message:
          'No puedes registrar avances hasta que la propuesta y la última versión del protocolo estén aprobadas.',
        estado_propuesta: estadoPropuesta || 'SIN_ESTADO',
        estado_protocolo: estadoProtocolo || 'SIN_PROTOCOLO',
      })
    }

    const integranteResult = await client.query(
      `
      SELECT 1
      FROM monografias m
      WHERE m.id_monografia = $1
        AND (
          EXISTS (
            SELECT 1
            FROM estudiantes e
            WHERE e.id_estudiante = m.id_estudiante
              AND e.id_usuario = $2
          )
          OR EXISTS (
            SELECT 1
            FROM monografia_estudiantes me
            INNER JOIN estudiantes e
              ON e.id_estudiante = me.id_estudiante
            WHERE me.id_monografia = m.id_monografia
              AND e.id_usuario = $2
          )
        )
      LIMIT 1
      `,
      [idMonografia, idUsuarioEnvio]
    )

    if (integranteResult.rowCount === 0) {
      await client.query('ROLLBACK')

      return res.status(403).json({
        success: false,
        message:
          'Solo un integrante de la monografía puede registrar un avance.',
      })
    }

    const etapaResult = await client.query(
      `
      SELECT id_etapa
      FROM etapas_monografia
      WHERE id_etapa = $1
      `,
      [idEtapa]
    )

    if (etapaResult.rowCount === 0) {
      await client.query('ROLLBACK')

      return res.status(400).json({
        success: false,
        message: 'La etapa seleccionada no existe.',
      })
    }

    const numeroResult = await client.query(
      `SELECT COALESCE(MAX(numero_avance), 0) + 1 AS siguiente_numero
         FROM avances WHERE id_monografia = $1`,
      [idMonografia]
    )
    const numeroAvance = Number(numeroResult.rows[0]?.siguiente_numero)

    const avanceResult = await client.query(
      `
      INSERT INTO avances (
        id_monografia,
        id_etapa,
        numero_avance,
        descripcion,
        estado,
        fecha_entrega,
        enviado_por
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'PENDIENTE',
        CURRENT_TIMESTAMP,
        $5
      )
      RETURNING *
      `,
      [
        idMonografia,
        idEtapa,
        numeroAvance,
        descripcionNormalizada,
        idUsuarioEnvio,
      ]
    )

    await client.query('COMMIT')

    return res.status(201).json({
      success: true,
      message: 'Avance registrado correctamente.',
      avance: avanceResult.rows[0],
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al registrar avance:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo registrar el avance.',
    })
  } finally {
    client.release()
  }
}

export const createAvanceWithDocument = async (
  req: Request,
  res: Response
) => {
  const archivo = req.file
  const idMonografia = Number(req.body?.id_monografia)
  const idEtapa = Number(req.body?.id_etapa)
  const descripcion = typeof req.body?.descripcion === 'string'
    ? req.body.descripcion.trim()
    : ''
  const idUsuarioEnvio = req.authUser?.id_usuario

  if (!archivo) {
    return res.status(400).json({ success: false, message: 'Debes adjuntar un archivo PDF.' })
  }

  if (
    !Number.isInteger(idMonografia) || idMonografia <= 0 ||
    !Number.isInteger(idEtapa) || idEtapa <= 0 ||
    typeof idUsuarioEnvio !== 'number' || !Number.isInteger(idUsuarioEnvio) || idUsuarioEnvio <= 0 ||
    !descripcion
  ) {
    await removeUploadedFile(archivo.path)
    return res.status(400).json({
      success: false,
      message: 'La monografía, la etapa y una descripción válida son obligatorias.',
    })
  }

  try {
    if (!(await isPdfFile(archivo.path))) {
      await removeUploadedFile(archivo.path)
      return res.status(400).json({ success: false, message: 'El archivo no contiene un PDF válido.' })
    }
  } catch {
    await removeUploadedFile(archivo.path)
    return res.status(400).json({ success: false, message: 'No se pudo validar el archivo PDF.' })
  }

  let client: PoolClient | undefined
  let transactionStarted = false

  try {
    client = await pool.connect()
    await client.query('BEGIN')
    transactionStarted = true

    const reject = async (status: number, message: string, code?: string) => {
      await client!.query('ROLLBACK')
      transactionStarted = false
      await removeUploadedFile(archivo.path)
      return res.status(status).json({ success: false, message, ...(code ? { code } : {}) })
    }

    const monografiaResult = await client.query(
      `SELECT
         m.id_monografia,
         m.id_estudiante,
         m.estado_propuesta,
         (SELECT p.estado
          FROM protocolos_monografia p
          WHERE p.id_monografia = m.id_monografia
          ORDER BY p.numero_version DESC
          LIMIT 1) AS estado_ultimo_protocolo
       FROM monografias m
       WHERE m.id_monografia = $1
       FOR UPDATE`,
      [idMonografia]
    )

    if (monografiaResult.rowCount === 0) {
      return reject(404, 'La monografía no existe.')
    }

    const monografia = monografiaResult.rows[0]
    const estadoPropuesta = String(monografia.estado_propuesta || '').trim().toUpperCase()
    const estadoProtocolo = String(monografia.estado_ultimo_protocolo || '').trim().toUpperCase()

    if (estadoPropuesta !== 'APROBADO' || estadoProtocolo !== 'APROBADO') {
      return reject(
        403,
        'No puedes registrar avances hasta que la propuesta y la última versión del protocolo estén aprobadas.',
        'PROTOCOLO_NO_APROBADO'
      )
    }

    const integranteResult = await client.query(
      `SELECT 1
       FROM monografias m
       WHERE m.id_monografia = $1
         AND (
           EXISTS (
             SELECT 1 FROM estudiantes e
             WHERE e.id_estudiante = m.id_estudiante AND e.id_usuario = $2
           )
           OR EXISTS (
             SELECT 1
             FROM monografia_estudiantes me
             JOIN estudiantes e ON e.id_estudiante = me.id_estudiante
             WHERE me.id_monografia = m.id_monografia AND e.id_usuario = $2
           )
         )
       LIMIT 1`,
      [idMonografia, idUsuarioEnvio]
    )

    if (integranteResult.rowCount === 0) {
      return reject(403, 'Solo un integrante de la monografía puede registrar un avance.')
    }

    const etapaResult = await client.query(
      'SELECT 1 FROM etapas_monografia WHERE id_etapa = $1',
      [idEtapa]
    )
    if (etapaResult.rowCount === 0) {
      return reject(400, 'La etapa seleccionada no existe.')
    }

    const numeroResult = await client.query(
      `SELECT COALESCE(MAX(numero_avance), 0) + 1 AS siguiente_numero
         FROM avances WHERE id_monografia = $1`,
      [idMonografia]
    )
    const numeroAvance = Number(numeroResult.rows[0]?.siguiente_numero)

    const avanceResult = await client.query(
      `INSERT INTO avances (
         id_monografia, id_etapa, numero_avance, descripcion, estado, fecha_entrega, enviado_por
       ) VALUES ($1, $2, $3, $4, 'PENDIENTE', CURRENT_TIMESTAMP, $5)
       RETURNING *`,
      [idMonografia, idEtapa, numeroAvance, descripcion, idUsuarioEnvio]
    )

    const rutaArchivo = `/uploads/avances/${archivo.filename}`
    const documentoResult = await client.query(
      `INSERT INTO documentos (
         id_avance, nombre_archivo, nombre_original, ruta_archivo,
         tipo_archivo, tamano_bytes, fecha_subida
       ) VALUES ($1, $2, $3, $4, 'application/pdf', $5, CURRENT_TIMESTAMP)
       RETURNING id_documento, id_avance, nombre_archivo, nombre_original, tipo_archivo, tamano_bytes, fecha_subida`,
      [
        avanceResult.rows[0].id_avance,
        archivo.filename,
        path.basename(archivo.originalname),
        rutaArchivo,
        archivo.size,
      ]
    )

    await client.query('COMMIT')
    transactionStarted = false

    return res.status(201).json({
      success: true,
      message: 'Avance y documento registrados correctamente.',
      avance: avanceResult.rows[0],
      documento: documentoResult.rows[0],
    })
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // Mantener el error de respuesta genérico incluso si falla el rollback.
      }
    }
    await removeUploadedFile(archivo.path)
    console.error('No se pudo registrar el avance y su documento:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(500).json({
      success: false,
      message: 'No se pudo registrar el avance y su documento.',
    })
  } finally {
    client?.release()
  }
}

export const revisarAvance = async (
  req: Request,
  res: Response
) => {
  const idAvance = Number(req.params.id_avance)

  const {
    estado,
    comentario_tutor,
  } = req.body

  const idUsuarioRevision = req.authUser!.id_usuario

  if (!Number.isInteger(idAvance) || idAvance <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El ID del avance no es válido.',
    })
  }

  if (
    !Number.isInteger(idUsuarioRevision) ||
    idUsuarioRevision <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'No se identificó al tutor que realiza la revisión.',
    })
  }

  const estadoNormalizado = String(estado || '')
    .trim()
    .toUpperCase()

  if (!['APROBADO', 'RECHAZADO'].includes(estadoNormalizado)) {
    return res.status(400).json({
      success: false,
      message: 'El estado debe ser APROBADO o RECHAZADO.',
    })
  }

  const comentario =
    typeof comentario_tutor === 'string'
      ? comentario_tutor.trim()
      : ''

  if (
    estadoNormalizado === 'RECHAZADO' &&
    !comentario
  ) {
    return res.status(400).json({
      success: false,
      message: 'Debes indicar el motivo del rechazo.',
    })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const avanceResult = await client.query(
      `
      SELECT
        a.id_avance,
        a.id_monografia,
        a.estado,
        m.titulo AS titulo_monografia,
        m.id_estudiante,
        t.id_usuario AS id_usuario_tutor
      FROM avances a
      INNER JOIN monografias m
        ON m.id_monografia = a.id_monografia
      LEFT JOIN tutores t
        ON t.id_tutor = m.id_tutor
      WHERE a.id_avance = $1
      FOR UPDATE OF m, a
      `,
      [idAvance]
    )

    if (avanceResult.rowCount === 0) {
      await client.query('ROLLBACK')

      return res.status(404).json({
        success: false,
        message: 'Avance no encontrado.',
      })
    }

    const avance = avanceResult.rows[0]

    if (
      Number(avance.id_usuario_tutor) !== idUsuarioRevision
    ) {
      await client.query('ROLLBACK')

      return res.status(403).json({
        success: false,
        message:
          'Solo el tutor asignado puede revisar este avance.',
      })
    }

    if (
      String(avance.estado || '').toUpperCase() !== 'PENDIENTE'
    ) {
      await client.query('ROLLBACK')

      return res.status(409).json({
        success: false,
        message:
          'Este avance ya fue revisado. No se puede modificar su resultado.',
        estado_actual: avance.estado,
      })
    }

    const updateResult = await client.query(
      `
      UPDATE avances
      SET
        estado = $1,
        comentario_tutor = $2,
        fecha_revision = CURRENT_TIMESTAMP,
        revisado_por = $3
      WHERE id_avance = $4
        AND UPPER(estado) = 'PENDIENTE'
      RETURNING *
      `,
      [
        estadoNormalizado,
        comentario || null,
        idUsuarioRevision,
        idAvance,
      ]
    )

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK')

      return res.status(409).json({
        success: false,
        message:
          'El avance ya fue revisado por otro proceso.',
      })
    }

    const integrantesResult = await client.query(
      `
      SELECT DISTINCT u.id_usuario
      FROM usuarios u
      WHERE u.id_usuario = (
        SELECT e.id_usuario
        FROM estudiantes e
        WHERE e.id_estudiante = $2
      )
      OR u.id_usuario IN (
        SELECT e.id_usuario
        FROM monografia_estudiantes me
        INNER JOIN estudiantes e
          ON e.id_estudiante = me.id_estudiante
        WHERE me.id_monografia = $1
      )
      `,
      [
        avance.id_monografia,
        avance.id_estudiante,
      ]
    )

    const tituloNotificacion =
      estadoNormalizado === 'APROBADO'
        ? 'Avance aprobado'
        : 'Avance rechazado'

    const mensajeNotificacion =
      estadoNormalizado === 'APROBADO'
        ? `El avance #${idAvance} de la monografía "${avance.titulo_monografia}" fue aprobado por el tutor.${comentario ? ` Comentario: ${comentario}` : ''}`
        : `El avance #${idAvance} de la monografía "${avance.titulo_monografia}" fue rechazado por el tutor. Observaciones: ${comentario}`

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
          ? 'Avance aprobado correctamente.'
          : 'Avance rechazado correctamente.',
      avance: updateResult.rows[0],
      notificaciones_enviadas: integrantesResult.rows.length,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error al revisar avance:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo revisar el avance.',
    })
  } finally {
    client.release()
  }
}
