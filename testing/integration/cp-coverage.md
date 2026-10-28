# Cobertura propuesta de coevaluacion CP-01 a CP-18

Esta es una matriz de planificacion, no un registro de resultados. Ningun caso se
ha ejecutado como parte de esta preparacion. `VERIFICADO` requerira una evidencia
real del entorno aprobado.

| CP | Aplicabilidad | SIGMO: endpoint/funcion | Ejecucion propuesta | Esperado | Automatizacion y dependencias | Cobertura actual |
|---|---|---|---|---|---|---|
| CP-01 | Si | `GET /api/health` | GET al servidor de prueba; revisar JSON y medir tiempo/uptime. | 200, JSON de estado, timestamp, uptime; <100 ms. | Node/fetch; despliegue o backend de prueba. | Contrato implementado en codigo; ejecucion y umbral pendientes. |
| CP-02 | Si, adaptado | `GET /api/monografias`; `/api/protocolos/pendientes`; `/api/avances/monografia/:id_monografia` | Token por rol, listar y validar forma/permiso. | 200 y array JSON esperado para fixtures. | Node/fetch + fixtures y DB aislada. | Parcial por rutas; sin prueba automatizada encontrada. |
| CP-03 | Si, adaptado | `POST /api/auth/register`; `POST /api/protocolos`; `POST /api/avances` | Crear estudiante/tutor; propuesta; avance con PDF; consultar luego. | Creacion correcta y persistencia completa. | Node/fetch; DB aislada; carga en directorio temporal. | Parcial por codigo; escritura no probada. |
| CP-04 | Si, adaptado | `PUT /api/protocolos/:id_protocolo/revisar`; `PUT /api/avances/:id_avance/revisar`; `PUT /api/monografias/:id_monografia/tutor` | Actualizar/revisar como rol permitido y releer el recurso. | Cambio persistido y atribuido al usuario autorizado. | Node/fetch + DB aislada. | Parcial por codigo; no hay prueba funcional ejecutada. |
| CP-05 | Si | Registro, propuesta/protocolo, avance | Omitir cada campo requerido en solicitudes independientes. | 400 con mensaje claro; no hay fila parcial. | Node/fetch + DB aislada para confirmar ausencia. | Parcial por validaciones del codigo. |
| CP-06 | Si | IDs de carrera/etapa/monografia y campos numericos | Enviar valor no numerico, decimal, vacio y fuera de rango. | 400 controlado y sin escritura. | Node/fetch + DB aislada. | Parcial por validaciones estaticas. |
| CP-07 | Si, endpoint adaptado | `POST /api/auth/register` | Correo malformado y dominio no admitido. | 400 explicito; no se crea usuario. | Node/fetch + DB aislada. | Parcial por validador; no ejecutado. |
| CP-08 | Si | `GET /api/protocolos/:id/descargar`, `GET /api/documentos/download/:id` | ID inexistente con token de prueba. | 404 sin stack ni detalles internos. | Node/fetch + fixtures/DB aislada. | Parcial por manejo de 404 en controladores; sin HTTP. |
| CP-09 | Si | Ruta aleatoria bajo `/api/` | Solicitar ruta inexistente. | 404 claro, no 500 ni stack trace. | Node/fetch; no requiere escritura ni DB. | Catch-all JSON implementado; ejecucion pendiente. |
| CP-10 | Si | Cualquier ruta privada, p. ej. `GET /api/monografias` | Sin token, token malformado y token expirado. | 401 y ningun dato privado. | Node/fetch; token de prueba/servidor. | Parcial por middleware JWT; no ejecutado en esta ronda. |
| CP-11 | Si | Middleware de acceso a monografias, avances, protocolos y documentos | Usuario A consulta recurso de B; repetir con tutor asignado y coordinador. | Rechazar recurso ajeno sin filtrar contenido. SIGMO puede responder 404 en vez del 403 generico del profesor. | Node/fetch + fixtures/DB aislada; matriz de roles. | Parcial por middleware; sin ejecucion. |
| CP-12 | Si | GET critico, p. ej. `/api/monografias` | 10 peticiones consecutivas; guardar tiempos y calcular p95. | p95 <500 ms. | Automatizable con Node; entorno desplegado/base representativa; autorizacion. | Pendiente, no hay mediciones. |
| CP-13 | Si | GET de listado del despliegue de ensayo | 50 solicitudes, concurrencia 10; inspeccionar 5xx y p95. | Cero 5xx; p95 <2 s. | Herramienta de carga o runner; acceso al despliegue y logs/metricas; autorizacion expresa. | Pendiente. |
| CP-14 | Si, distinguir JSON y multipart | Parser `express.json()`; POST de avance/protocolo PDF | Enviar JSON de 1 MB y PDF sintetico por separado. | Responder 201 o 413 controlado, sin caida. | Node/fetch; DB aislada para creacion; archivo temporal. | Parcial por limites configurados; no medido. |
| CP-15 | Si, principalmente proxy | Headers del host HTTPS | `fetch`/cliente HTTP HEAD; revisar headers de seguridad. | Al menos tres headers solicitados por el profesor. | Manual o Node; URL y acceso al despliegue/proxy. | Pendiente; no se encontro Helmet/configuracion en repo. |
| CP-16 | Si, despliegue | Redireccion HTTP a HTTPS | Solicitar URL HTTP sin seguir redirect; comprobar `Location`. | 301/308 a HTTPS; API no servida en claro. | Manual/Node; dominio y configuracion de proxy. | Pendiente; no hay evidencia de infraestructura TLS. |
| CP-17 | Adaptable | Logs de proceso/hosting (el profesor menciona PM2) | Recoger cinco lineas del proceso y validar cada linea como JSON. | JSON con timestamp, level y message. | Manual + parser Node; acceso a logs. | Pendiente; el repo usa `console.*`, no logger JSON/PM2. |
| CP-18 | Adaptable | Manejador global de errores y logs del hosting | Provocar error controlado en ensayo; contrastar respuesta y log. | Cliente no recibe detalle interno; servidor conserva registro diagnostico. | Manual + logs del despliegue; fallo solo en ensayo. | Pendiente; respuesta generica existe en codigo, no archivo de errores configurado. |

## No automatizar desde la base actual

CP-03 a CP-08, CP-11 y CP-14 escriben o dependen de datos/archivos. Ejecutarlos
solo en DB desechable y con `uploads` de la copia temporal. CP-12/13 deben usar
entorno autorizado; no generar carga en produccion. CP-15/16 requieren deployment
con TLS/proxy. CP-17/18 requieren logs reales del proceso.

## Evidencia que debe registrar el equipo

Por cada caso guardar: ID CP, fecha/hora y zona, entorno, revision desplegada,
pasos, identidad sintetica/rol, resultado esperado/real, status HTTP, cuerpo y
headers con secretos/tokens redactados, duracion si aplica y captura/log seguro.
Repetir un fallo al menos dos veces con las mismas precondiciones antes de
registrarlo como reproducible. No inventar fallos para alcanzar un minimo.
