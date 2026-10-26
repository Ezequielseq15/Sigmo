import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import pool from '../config/database'

export const getPerfil = async (req: Request, res: Response) => {
  try {
    const { id_usuario } = req.params
    if (Number(id_usuario) !== req.authUser?.id_usuario) {
      return res.status(403).json({ success: false, message: 'No puedes consultar este perfil.' })
    }

    const result = await pool.query(
      `
      SELECT
        u.id_usuario,
        u.nombre,
        u.apellido,
        u.correo,
        u.rol,
        u.foto_perfil,
        e.id_estudiante,
        e.carnet,
        e.id_carrera,
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
    console.error('Error al obtener perfil:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo obtener el perfil',
    })
  }
}

export const uploadFotoPerfil = async (req: Request, res: Response) => {
  try {
    const { id_usuario } = req.params

    if (Number(id_usuario) !== req.authUser?.id_usuario) {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      return res.status(403).json({ success: false, message: 'No puedes modificar este perfil.' })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar una imagen',
      })
    }

    const usuarioResult = await pool.query(
      'SELECT foto_perfil FROM usuarios WHERE id_usuario = $1',
      [id_usuario]
    )

    if (usuarioResult.rows.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      })
    }

    const fotoAnterior = usuarioResult.rows[0].foto_perfil
    const rutaFoto = `/uploads/perfiles/${req.file.filename}`

    await pool.query(
      'UPDATE usuarios SET foto_perfil = $1 WHERE id_usuario = $2',
      [rutaFoto, id_usuario]
    )

    if (fotoAnterior) {
      const rutaAnterior = path.join(
        process.cwd(),
        fotoAnterior.replace('/uploads/', 'uploads/')
      )

      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior)
      }
    }

    return res.json({
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      foto_perfil: rutaFoto,
    })
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)
    console.error('Error al subir foto de perfil:', error instanceof Error ? error.name : 'UnknownError')

    return res.status(500).json({
      success: false,
      message: 'No se pudo actualizar la foto de perfil',
    })
  }
}
