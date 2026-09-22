# Frontend — Cevichería D'Peñas

## Descripción

Interfaz web desarrollada con React 19 + Vite 8 + TypeScript + Tailwind CSS 4. Incluye el widget flotante del **Chatbot con Gemini** y está configurado para despliegue en **Vercel**.

## Stack

| Tecnología | Uso |
|---|---|
| React 19 | UI library |
| Vite 8 | Build tool, dev server |
| TypeScript 6 | Tipado estático |
| Tailwind CSS 4 | Estilos utility-first |
| Vitest 4.1 | Tests unitarios |
| @testing-library/react | Tests de componentes |
| oxlint | Linter (reemplaza ESLint) |
| Docker | Contenerización (multi-stage: dev/nginx) |

## Estructura

```
frontend/
├── src/
│   ├── main.tsx              # Entry point React
│   ├── App.tsx               # Componente raíz (landing demo)
│   ├── index.css             # Estilos globales + animaciones
│   ├── components/
│   │   └── chatbot/
│   │       ├── ChatWidget.tsx   # Widget flotante completo
│   │       ├── ChatHeader.tsx   # Cabecera del chat
│   │       ├── ChatInput.tsx    # Campo de texto + envío
│   │       ├── ChatMessage.tsx  # Burbuja de mensaje
│   │       └── ChatMessage.test.tsx # Tests del componente
│   ├── hooks/
│   │   └── useChatbot.ts     # Hook de estado del chat
│   ├── services/
│   │   └── chatbotApi.ts     # Llamadas HTTP al backend
│   ├── types/
│   │   └── chatbot.ts        # Tipos TypeScript
│   └── test/
│       └── setup.ts          # Setup de Vitest + jest-dom
├── vite.config.ts            # Config Vite + Tailwind
├── vitest.config.ts          # Config Vitest + jsdom
├── package.json              # Dependencias y scripts
├── vercel.json               # Config de despliegue Vercel
├── Dockerfile                # Multi-stage (dev/prod nginx)
└── tsconfig.json             # Config TypeScript
```

## Instalación y ejecución

### Requisitos
- Node.js 20+
- Backend corriendo en `http://localhost:8000`

### Configuración
```bash
# Crear archivo .env con la URL del backend
echo "VITE_API_URL=http://localhost:8000" > .env
```

### Ejecución local
```bash
# Instalar dependencias
npm install

# Iniciar dev server
npm run dev
# App: http://localhost:5173
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Dev server con hot-reload |
| `npm run build` | Build de producción (tsc + vite build) |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Lint con oxlint |
| `npm run test` | Ejecutar tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |

## Pruebas

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar en modo watch (desarrollo)
npm run test:watch
```

**5 tests de componente**: validan conversión de markdown (`**negrita**`), saltos de línea, renderizado de avatares y diferenciación usuario/asistente.

## Docker

```bash
# Desarrollo (con hot-reload)
docker-compose up --build

# Producción (nginx sirviendo build estático)
docker-compose -f docker-compose.prod.yml up --build
```

## Despliegue en Vercel

El frontend se despliega automáticamente en Vercel al hacer push a `main`.

**Secretos requeridos en GitHub Actions:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Configuración de Vercel:**
- Framework: Vite
- Build command: `npm run build`
- Output: `dist/`
- SPA rewrite: todas las rutas → `index.html`
