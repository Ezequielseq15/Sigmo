# Preparacion de pruebas integradas de SIGMO

Este directorio contiene el diseno de las pruebas aisladas. No forma parte del
frontend ni del backend, no se importa desde la aplicacion y no ejecuta pruebas.
No contiene credenciales, datos copiados de usuarios ni archivos subidos reales.

## Estado y limites de esta preparacion

- No se lee `backend/.env`, no se conecta a PostgreSQL y no se ejecuta ningun SQL.
- No se inicia el backend, Docker ni otro servicio; no se instalan dependencias.
- La base de pruebas debera ser desechable, con nombre fijo `sigmo_itest` y
  puerto local dedicado. No debe reutilizar datos ni volumenes del proyecto.
- Las cargas deben escribirse dentro de una copia temporal del backend.
- Los scripts `Database/Query-1.sql`, `Query-2.sql` y `Query-3.sql` no son una
  fuente de instalacion para esta ronda. Query-1 crea tablas y datos iniciales;
  Query-3 mezcla DDL con operaciones de datos. No ejecutar ninguno completo.

## Como obtener el esquema vigente sin que esta ronda se conecte a la BD

Solicitar al administrador de la instancia una exportacion revisada de solo
estructura, generada contra la version/esquema vigente con una herramienta de la
misma version mayor de PostgreSQL. El administrador puede usar `pg_dump` con una
cuenta autorizada de solo lectura y un `PGSERVICE`/archivo de contrasena protegido
(sin credenciales en la linea de comandos). Ejemplo para el administrador,
**no ejecutado por esta preparacion**:

```powershell
pg_dump --schema-only --no-owner --no-privileges --no-comments `
  --schema=public --file=sigmo-schema-review.sql <nombre_base_autorizada>
```

El archivo debe guardarse primero fuera del repositorio, revisarse para descartar
funciones con valores incrustados u otra informacion sensible y entregarse como
artefacto de esquema aprobado. `--schema-only` excluye las filas, pero no sustituye
la revision del archivo. No usar un dump de datos ni `Database/Query-*.sql` como
esquema canonico. Comparar el DDL con las consultas actuales del backend, incluidos
`foto_perfil`, `notificaciones`, `monografia_estudiantes`, claves foraneas,
restricciones e indices. Si el esquema aprobado no contiene lo que requiere el
backend, detener la ronda: no adaptar la base con migraciones dentro de las pruebas.

## Comprobacion no destructiva de Docker

La revision local encontro Docker CLI 29.8.1 mediante `Get-Command docker` y
`docker --version`. Esas consultas no iniciaron ni modificaron servicios. Para
comprobar mas adelante si el daemon ya esta disponible, `docker info` es una
consulta de estado; si informa que no hay daemon, detenerse. No ejecutar `docker
start`, `docker compose up`, `docker run` ni crear volumenes hasta que se autorice
la siguiente etapa.

## Aislamiento del backend y las cargas

Cuando se autorice ejecutar, hacer una copia nueva por corrida bajo `$env:TEMP`,
excluyendo `uploads`, `.env*`, `.git` y `dist`. Copiar el `node_modules` ya
existente si se dispone de el; si no, solicitar autorizacion antes de instalar
dependencias en esa copia. El original no se usa como directorio de trabajo.

Ejemplo de preparacion futura, **no ejecutado**:

```powershell
$repo = (Resolve-Path 'C:\Users\USUARIO\Desktop\SIGMO').Path
$runRoot = Join-Path $env:TEMP ('sigmo-it-' + [guid]::NewGuid().ToString('N'))
$backendCopy = Join-Path $runRoot 'backend'
New-Item -ItemType Directory -Path $backendCopy -Force | Out-Null
robocopy (Join-Path $repo 'backend') $backendCopy /E `
  /XD .git uploads dist `
  /XF .env .env.*
if ($LASTEXITCODE -ge 8) { throw 'La copia aislada del backend fallo.' }
New-Item -ItemType Directory -Path (Join-Path $backendCopy 'uploads') -Force | Out-Null
```

El servidor debe ejecutarse con `WorkingDirectory` en `$backendCopy`. En ese caso,
las rutas actuales que dependen de `process.cwd()` apuntan a la carpeta `uploads`
de la copia temporal. La aplicacion no tiene actualmente una variable de entorno
para redirigir las cargas; no se propone cambiar ese comportamiento en esta etapa.

Antes de iniciar el backend, definir explicitamente en esa terminal las variables
que el codigo actual consume: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `JWT_SECRET` y `PORT`. Requerir `DB_NAME=sigmo_itest`, host local,
puerto reservado a la prueba y un `JWT_SECRET` aleatorio exclusivo de prueba con
al menos 32 bytes. No cargar `.env` del repositorio ni copiarlo a la carpeta
temporal. Si no puede demostrarse que el backend apunta a la BD desechable, no
iniciar el proceso.

La instancia PostgreSQL futura debera ser desechable, escuchar solo en loopback,
usar almacenamiento temporal y no montar carpetas/volumenes de la aplicacion.
Elegir su version despues de recibir el esquema aprobado. Esta preparacion no crea
ni inicia dicho contenedor.

## Fixtures sinteticos

`fixtures.synthetic.json` declara roles y relaciones logicas, no filas SQL listas
para ejecutar. En la corrida posterior:

1. Registrar estudiante y tutor por el endpoint publico para comprobar tambien el
   flujo real de bcrypt y login. Usar alias de prueba que satisfagan la validacion
   de dominio de SIGMO; no se enviara correo.
2. Crear el coordinador exclusivamente en la base aislada, mediante un seed de
   prueba revisado que genere hash bcrypt usando la dependencia existente del
   backend. El registro publico no debe crear coordinadores.
3. Crear carrera/ciclo/etapas y perfiles de prueba con IDs consultados en esa base.
4. Crear monografias para propietario y tercero, vinculo tutor asignado, protocolo
   pendiente para revisar y protocolo aprobado para permitir el caso de avance.
5. Usar PDFs pequenos sinteticos. Nunca copiar archivos de `backend/uploads`.

Al terminar, descartar la instancia desechable completa; no ejecutar una limpieza
SQL contra la base configurada para desarrollo o produccion.

## Plan Node y fetch (sin dependencias adicionales)

Node con `fetch` nativo puede automatizar la parte HTTP. Un futuro runner debe
residir aqui, utilizar `node:test`, exigir un destino `http://127.0.0.1` con el
puerto de prueba configurado y bloquearse si `DB_NAME` no es `sigmo_itest`. No debe
leer `.env`. Para pruebas que escriben, exigir una bandera explicita de ejecucion
y credenciales sinteticas suministradas en el entorno. Nunca imprimir tokens,
contrasenas, cuerpos con datos personales ni cabeceras Authorization.

Orden recomendado: health y errores sin escritura; registro/login; roles/propiedad;
propuesta/protocolo; avances y PDF; descargas. Una corrida de prueba puede escribir
en la base desechable. No incluir borrado fila-a-fila: la instancia se descarta
completa. La matriz `cp-coverage.md` separa automatizacion de verificaciones
manuales que dependen de navegador, HTTPS, carga o logs.

## Pendientes antes de ejecutar

- Recibir y aprobar un dump de solo esquema vigente, sin filas ni secretos.
- Confirmar version mayor de PostgreSQL y que Docker daemon ya esta disponible.
- Aprobar el directorio temporal, puerto de prueba y credenciales descartables.
- Construir el seed sintetico y el runner Node/fetch despues de aprobar los
  contratos y las precondiciones de la matriz.
- Confirmar quien puede revisar los logs del despliegue y autorizar pruebas de carga.
