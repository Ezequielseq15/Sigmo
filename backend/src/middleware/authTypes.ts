export type UserRole = 'ESTUDIANTE' | 'TUTOR' | 'COORDINADOR'

export interface AuthenticatedUser {
  id_usuario: number
  rol: UserRole
}
