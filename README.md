# Portal Red7x7

Portal Red7x7 es ahora una aplicación dividida en frontend y backend. El frontend continúa siendo una SPA en Tailwind, mientras que el backend es una API REST construida con Express, Prisma y PostgreSQL para manejar autenticación, anuncios, reuniones y solicitudes de contacto.

## Requisitos

- Node.js 18+
- PostgreSQL 15+
- (Opcional) Docker y Docker Compose

## Configuración de entorno

1. Copia el archivo `.env.example` a `.env` y ajusta las variables:

```bash
cp .env.example .env
```

Variables principales:

- `DATABASE_URL`: cadena de conexión a PostgreSQL.
- `JWT_SECRET`: secreto para firmar los JWT.
- `GEMINI_API_KEY`: clave para el servicio de IA (opcional, sólo para admins).
- `VITE_API_BASE_URL`: URL base de la API consumida por el frontend.

## Instalación de dependencias

```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

## Migraciones y datos de ejemplo

### Opción rápida (recomendada)

1. Crea el archivo `backend/.env` (puedes copiar `.env.example` y recortar las variables del frontend) y rellena `DATABASE_URL` con la cadena de conexión de tu base de datos PostgreSQL.
2. Desde la carpeta `backend/` ejecuta:

```bash
cd backend
npm run setup:db
```

El script aplicará las migraciones y sembrará los datos iniciales en un solo paso.

### Opción manual

```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

En ambos casos se crea un usuario admin (`admin@red7x7.cl`) con contraseña `changeme123`, un usuario Pro y un miembro estándar.

### Inicializar una base gestionada (Vercel, Neon, Supabase)

1. En el panel del proveedor crea una instancia PostgreSQL y copia la cadena de conexión (por ejemplo, en Vercel: *Storage → Create Database → Postgres*).
2. Guarda la URL en `backend/.env` o ejecútala directamente con `npm run setup:db -- --url "postgres://..."`.
3. Una vez que la base existe, sube la misma URL a las variables de entorno de Vercel (`DATABASE_URL`) y despliega; la API usará el pool gestionado.
Esto crea un usuario admin (`admin@red7x7.cl`) con contraseña `changeme123`, un usuario Pro y un miembro estándar.

## Ejecución en modo desarrollo

### Con Node local

En una terminal:

```bash
cd backend
npm run dev
```

En otra terminal:

```bash
cd frontend
npm run dev
```

El frontend quedará disponible en `http://localhost:5173` y apuntará a la API en `http://localhost:4000/api`.

### Con Docker Compose

```bash
docker-compose up --build
```

Esto levanta PostgreSQL, la API y el servidor de Vite.

## Scripts disponibles

### Backend

- `npm run dev`: inicia el servidor Express con recarga automática.
- `npm test`: ejecuta pruebas con Jest + Supertest.
- `npm run prisma:migrate`: aplica migraciones.
- `npm run prisma:seed`: carga datos de ejemplo.

### Frontend

- `npm run dev`: levanta Vite en modo desarrollo.
- `npm run build`: genera la versión de producción.
- `npm run preview`: previsualiza la build.

## Funcionalidades principales

- **Autenticación JWT:** registro e inicio de sesión con contraseñas hasheadas con bcrypt.
- **Gestión de anuncios:** admins pueden crear, fijar y eliminar anuncios.
- **Reuniones:** admins crean reuniones y generan resúmenes mediante IA; todos los participantes pueden ver sus reuniones.
- **Directorio y roles:** miembros visualizan el directorio; admins pueden actualizar roles/membresías y crear nuevos usuarios con contraseña temporal.
- **Solicitudes de contacto:** miembros Pro o admins solicitan datos de contacto; los admins o destinatarios aceptan/rechazan.

## Pruebas

Ejecuta `npm test` dentro de `backend/` para correr el healthcheck de la API. Amplía esta suite para cubrir tus casos de uso.

## Notas

- El servicio de IA usa Google Gemini (`@google/generative-ai`). Necesitas una clave válida para habilitar el botón de análisis.
- Ajusta CORS y políticas de seguridad antes de desplegar en producción.
- Considera agregar un proxy inverso y un pipeline de build para servir el frontend compilado desde un CDN o desde el mismo backend.
