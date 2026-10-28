-- Cambio aditivo para asignar integrantes externos a una defensa.
-- Los integrantes se registran como nombres informativos: no son cuentas,
-- usuarios autenticados ni roles de SIGMO.
-- Revisar contra un respaldo actualizado del esquema antes de ejecutar.
-- Este archivo no se ha ejecutado.

BEGIN;

CREATE TABLE IF NOT EXISTS miembros_jurado_defensa (
  id_miembro SERIAL PRIMARY KEY,
  id_defensa INTEGER NOT NULL
    REFERENCES defensas(id_defensa) ON DELETE CASCADE,
  nombre_completo VARCHAR(200) NOT NULL
    CHECK (length(btrim(nombre_completo)) > 0),
  id_usuario_coordinador INTEGER NOT NULL
    REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_miembros_jurado_defensa_nombre
  ON miembros_jurado_defensa (id_defensa, lower(nombre_completo));

CREATE INDEX IF NOT EXISTS idx_miembros_jurado_defensa
  ON miembros_jurado_defensa (id_defensa, nombre_completo);

COMMIT;
