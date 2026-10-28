# Runner: ejecucion y barreras de aislamiento

Este archivo complementa el README y la matriz existente sin reemplazarlos. El
runner está implementado, pero no se ha ejecutado en esta etapa.

## Grupos

Desde `testing/integration/`, únicamente después de la autorización y preparación
descritas aquí:

```powershell
npm run test:readonly
npm run test:integration
```

`test:readonly` inicia el servidor con la copia temporal y sin ninguna variable
de conexión PostgreSQL. Incluye CP-01, CP-05, CP-06, CP-07, CP-09, CP-10 y el
rechazo del rol público COORDINADOR de CP-03. Solo se hacen solicitudes de health,
404, JWT no válido y validaciones que terminan antes de consultar la DB.

`test:integration` comprueba primero la identidad local de PostgreSQL y el hash de
un marcador específico de corrida. Si esa verificación falla, no inicia el
backend. Luego inicia el backend temporal con una allowlist de variables, crea
cuentas y recursos sintéticos y ejecuta CP-02, CP-03, CP-04, CP-08, CP-10 y CP-11.
Incluye duplicados de correo/carnet, login/sesión estudiante-tutor-coordinador,
creación de propuestas, aprobación/rechazo y `revisado_por`, asignación de tutor,
avance con PDF, persistencia, acceso de propietario y descarga autorizada.
También comprueba que Propuesta no aparezca como etapa de avance y que el
coordinador asigne integrantes sintéticos del jurado a una defensa programada;
estudiante y tutor asignados pueden consultarlos y otros usuarios no.

## Preparación antes de los comandos

1. Obtener y revisar el dump de solo esquema según `README.md`; no usar los scripts
   históricos `Database/Query-*.sql` completos.
2. Crear una base/instancia PostgreSQL desechable, local y sin volumen compartido.
   Cargar el esquema aprobado y solo las migraciones revisadas que correspondan a
   los módulos que se probarán (`defensas-module.sql` y `jurado-module.sql` para
   defensa/jurado); cargar al final `isolation-marker.sql`. No ejecutar estas
   operaciones en la base actual ni usar los `Query-*.sql` históricos completos.
3. Crear la copia temporal del backend según el README. Debe estar bajo la carpeta
   temporal del sistema, con dependencias ya disponibles, `.env*` ausente y un
   directorio `uploads` vacío. No instalar paquetes para satisfacer este runner.
4. Crear el coordinador sintético de la corrida con bcrypt en la DB desechable. El
   correo esperado es `sigmo.coord+<runId>@dactic.uni.edu.ni`; el registro público
   no sirve para crear ese usuario.
5. Generar un UUID de 32 caracteres hexadecimales y un marcador aleatorio de al
   menos 256 bits. Configurar, desde un almacén local sin imprimir valores:

   - `SIGMO_ITEST_NETWORK_ISOLATED=YES`
   - `SIGMO_ITEST_BACKEND_COPY=<ruta de backend temporal>`
   - `SIGMO_ITEST_RUN_ID=<uuid sin guiones>`
   - `SIGMO_ITEST_DB_HOST=127.0.0.1`
   - `SIGMO_ITEST_DB_PORT=55432`
   - `SIGMO_ITEST_DB_NAME=sigmo_itest`
   - `SIGMO_ITEST_DB_USER=sigmo_test`
   - `SIGMO_ITEST_DB_PASSWORD=<credencial descartable>`
   - `SIGMO_ITEST_DB_MARKER=<marcador aleatorio>`
   - `SIGMO_ITEST_CONFIRM_WRITES=I_ACCEPT_DISPOSABLE_DB`
   - `SIGMO_ITEST_SYNTHETIC_PASSWORD=<12 a 72 bytes>`
   - `SIGMO_ITEST_COORDINATOR_EMAIL=sigmo.coord+<runId>@dactic.uni.edu.ni`
   - `SIGMO_ITEST_COORDINATOR_PASSWORD=<misma contraseña sintética>`
   - `SIGMO_ITEST_STAGE_ID=<ID de etapa de la DB aislada>`

6. Armar el marcador una sola vez para esa corrida:

   ```powershell
   npm run arm:database -- --confirm-isolated-db
   ```

   El script verifica servidor, puerto, base, usuario y corrida; no imprime
   credenciales/marcador y no reemplaza una corrida existente. Solo se debe
   ejecutar tras comprobar por separado que el PostgreSQL local es desechable.
7. Ejecutar primero el grupo de solo lectura. Revisar que termine y que no haya un
   servicio ocupando el puerto `3400`; después, solo si se autoriza, ejecutar el
   grupo de integración con escrituras.

El backend actual escucha en todas las interfaces. Por eso `SIGMO_ITEST_NETWORK_ISOLATED=YES`
es una confirmación operativa obligatoria: ejecutar solo en una máquina o entorno
de prueba aislado de redes no confiables. El runner usa únicamente el origen
`127.0.0.1:3400`, espera que el propio proceso temporal confirme que quedó
escuchando y no acepta un endpoint remoto arbitrario.

## Controles técnicos de fail-closed

- La copia backend debe resolver bajo `os.tmpdir()`, no ser la raíz del repo, no
  contener `.env*` y tener los módulos existentes `pg`/`ts-node`.
- El servidor hijo se inicia desde esa copia y recibe un entorno nuevo mínimo;
  nunca hereda `DB_*`, `PG*`, `DATABASE_URL`, `NODE_OPTIONS` ni secretos del
  proceso padre. La clave JWT de prueba se genera en memoria.
- El grupo read-only no pasa configuración PostgreSQL al servidor hijo.
- El grupo con escrituras exige host, puerto y usuario exactos, nombre de base,
  consentimiento explícito y la coincidencia en tiempo constante del hash del
  marcador secreto con `sigmo_itest_control.run_manifest`.
- La conexión de preflight tiene TLS desactivado, timeout corto y solo consulta
  identidad/marker; no muta la DB. La operación de armado es la única escritura
  auxiliar y está limitada por los mismos valores fijos y un argumento explícito.
- Los mensajes de aserción no incluyen cuerpos, tokens, contraseñas, respuestas
  completas ni errores crudos de PostgreSQL.

Estas barreras reducen el riesgo de apuntar por error a un entorno real, pero no
reemplazan la inspección humana de que el puerto corresponde a una instancia
nueva y desechable antes de armar el marcador.

## Resultados y alcance restante

Registrar resultados manualmente en `results-template.csv`; nunca guardar JWT,
contraseñas ni datos personales. El runner implementa CP-01 a CP-11, pero las
pruebas permanecen **no ejecutadas** hasta una etapa autorizada. CP-12 requiere
mediciones de latencia; CP-13 carga concurrente autorizada; CP-14 payload grande;
CP-15/16 navegador o cliente HTTP y despliegue HTTPS; CP-17/18 acceso a logs del
servidor/plataforma. Esos casos siguen pendientes y no se invocan desde el runner.
