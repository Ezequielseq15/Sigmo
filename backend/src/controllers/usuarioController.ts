import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import pool from '../config/database'

export const getPerfil = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_usuario } = req.params

    const result = await pool.query(
      `
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.correo,
        u.rol,
        u.foto_perfil,
        e.carnet,
        c.nombre AS carrera
      FROM usuarios u
      LEFT JOIN estudiantes e
        ON u.id_usuario = e.id_usuario
      LEFT JOIN carreras c
        ON e.id_carrera = c.id_carrera
      WHERE u.id_usuario = $1
      `,
      [id_usuario]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      })
    }

    return res.json({
      success: true,
      usuario: result.rows[0],
    })
  } catch (error) {
    console.error(
      'Error al obtener perfil:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'No se pudo obtener el perfil',
    })
  }
}

export const uploadFotoPerfil = async (
  req: Request,
  res: Response
) => {
  try {
    const { id_usuario } = req.params

    console.log(
      'ID usuario:',
      id_usuario
    )

    console.log(
      'Archivo recibido:',
      req.file
    )

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar una imagen',
      })
    }

    const usuarioResult = await pool.query(
      `
      SELECT foto_perfil
      FROM usuarios
      WHERE id_usuario = $1
      `,
      [id_usuario]
    )

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      })
    }

    const fotoAnterior =
      usuarioResult.rows[0].foto_perfil

    const archivo = req.file

    /*
     * Ruta que se guarda en PostgreSQL.
     */
    const rutaFoto =
      `/uploads/perfiles/${archivo.filename}`

    /*
     * Actualizar primero la base de datos.
     */
    await pool.query(
      `
      UPDATE usuarios
      SET foto_perfil = $1
      WHERE id_usuario = $2
      `,
      [
        rutaFoto,
        id_usuario,
      ]
    )

    /*
     * Eliminar la fotografía anterior
     * después de actualizar la nueva.
     */
    if (fotoAnterior) {
      const rutaAnterior = path.join(
        process.cwd(),
        fotoAnterior.replace(
          '/uploads/',
          'uploads/'
        )
      )

      console.log(
        'Foto anterior:',
        rutaAnterior
      )

      if (
        fs.existsSync(rutaAnterior)
      ) {
        fs.unlinkSync(rutaAnterior)

        console.log(
          'Foto anterior eliminada'
        )
      }
    }

    console.log(
      'Nueva foto:',
      rutaFoto
    )

    return res.json({
      success: true,
      message:
        'Foto de perfil actualizada correctamente',
      foto_perfil: rutaFoto,
    })
  } catch (error) {
    console.error(
      'Error al subir foto de perfil:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'No se pudo actualizar la foto de perfil',
    })
  }
}