import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { PoolClient } from 'pg'
import pool from '../config/database'

const estadosRevision = ['APROBADO', 'RECHAZADO']

function eliminarArchivo(ruta?: string) {
  if (ruta && fs.existsSync(ruta)) {
    fs.unlinkSync(ruta)
  }
}

function obtenerRutaRelativa(nombreArchivo: string) {
  return path.join('uploads', 'protocolos', nombreArchivo)
}

async function notificarIntegrantes(
  idMonografia: number,
  titulo: string,
  mensaje: string,
  tipo: string
) {
  await pool.query(
    `INSERT INTO notificaciones
      (id_usuario, titulo, mensaje, tipo)
     SELECT DISTINCT e.id_usuario, $2, $3, $4
     FROM monografia_estudiantes me
     JOIN estudiantes e ON e.id_estudiante = me.id_estudiante
     WHERE me.id_monografia = $1`,
    [idMonografia, titulo, mensaje, tipo]
  )
}

/**
 * POST /api/protocolos
 * multipart/form-data: titulo, descripcion, id_ciclo,
 * integrantes (opcional: JSON con IDs de estudiantes), archivo (PDF).
 * El estudiante remitente y su carrera se obtienen de la sesión autenticada.
 */
export async function crearPropuesta(req: Request, res: Response) {
  const archivo = req.file

  if (!archivo) {
    return res.status(400).json({
      success: false,
      message: 'Debes adjuntar el protocolo en PDF.',
    })
  }

  const {
    titulo,
    descripcion,
    id_ciclo,
  } = req.body

  const idUsuarioEnvio = req.authUser!.id_usuario
  const tituloNormalizado = typeof titulo === 'string' ? titulo.trim() : ''
  const descripcionNormalizada = typeof descripcion === 'string' ? descripcion.trim() : ''

  if (
    !tituloNormalizado ||
    !id_ciclo ||
    !idUsuarioEnvio
  ) {
    eliminarArchivo(archivo.path)

    return res.status(400).json({
      success: false,
      message:
        'El título y el ciclo académico son obligatorios.',
    })
  }

  let integrantes: number[] = []

  try {
    if (req.body.integrantes) {
      const valor = JSON.parse(req.body.integrantes)

      if (!Array.isArray(valor)) {
        throw new Error('El campo integrantes debe ser una lista.')
      }

      integrantes = valor.map(Number)

      if (integrantes.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new Error('La lista de integrantes contiene IDs inválidos.')
      }
    }
  } catch (error) {
    eliminarArchivo(archivo.path)

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'El campo integrantes no es válido.',
    })
  }

  const idCiclo = Number(id_ciclo)

  if (!Number.isInteger(idCiclo) || idCiclo <= 0) {
    eliminarArchivo(archivo.path)

    return res.status(400).json({
      success: false,
      message: 'El ciclo académico seleccionado no es válido.',
    })
  }

  let client: PoolClient | undefined
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const estudianteResult = await client.query(
      `SELECT e.id_estudiante, e.id_carrera
       FROM estudiantes e
       JOIN usuarios u ON u.id_usuario = e.id_usuario
       WHERE u.id_usuario = $1 AND u.rol = 'ESTUDIANTE' AND u.activo = TRUE`,
      [idUsuarioEnvio]
    )

    if (estudianteResult.rowCount === 0) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)
      return res.status(403).json({ success: false, message: 'La cuenta no tiene un perfil de estudiante activo.' })
    }

    const idEstudiante = Number(estudianteResult.rows[0].id_estudiante)
    const idCarrera = Number(estudianteResult.rows[0].id_carrera)
    const cicloResult = await client.query(
      'SELECT 1 FROM ciclos_academicos WHERE id_ciclo = $1 AND activo = TRUE',
      [idCiclo]
    )
    if (cicloResult.rowCount === 0) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)
      return res.status(400).json({ success: false, message: 'El ciclo académico no existe o está inactivo.' })
    }

    if (integrantes.length > 2) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)
      return res.status(400).json({ success: false, message: 'Se permiten hasta dos integrantes adicionales.' })
    }

    const miembrosAdicionales = [...new Set(integrantes)]
    if (miembrosAdicionales.length !== integrantes.length || miembrosAdicionales.includes(idEstudiante)) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)
      return res.status(400).json({ success: false, message: 'La lista de integrantes contiene duplicados o al remitente.' })
    }

    if (miembrosAdicionales.length > 0) {
      const integrantesResult = await client.query(
        `SELECT e.id_estudiante
         FROM estudiantes e
         JOIN usuarios u ON u.id_usuario = e.id_usuario
         WHERE e.id_estudiante = ANY($1::integer[])
           AND e.id_carrera = $2
           AND u.rol = 'ESTUDIANTE' AND u.activo = TRUE`,
        [miembrosAdicionales, idCarrera]
      )
      if (integrantesResult.rowCount !== miembrosAdicionales.length) {
        await client.query('ROLLBACK')
        eliminarArchivo(archivo.path)
        return res.status(400).json({ success: false, message: 'Todos los integrantes deben ser estudiantes activos de tu carrera.' })
      }
    }
    const miembros = [idEstudiante, ...miembrosAdicionales]

    // Serializa registros con el mismo título para evitar duplicados simultáneos.
    // Se normalizan mayúsculas, minúsculas y espacios repetidos.
    await client.query(
      `SELECT pg_advisory_xact_lock(
         hashtext(lower(regexp_replace(btrim($1), '[[:space:]]+', ' ', 'g')))
       )`,
      [tituloNormalizado]
    )

    // Una propuesta se registra como monografía y su protocolo se vincula
    // mediante id_monografia; por eso esta consulta cubre ambos casos.
    const duplicado = await client.query(
      `SELECT m.id_monografia, m.titulo
       FROM monografias m
       WHERE lower(regexp_replace(btrim(m.titulo), '[[:space:]]+', ' ', 'g')) =
             lower(regexp_replace(btrim($1), '[[:space:]]+', ' ', 'g'))
       LIMIT 1`,
      [tituloNormalizado]
    )

    if (duplicado.rowCount && duplicado.rowCount > 0) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)

      return res.status(409).json({
        success: false,
        code: 'MONOGRAFIA_DUPLICADA',
        message:
          'Ya existe una monografía o propuesta de protocolo con ese título. Verifica el nombre antes de registrar una nueva propuesta.',
        id_monografia_existente: Number(duplicado.rows[0].id_monografia),
      })
    }

    const resultado = await client.query(
      `INSERT INTO monografias
        (
          id_estudiante,
          id_carrera,
          id_ciclo,
          titulo,
          descripcion,
          estado,
          estado_propuesta
        )
       VALUES ($1, $2, $3, $4, $5, 'PENDIENTE', 'PENDIENTE')
       RETURNING id_monografia, titulo`,
      [
        idEstudiante,
        idCarrera,
        idCiclo,
        tituloNormalizado,
        descripcionNormalizada || null,
      ]
    )

    const monografia = resultado.rows[0]
    const idMonografia = Number(monografia.id_monografia)

    for (const idMiembro of miembros) {
      await client.query(
        `INSERT INTO monografia_estudiantes
          (id_monografia, id_estudiante)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [idMonografia, idMiembro]
      )
    }

    await client.query(
      `INSERT INTO protocolos_monografia
        (
          id_monografia,
          numero_version,
          nombre_archivo,
          nombre_original,
          ruta_archivo,
          tipo_archivo,
          tamano_bytes,
          estado,
          enviado_por
        )
       VALUES ($1, 1, $2, $3, $4, $5, $6, 'PENDIENTE', $7)`,
      [
        idMonografia,
        archivo.filename,
        archivo.originalname,
        obtenerRutaRelativa(archivo.filename),
        archivo.mimetype,
        archivo.size,
        idUsuarioEnvio,
      ]
    )

    await client.query('COMMIT')

    try {
      await notificarIntegrantes(
        idMonografia,
        'Propuesta registrada',
        `La propuesta "${monografia.titulo}" fue enviada y está pendiente de revisión.`,
        'PROTOCOLO'
      )
    } catch (error) {
      console.error('No se pudo registrar la notificación:', error instanceof Error ? error.name : 'UnknownError')
    }

    return res.status(201).json({
      success: true,
      message: 'Propuesta y protocolo registrados correctamente.',
      id_monografia: idMonografia,
    })
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK') } catch { /* preservar el error original */ }
    }
    eliminarArchivo(archivo.path)

    console.error('Error al registrar propuesta:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message:
        'No se pudo registrar la propuesta. Verifica los datos enviados y las relaciones de la base de datos.',
    })
  } finally {
    client?.release()
  }
}

/**
 * GET /api/protocolos/pendientes
 */
export async function obtenerProtocolosPendientes(
  _req: Request,
  res: Response
) {
  try {
    const resultado = await pool.query(
      `SELECT
         p.id_protocolo,
         p.id_monografia,
         p.numero_version,
         p.nombre_original,
         p.estado AS estado_protocolo,
         p.fecha_subida,
         m.titulo,
         m.descripcion,
         m.estado_propuesta
       FROM protocolos_monografia p
       JOIN monografias m ON m.id_monografia = p.id_monografia
       WHERE p.estado = 'PENDIENTE'
       ORDER BY p.fecha_subida ASC`
    )

    return res.json({
      success: true,
      protocolos: resultado.rows,
    })
  } catch (error) {
    console.error('Error al consultar protocolos pendientes:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudieron consultar los protocolos pendientes.',
    })
  }
}

/**
 * GET /api/protocolos/monografia/:id_monografia
 */
export async function obtenerProtocolosPorMonografia(
  req: Request,
  res: Response
) {
  const idMonografia = Number(req.params.id_monografia)

  if (!Number.isInteger(idMonografia) || idMonografia <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El ID de la monografía no es válido.',
    })
  }

  try {
    const resultado = await pool.query(
      `SELECT
         p.id_protocolo,
         p.id_monografia,
         p.numero_version,
         p.nombre_original,
         p.tipo_archivo,
         p.tamano_bytes,
         p.estado,
         p.comentario_revision,
         p.fecha_subida,
         p.fecha_revision,
         p.enviado_por,
         ue.nombre AS enviado_por_nombre,
         ue.apellido AS enviado_por_apellido,
         p.revisado_por,
         ur.nombre AS revisado_por_nombre,
         ur.apellido AS revisado_por_apellido
       FROM protocolos_monografia p
       LEFT JOIN usuarios ue ON ue.id_usuario = p.enviado_por
       LEFT JOIN usuarios ur ON ur.id_usuario = p.revisado_por
       WHERE p.id_monografia = $1
       ORDER BY p.numero_version DESC`,
      [idMonografia]
    )

    return res.json({
      success: true,
      protocolos: resultado.rows,
    })
  } catch (error) {
    console.error('Error al consultar historial de protocolos:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo consultar el historial de protocolos.',
    })
  }
}

/**
 * GET /api/protocolos/:id_protocolo/descargar
 */
export async function descargarProtocolo(
  req: Request,
  res: Response
) {
  const idProtocolo = Number(req.params.id_protocolo)

  if (!Number.isInteger(idProtocolo) || idProtocolo <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El ID del protocolo no es válido.',
    })
  }

  try {
    const resultado = await pool.query(
      `SELECT nombre_original, ruta_archivo
       FROM protocolos_monografia
       WHERE id_protocolo = $1`,
      [idProtocolo]
    )

    if (resultado.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'El protocolo solicitado no existe.',
      })
    }

    const protocolo = resultado.rows[0]
    const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'protocolos')
    const ruta = path.resolve(process.cwd(), protocolo.ruta_archivo)
    const rutaRelativa = path.relative(uploadsRoot, ruta)

    if (!rutaRelativa || rutaRelativa.startsWith('..') || path.isAbsolute(rutaRelativa)) {
      return res.status(404).json({ success: false, message: 'El archivo del protocolo no está disponible.' })
    }

    if (!fs.existsSync(ruta)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo del protocolo no se encuentra en el servidor.',
      })
    }

    res.setHeader('Cache-Control', 'private, no-store')
    return res.download(ruta, protocolo.nombre_original)
  } catch (error) {
    console.error('Error al descargar protocolo:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo descargar el protocolo.',
    })
  }
}

/**
 * PUT /api/protocolos/:id_protocolo/revisar
 * JSON: { estado: "APROBADO" | "RECHAZADO", comentario_revision?: string }
 * El revisor se obtiene de la sesión autenticada.
 */
export async function revisarProtocolo(
  req: Request,
  res: Response
) {
  const idProtocolo = Number(req.params.id_protocolo)
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const estado = typeof body.estado === 'string' ? body.estado.trim().toUpperCase() : ''
  const comentario = typeof body.comentario_revision === 'string'
    ? body.comentario_revision.trim()
    : ''
  const revisor = req.authUser

  if (!revisor) {
    return res.status(401).json({
      success: false,
      message: 'La sesión es obligatoria para revisar un protocolo.',
    })
  }

  if (revisor.rol !== 'COORDINADOR') {
    return res.status(403).json({
      success: false,
      message: 'Solo un coordinador puede revisar protocolos.',
    })
  }

  const revisadoPor = revisor.id_usuario
  if (!Number.isInteger(revisadoPor) || revisadoPor <= 0) {
    return res.status(401).json({
      success: false,
      message: 'La sesión no contiene un usuario revisor válido.',
    })
  }

  if (!Number.isInteger(idProtocolo) || idProtocolo <= 0) {
    return res.status(400).json({
      success: false,
      message: 'El ID del protocolo no es válido.',
    })
  }

  if (!estadosRevision.includes(estado)) {
    return res.status(400).json({
      success: false,
      message: 'El estado debe ser APROBADO o RECHAZADO.',
    })
  }

  if (estado === 'RECHAZADO' && !comentario) {
    return res.status(400).json({
      success: false,
      message: 'Debes indicar el motivo del rechazo.',
    })
  }

  let client: PoolClient
  try {
    client = await pool.connect()
  } catch {
    console.error('No se pudo abrir una conexión para revisar el protocolo.')
    return res.status(503).json({
      success: false,
      message: 'No se pudo conectar con la base de datos. La revisión no se guardó.',
    })
  }

  let transactionStarted = false

  try {
    await client.query('BEGIN')
    transactionStarted = true

    const revisorResult = await client.query(
      `SELECT id_usuario
       FROM usuarios
       WHERE id_usuario = $1 AND rol = 'COORDINADOR' AND activo = TRUE
       FOR UPDATE`,
      [revisadoPor]
    )

    if (revisorResult.rowCount !== 1) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(403).json({
        success: false,
        message: 'La cuenta ya no tiene permiso para revisar protocolos.',
      })
    }

    const consulta = await client.query(
      `SELECT
         p.id_protocolo,
         p.id_monografia,
         p.estado,
         m.titulo
       FROM protocolos_monografia p
       JOIN monografias m ON m.id_monografia = p.id_monografia
       WHERE p.id_protocolo = $1
       FOR UPDATE OF m, p`,
      [idProtocolo]
    )

    if (consulta.rowCount === 0) {
      await client.query('ROLLBACK')
      transactionStarted = false

      return res.status(404).json({
        success: false,
        message: 'El protocolo no existe.',
      })
    }

    const protocolo = consulta.rows[0]

    if (protocolo.estado !== 'PENDIENTE') {
      await client.query('ROLLBACK')
      transactionStarted = false

      return res.status(409).json({
        success: false,
        message: 'Este protocolo ya fue revisado.',
      })
    }

    const actualizacion = await client.query(
      `UPDATE protocolos_monografia
       SET estado = $1,
           comentario_revision = $2,
           fecha_revision = CURRENT_TIMESTAMP,
           revisado_por = $3
       WHERE id_protocolo = $4 AND estado = 'PENDIENTE'
       RETURNING id_protocolo, revisado_por`,
      [
        estado,
        comentario || null,
        revisadoPor,
        idProtocolo,
      ]
    )

    if (actualizacion.rowCount !== 1) {
      await client.query('ROLLBACK')
      transactionStarted = false
      return res.status(409).json({
        success: false,
        message: 'El protocolo ya fue revisado por otro proceso.',
      })
    }

    if (Number(actualizacion.rows[0].revisado_por) !== revisadoPor) {
      await client.query('ROLLBACK')
      transactionStarted = false
      console.error('La revisión no quedó vinculada al usuario autenticado.')
      return res.status(500).json({
        success: false,
        message: 'No se pudo asociar la revisión con el coordinador autenticado.',
      })
    }

    await client.query(
      `UPDATE monografias
       SET estado = CASE
             WHEN $1 = 'APROBADO' THEN 'EN PROCESO'
             WHEN $1 = 'RECHAZADO' THEN 'RECHAZADA'
             ELSE 'PENDIENTE'
           END,
           estado_propuesta = $1,
           comentario_propuesta = $2,
           fecha_revision_propuesta = CURRENT_TIMESTAMP
       WHERE id_monografia = $3`,
      [estado, comentario || null, protocolo.id_monografia]
    )

    await client.query('COMMIT')
    transactionStarted = false

    try {
      const mensaje =
        estado === 'APROBADO'
          ? `La propuesta "${protocolo.titulo}" fue aprobada.`
          : `La propuesta "${protocolo.titulo}" fue rechazada. Motivo: ${comentario}`

      await notificarIntegrantes(
        Number(protocolo.id_monografia),
        `Propuesta ${estado.toLowerCase()}`,
        mensaje,
        'PROTOCOLO'
      )
    } catch (error) {
      console.error('No se pudo registrar la notificación:', error instanceof Error ? error.name : 'UnknownError')
    }

    return res.json({
      success: true,
      message:
        estado === 'APROBADO'
          ? 'Protocolo aprobado correctamente.'
          : 'Protocolo rechazado. El estudiante puede presentar una nueva versión.',
    })
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // Preservar el error original sin exponer detalles internos.
      }
    }
    console.error('No se pudo guardar la revisión del protocolo:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo guardar la revisión. No se confirmaron los cambios.',
    })
  } finally {
    client.release()
  }
}

/**
 * POST /api/protocolos/monografia/:id_monografia/representar
 * multipart/form-data: archivo (PDF)
 */
export async function representarProtocolo(
  req: Request,
  res: Response
) {
  const idMonografia = Number(req.params.id_monografia)
  const archivo = req.file
  const idUsuarioEnvio = req.authUser!.id_usuario

  if (!Number.isInteger(idMonografia) || idMonografia <= 0) {
    eliminarArchivo(archivo?.path)

    return res.status(400).json({
      success: false,
      message: 'El ID de la monografía no es válido.',
    })
  }

  if (!archivo) {
    return res.status(400).json({
      success: false,
      message: 'Debes adjuntar el protocolo corregido en PDF.',
    })
  }

  let client: PoolClient | undefined
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const monografiaResult = await client.query(
      `SELECT id_monografia, titulo, estado_propuesta
       FROM monografias
       WHERE id_monografia = $1
       FOR UPDATE`,
      [idMonografia]
    )

    if (monografiaResult.rowCount === 0) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)

      return res.status(404).json({
        success: false,
        message: 'La monografía no existe.',
      })
    }

    const ultimaVersion = await client.query(
      `SELECT numero_version, estado
       FROM protocolos_monografia
       WHERE id_monografia = $1
       ORDER BY numero_version DESC
       LIMIT 1`,
      [idMonografia]
    )

    if (
      ultimaVersion.rowCount === 0 ||
      ultimaVersion.rows[0].estado !== 'RECHAZADO'
    ) {
      await client.query('ROLLBACK')
      eliminarArchivo(archivo.path)

      return res.status(409).json({
        success: false,
        message:
          'Solo puedes volver a presentar el protocolo si la última versión fue rechazada.',
      })
    }

    const nuevaVersion =
      Number(ultimaVersion.rows[0].numero_version) + 1

    await client.query(
      `INSERT INTO protocolos_monografia
        (
          id_monografia,
          numero_version,
          nombre_archivo,
          nombre_original,
          ruta_archivo,
          tipo_archivo,
          tamano_bytes,
          estado,
          enviado_por
        )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', $8)`,
      [
        idMonografia,
        nuevaVersion,
        archivo.filename,
        archivo.originalname,
        obtenerRutaRelativa(archivo.filename),
        archivo.mimetype,
        archivo.size,
        idUsuarioEnvio,
      ]
    )

    await client.query(
      `UPDATE monografias
       SET estado = 'PENDIENTE',
           estado_propuesta = 'PENDIENTE',
           comentario_propuesta = NULL,
           fecha_revision_propuesta = NULL
       WHERE id_monografia = $1`,
      [idMonografia]
    )

    await client.query('COMMIT')

    try {
      await notificarIntegrantes(
        idMonografia,
        'Protocolo corregido',
        `Se presentó la versión ${nuevaVersion} del protocolo "${monografiaResult.rows[0].titulo}" para revisión.`,
        'PROTOCOLO'
      )
    } catch (error) {
      console.error('No se pudo registrar la notificación:', error instanceof Error ? error.name : 'UnknownError')
    }

    return res.status(201).json({
      success: true,
      message: 'La nueva versión del protocolo fue enviada a revisión.',
      numero_version: nuevaVersion,
    })
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK') } catch { /* preservar el error original */ }
    }
    eliminarArchivo(archivo.path)
    console.error('Error al representar protocolo:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo volver a presentar el protocolo.',
    })
  } finally {
    client?.release()
  }
}
