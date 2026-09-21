Diseña y desarrolla el prototipo web de SIGMO (Sistema Integrado de Gestión Monográfica).

IMPORTANTE:
Este diseño debe seguir estrictamente el siguiente DIAGRAMA DE NAVEGACIÓN. No inventes módulos, roles ni funcionalidades adicionales.

SIGMO es un sistema independiente para gestionar el proceso de elaboración y seguimiento de monografías.

NO utilizar:
- Tesis
- Tesista
- SIGTESIS
- Gestión de tesis
- Portal institucional
- Moodle
- Funcionalidades externas a SIGMO

Utilizar siempre:
- Monografía
- Monografista
- SIGMO
- Gestión de Monografías
- Sistema Integrado de Gestión Monográfica


==================================================
1. FLUJO PRINCIPAL
==================================================

La navegación general debe ser:

INICIAR SESIÓN
        ↓
SELECTOR DE ROL
        ↓
 ┌───────────────┬───────────────┬────────────────┐
 ↓               ↓                ↓
ESTUDIANTE      TUTOR            COORDINADOR
 ↓               ↓                ↓
DASHBOARD       DASHBOARD        DASHBOARD
ESTUDIANTE      TUTOR             COORDINADOR


==================================================
2. INICIAR SESIÓN
==================================================

Crear una pantalla llamada:

"INICIAR SESIÓN"

Debe contener:

- Logo SIGMO.
- Texto "Sistema Integrado de Gestión Monográfica".
- Campo "Correo electrónico".
- Campo "Contraseña".
- Botón "Iniciar sesión".
- Opción para mostrar/ocultar contraseña.
- Mensaje de error si las credenciales son incorrectas.

Al iniciar sesión correctamente, dirigir al:

"SELECTOR DE ROL"


==================================================
3. SELECTOR DE ROL
==================================================

Crear una pantalla sencilla denominada:

"SELECTOR DE ROL"

Mostrar tres opciones:

- Estudiante
- Tutor
- Coordinador

Cada opción debe ser visualmente diferenciada y permitir acceder al dashboard correspondiente.

Flujos:

Estudiante → Dashboard Estudiante
Tutor → Dashboard Tutor
Coordinador → Dashboard Coordinador


==================================================
4. DASHBOARD ESTUDIANTE
==================================================

Rol:
ESTUDIANTE

Nombre de pantalla:

"DASHBOARD ESTUDIANTE"

El dashboard debe mostrar:

- Resumen general.
- Estado actual de la monografía.
- Tareas pendientes.
- Última actividad.
- Próximo evento relacionado con la monografía.

Utilizar una barra lateral con las siguientes opciones EXACTAS:

1. Inicio
2. Mi Monografía
3. Avances
4. Documentos
5. Calendario de Defensa


--------------------------------------------------
4.1 MI MONOGRAFÍA
--------------------------------------------------

Nombre:

"MI MONOGRAFÍA"

Subtítulo:

"Línea de Tiempo de Etapas"

Mostrar visualmente el proceso mediante una línea de tiempo.

Etapas:

1. Propuesta
2. Avance 1
3. Avance 2
4. Avance 3
5. Documento final
6. Defensa

Cada etapa debe mostrar:

- Nombre de la etapa.
- Estado.
- Fecha.
- Indicador visual.

Estados:

- Pendiente
- Enviado
- En revisión
- Aprobado
- Rechazado

También mostrar:

- Título de la monografía.
- Tutor asignado.
- Carrera.
- Estado general.


--------------------------------------------------
4.2 AVANCES
--------------------------------------------------

Nombre:

"AVANCES"

Mostrar:

- Lista de entregas.
- Historial.
- Tipo de avance.
- Fecha.
- Estado.
- Comentarios del tutor.

Agregar botón:

"Subir avance"

Al seleccionar "Subir avance", abrir un modal.

El modal debe contener:

- Tipo de avance.
- Descripción.
- Seleccionar archivo.
- Nombre del archivo.
- Tamaño.
- Botón "Cancelar".
- Botón "Enviar avance".

Después de enviar, mostrar el avance en el historial con estado:

"En revisión"


--------------------------------------------------
4.3 DOCUMENTOS
--------------------------------------------------

Nombre:

"DOCUMENTOS"

Mostrar una lista de documentos asociados a la monografía.

Cada documento debe mostrar:

- Nombre.
- Tipo.
- Fecha.
- Estado.
- Tamaño.

Acciones:

- Ver documento.
- Descargar documento.
- Subir documento.

Tipos principales:

- Propuesta.
- Avance.
- Documento final.


--------------------------------------------------
4.4 CALENDARIO DE DEFENSA
--------------------------------------------------

Nombre:

"CALENDARIO DE DEFENSA"

Mostrar:

- Fecha.
- Hora.
- Lugar.
- Tribunal.
- Estado de la defensa.

Utilizar:

- Calendario visual.
- Tarjeta con información de la defensa.


==================================================
5. DASHBOARD TUTOR
==================================================

Rol:

TUTOR

Nombre:

"DASHBOARD TUTOR"

Mostrar:

"Estado de Monografías Asignadas"

Indicadores:

- Monografías asignadas.
- Avances pendientes.
- Avances en revisión.
- Monografías aprobadas.

Navegación:

1. Inicio
2. Mis Monografistas
3. Calendario
4. Notificaciones
5. Perfil


--------------------------------------------------
5.1 MIS MONOGRAFISTAS
--------------------------------------------------

Nombre:

"MIS MONOGRAFISTAS"

Mostrar una lista de estudiantes.

Cada registro debe contener:

- Nombre del estudiante.
- Título de la monografía.
- Estado.
- Último avance.
- Fecha de entrega.
- Botón "Ver".

Incluir:

- Barra de búsqueda.
- Filtros.


--------------------------------------------------
5.2 DETALLE DE AVANCE
--------------------------------------------------

Ruta:

Mis Monografistas
→ Seleccionar estudiante
→ Detalle de avance

Mostrar:

- Datos del estudiante.
- Título de la monografía.
- Documento enviado.
- Fecha.
- Historial.

Sección:

"Revisión de entrega"

Permitir:

- Visualizar documento.
- Escribir retroalimentación.
- Agregar comentarios.
- Aprobar avance.
- Rechazar avance.

Botones:

"APROBAR"
"RECHAZAR"

Si se selecciona "Rechazar":

Mostrar campo obligatorio:

"Motivo del rechazo"

Después de la acción, actualizar el estado correspondiente.


==================================================
6. DASHBOARD COORDINADOR
==================================================

Rol:

COORDINADOR

Nombre:

"DASHBOARD COORDINADOR"

Mostrar:

"Métricas generales"

y

"Resumen"

Indicadores:

- Total de monografías.
- Monografías en proceso.
- Monografías aprobadas.
- Monografías pendientes.
- Defensas programadas.

Navegación:

1. Inicio
2. Gestión de Monografías
3. Asignar Tutor / Tribunal
4. Reportes
5. Perfil


--------------------------------------------------
6.1 GESTIÓN DE MONOGRAFÍAS
--------------------------------------------------

Nombre:

"GESTIÓN DE MONOGRAFÍAS"

Debe ser una tabla filtrable.

Columnas:

- Estudiante
- Título
- Carrera
- Tutor
- Estado
- Ciclo
- Acción

Filtros:

- Estado
- Tutor
- Carrera
- Título
- Ciclo

Acción:

"Ver detalle"

El detalle debe mostrar:

- Información del estudiante.
- Título de la monografía.
- Carrera.
- Tutor.
- Estado.
- Historial de avances.
- Tribunal asignado.


--------------------------------------------------
6.2 ASIGNAR TUTOR / TRIBUNAL
--------------------------------------------------

Nombre:

"ASIGNAR TUTOR / TRIBUNAL"

Debe permitir:

ASIGNAR TUTOR

- Seleccionar monografía.
- Seleccionar tutor.
- Confirmar asignación.

REASIGNAR TUTOR

- Mostrar tutor actual.
- Seleccionar nuevo tutor.
- Confirmar cambio.

ASIGNAR TRIBUNAL

- Seleccionar monografía.
- Agregar miembros.
- Configurar tribunal.
- Confirmar asignación.


--------------------------------------------------
6.3 REPORTES
--------------------------------------------------

Nombre:

"REPORTES"

Mostrar:

- Estadísticas generales.
- Monografías por estado.
- Monografías por carrera.
- Monografías por tutor.
- Monografías por ciclo.
- Defensas programadas.

Agregar:

- Gráficos.
- Tablas.
- Botón "Descargar informe".


==================================================
7. DISEÑO VISUAL
==================================================

Crear una interfaz moderna, profesional y académica.

Características:

- Fondo claro.
- Tarjetas blancas.
- Bordes suaves.
- Sombras discretas.
- Tipografía moderna.
- Espaciado amplio.
- Iconografía consistente.
- Diseño responsive.
- Sidebar fija en escritorio.
- Menú adaptable en dispositivos pequeños.

Colores por rol:

ESTUDIANTE:
Azul.

TUTOR:
Verde.

COORDINADOR:
Morado.

Mantener una identidad visual general consistente para SIGMO.

No utilizar colores excesivamente saturados.


==================================================
8. COMPONENTES REUTILIZABLES
==================================================

Crear componentes reutilizables para:

- Header.
- Sidebar.
- Dashboard cards.
- Botones.
- Badges de estado.
- Tablas.
- Formularios.
- Modales.
- Notificaciones.
- Calendario.
- Línea de tiempo.
- Listas de documentos.
- Gráficos.


==================================================
9. ESTADOS
==================================================

Los estados deben utilizar badges visuales:

PENDIENTE
ENVIADO
EN REVISIÓN
APROBADO
RECHAZADO

Cada estado debe tener una representación visual consistente.


==================================================
10. NAVEGACIÓN FINAL OBLIGATORIA
==================================================

El prototipo debe permitir probar este flujo:

INICIAR SESIÓN
↓
SELECTOR DE ROL
↓
ESTUDIANTE
↓
DASHBOARD ESTUDIANTE
├── MI MONOGRAFÍA
├── AVANCES
├── DOCUMENTOS
└── CALENDARIO DE DEFENSA

O:

INICIAR SESIÓN
↓
SELECTOR DE ROL
↓
TUTOR
↓
DASHBOARD TUTOR
├── MIS MONOGRAFISTAS
└── DETALLE DE AVANCE

O:

INICIAR SESIÓN
↓
SELECTOR DE ROL
↓
COORDINADOR
↓
DASHBOARD COORDINADOR
├── GESTIÓN DE MONOGRAFÍAS
├── ASIGNAR TUTOR / TRIBUNAL
└── REPORTES


==================================================
11. REGLA PRINCIPAL
==================================================

El resultado debe representar visualmente y funcionalmente el diagrama de navegación proporcionado.

No agregar:
- Módulos académicos adicionales.
- Matrícula.
- Notas.
- Pagos.
- Biblioteca.
- Moodle.
- Chat general.
- Redes sociales.
- Funciones institucionales que no pertenezcan al proceso de gestión de monografías.

El objetivo es crear exclusivamente SIGMO como sistema web de gestión y seguimiento de monografías.

Prioriza:
1. Navegación correcta.
2. Correspondencia con el diagrama.
3. Claridad de cada rol.
4. Consistencia visual.
5. Prototipo navegable.