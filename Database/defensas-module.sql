-- Cambio aditivo propuesto para el módulo de defensas.
-- Revisar contra una exportación actualizada del esquema antes de ejecutar.
-- Este archivo no ha sido ejecutado.

BEGIN;

CREATE TABLE IF NOT EXISTS confirmaciones_defensa (
  id_confirmacion SERIAL PRIMARY KEY,
  id_monografia INTEGER NOT NULL
    REFERENCES monografias(id_monografia) ON DELETE CASCADE,
  id_usuario_tutor INTEGER NOT NULL
    REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  id_protocolo INTEGER NOT NULL
    REFERENCES protocolos_monografia(id_protocolo) ON DELETE CASCADE,
  confirmada BOOLEAN NOT NULL,
  vigente BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_confirmacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_confirmaciones_defensa_monografia_fecha
  ON confirmaciones_defensa (id_monografia, fecha_confirmacion DESC, id_confirmacion DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_confirmaciones_defensa_vigente
  ON confirmaciones_defensa (id_monografia)
  WHERE vigente = TRUE;

CREATE TABLE IF NOT EXISTS defensas (
  id_defensa SERIAL PRIMARY KEY,
  id_monografia INTEGER NOT NULL
    REFERENCES monografias(id_monografia) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  lugar VARCHAR(200) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA'
    CHECK (estado IN ('PROGRAMADA', 'REALIZADA', 'CANCELADA')),
  observaciones TEXT
);

CREATE INDEX IF NOT EXISTS idx_defensas_fecha ON defensas(fecha);

-- Si el esquema de destino ya tiene unicidad total por monografía, no se elimina
-- automáticamente: el esquema activo debe revisarse y la migración ajustarse de
-- forma explícita antes de permitir varias defensas históricas.
DO $$
DECLARE
  restriccion RECORD;
  indice RECORD;
  tabla_defensas REGCLASS := to_regclass(format('%I.defensas', current_schema()));
  columna_monografia SMALLINT;
BEGIN
  IF tabla_defensas IS NOT NULL THEN
    SELECT attnum INTO columna_monografia
      FROM pg_attribute
     WHERE attrelid = tabla_defensas AND attname = 'id_monografia' AND NOT attisdropped;

    IF columna_monografia IS NOT NULL THEN
      FOR restriccion IN
        SELECT conname
          FROM pg_constraint
         WHERE conrelid = tabla_defensas
           AND contype = 'u'
           AND cardinality(conkey) = 1
           AND conkey[1] = columna_monografia
      LOOP
        RAISE EXCEPTION 'La tabla defensas tiene una restricción UNIQUE (%) sobre id_monografia. Revise el esquema e indique explícitamente cómo conservar el historial antes de continuar.', restriccion.conname;
      END LOOP;

      FOR indice IN
        SELECT idx.relname
          FROM pg_index ix
          JOIN pg_class idx ON idx.oid = ix.indexrelid
         WHERE ix.indrelid = tabla_defensas
           AND ix.indisunique
           AND NOT ix.indisprimary
           AND ix.indpred IS NULL
           AND ix.indnkeyatts = 1
           AND ix.indkey[0] = columna_monografia
           AND NOT EXISTS (
             SELECT 1 FROM pg_constraint c WHERE c.conindid = ix.indexrelid
           )
      LOOP
        RAISE EXCEPTION 'La tabla defensas tiene un índice UNIQUE (%) sobre id_monografia. Revise el esquema e indique explícitamente cómo conservar el historial antes de continuar.', indice.relname;
      END LOOP;
    END IF;
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_defensas_programada_por_monografia
  ON defensas(id_monografia)
  WHERE estado = 'PROGRAMADA';

CREATE TABLE IF NOT EXISTS historial_defensas (
  id_historial SERIAL PRIMARY KEY,
  id_defensa INTEGER NOT NULL REFERENCES defensas(id_defensa) ON DELETE CASCADE,
  id_monografia INTEGER NOT NULL REFERENCES monografias(id_monografia) ON DELETE CASCADE,
  id_usuario_coordinador INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  accion VARCHAR(20) NOT NULL
    CHECK (accion IN ('PROGRAMADA', 'REPROGRAMADA', 'MODIFICADA', 'CANCELADA')),
  detalle JSONB NOT NULL DEFAULT '{}'::jsonb,
  fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_defensas_monografia_fecha
  ON historial_defensas(id_monografia, fecha_evento DESC, id_historial DESC);

-- IF NOT EXISTS no valida la forma de tablas preexistentes.
-- Detener la migración si el esquema encontrado no expone el contrato usado por la API.
DO $$
BEGIN
  IF EXISTS (
    SELECT required.table_name, required.column_name
    FROM (VALUES
      ('defensas', 'id_defensa'), ('defensas', 'id_monografia'),
      ('defensas', 'fecha'), ('defensas', 'hora'), ('defensas', 'lugar'),
      ('defensas', 'estado'), ('defensas', 'observaciones'),
      ('confirmaciones_defensa', 'id_confirmacion'),
      ('confirmaciones_defensa', 'id_monografia'),
      ('confirmaciones_defensa', 'id_usuario_tutor'),
      ('confirmaciones_defensa', 'id_protocolo'),
      ('confirmaciones_defensa', 'confirmada'),
      ('confirmaciones_defensa', 'vigente'),
      ('confirmaciones_defensa', 'fecha_confirmacion'),
      ('historial_defensas', 'id_historial'),
      ('historial_defensas', 'id_defensa'),
      ('historial_defensas', 'id_monografia'),
      ('historial_defensas', 'id_usuario_coordinador'),
      ('historial_defensas', 'accion'),
      ('historial_defensas', 'detalle'),
      ('historial_defensas', 'fecha_evento')
    ) AS required(table_name, column_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM information_schema.columns actual
      WHERE actual.table_schema = current_schema()
        AND actual.table_name = required.table_name
        AND actual.column_name = required.column_name
    )
  ) THEN
    RAISE EXCEPTION 'La tabla defensas existente no coincide con el contrato esperado; revisar el esquema antes de continuar.';
  END IF;
END;
$$;

COMMIT;
