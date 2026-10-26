# SIGMO

sistema integrado de gestion monografica

## Requisitos
- Node.js LTS
- npm
- Visual Studio Code

## Backend

Configura la conexión a PostgreSQL en `backend/.env` y, en una terminal:

```powershell
cd backend
npm install
npm run dev
```

El backend debe responder en `http://localhost:3000/api/health`.

## Frontend

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El frontend usa `http://localhost:3000` como
backend por defecto. Si el backend está en otra dirección, crea
`frontend/.env.local` con:

```dotenv
VITE_API_URL=http://localhost:3000
```

Reinicia Vite después de cambiar esta variable.

## Seguridad del backend

En `backend/.env` también debe configurarse `JWT_SECRET` con al menos 32 bytes
aleatorios. El backend no iniciará si falta o no cumple esa longitud. Mantén
este valor fuera de Git y compártelo únicamente mediante el gestor de secretos
del entorno donde se ejecute SIGMO.

## Construir para producción

```powershell
cd frontend
npm run build
```

## Variables para despliegue

El backend lee `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
En Render, configura esos valores en el entorno del servicio backend usando la
conexión interna de PostgreSQL cuando ambos servicios estén en la misma región.
Guarda `DB_PASSWORD` y `JWT_SECRET` como secretos del servicio; no los agregues
a Git ni a archivos de configuración versionados.

En producción configura `CORS_ORIGINS` como una lista separada por comas de los
orígenes exactos del frontend, incluyendo el esquema HTTPS y sin rutas. El
backend no inicia en producción si esta lista está vacía. Configura
`VITE_API_URL` en el servicio de frontend con la URL HTTPS del backend antes de
construirlo.

Los archivos subidos se guardan bajo `process.cwd()/uploads`. El sistema de
archivos de los servicios Render es efímero por defecto: para conservar cargas
entre reinicios y despliegues, configura almacenamiento persistente en esa ruta
o migra los documentos a almacenamiento de objetos antes de recibir archivos en
producción.

## Nota

este proyecto tiene el proposito de ayudar a mejorar 
la gestion de monografias en las universidades
