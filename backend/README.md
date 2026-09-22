# Backend — Cevichería D'Peñas

## Descripción

API REST desarrollada con FastAPI + Python 3.12. Incluye el módulo de **Chatbot con Gemini API** y el módulo de **Reportes PDF con ReportLab**.

## Stack

| Tecnología | Uso |
|---|---|
| FastAPI 0.115 | Framework web, endpoints REST |
| SQLAlchemy 2.0 | ORM, acceso a datos |
| PostgreSQL (Supabase) | Base de datos |
| Google Gemini API | Chatbot conversacional |
| ReportLab 4.2 | Generación de PDFs (comprobantes y tickets) |
| Alembic 1.13 | Migraciones de BD |
| Docker | Contenerización (multi-stage: dev/prod) |

## Estructura

```
backend/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── config.py            # Settings (pydantic-settings + .env)
│   ├── database.py          # Conexión SQLAlchemy
│   ├── seed.py              # Script de datos de ejemplo
│   ├── models/
│   │   └── venta.py         # Modelos Venta y VentaDetalle
│   ├── routers/
│   │   ├── chatbot.py       # Endpoints del chatbot
│   │   └── reports.py       # Endpoints de reportes PDF
│   ├── schemas/
│   │   ├── chatbot.py       # Schemas del chatbot
│   │   └── reports.py       # Schemas de reportes
│   └── services/
│       ├── gemini_service.py # Integración Gemini
│       └── report_service.py # Generación PDF (ReportLab)
├── tests/
│   ├── test_chatbot.py      # 7 tests del chatbot
│   └── test_reports.py      # 8 tests de reportes
├── alembic/                 # Migraciones
├── requirements.txt         # Dependencias Python
├── Dockerfile               # Multi-stage (dev/prod)
└── .env.example             # Plantilla de variables de entorno
```

## Endpoints

### Chatbot
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/chat` | Enviar mensaje al chatbot |
| POST | `/api/chat/reset` | Reiniciar sesión de chat |
| GET | `/api/chat/health` | Health check del chatbot |

### Reportes PDF
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reports/sales/{id}/comprobante` | Descargar comprobante A4 (PDF) |
| GET | `/api/reports/sales/{id}/ticket` | Descargar ticket térmico 80mm (PDF) |

## Instalación y ejecución

### Requisitos
- Python 3.12+
- PostgreSQL (o cuenta en Supabase)
- API key de Google Gemini

### Configuración
```bash
# Copiar y editar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales
```

### Ejecución local
```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Datos de ejemplo
```bash
python -m app.seed
```
Inserta 5 ventas con ítems de ejemplo para probar los reportes.

## Pruebas

```bash
# Ejecutar todos los tests
pytest tests/ -v

# Solo tests de reportes
pytest tests/test_reports.py -v

# Solo tests del chatbot
pytest tests/test_chatbot.py -v
```

**8 tests de reportes**: incluye generación de PDFs, validación de contenido, rendimiento (<3s) y endpoints HTTP.

## Migraciones (Alembic)

```bash
# Generar migración (requiere BD corriendo)
alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones
alembic upgrade head

# Ver migración actual
alembic current
```

## Docker

```bash
# Desarrollo (con hot-reload)
docker-compose up --build

# Producción
docker-compose -f docker-compose.prod.yml up --build
```
