import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/database'

export const login = async (req: Request, res: Response) => {
  try {
    const { correo, password } = req.body

    // Validar que se hayan enviado los datos
    if (!correo || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo y la contraseña son obligatorios',
      })
    }

    // Buscar usuario por correo
    const result = await pool.query(
      `
      SELECT
        id_usuario,
        nombre,
        apellido,
        correo,
        password_hash,
        rol,
        activo
      FROM usuarios
      WHERE correo = $1
      `,
      [correo]
    )

    // Usuario no encontrado
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos',
      })
    }

    const usuario = result.rows[0]

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'El usuario está desactivado',
      })
    }

    // Comparar contraseña
    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash
    )

    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos',
      })
    }

    // Crear token JWT
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET || 'clave-temporal-sigmo',
      {
        expiresIn: '8h',
      }
    )

    // Respuesta
    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      token,
    })
  } catch (error) {
    console.error('Error en login:', error)

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    })
  }
}