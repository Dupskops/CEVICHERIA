# Backend — Cevichería D'Peñas

## Descripción

API REST desarrollada con FastAPI + Python 3.12. Incluye el módulo de **Reservas** (CRUD y disponibilidad de mesas), el módulo de **Reportes PDF con ReportLab** y el módulo de **Chatbot con Gemini API**.

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
│   │   ├── venta.py         # Modelos Venta y VentaDetalle
│   │   └── reserva.py       # Modelos Mesa y Reserva
│   ├── routers/
│   │   ├── chatbot.py       # Endpoints del chatbot
│   │   ├── reports.py       # Endpoints de reportes PDF
│   │   └── reservas.py      # Endpoints de reservas y disponibilidad
│   ├── schemas/
│   │   ├── chatbot.py       # Schemas del chatbot
│   │   ├── reports.py       # Schemas de reportes
│   │   └── reservas.py      # Schemas de reservas
│   └── services/
│       ├── gemini_service.py # Integración Gemini
│       ├── report_service.py # Generación PDF (ReportLab)
│       └── reserva_service.py # Lógica de reservas (códigos, conflictos, disponibilidad)
├── tests/
│   ├── test_chatbot.py      # 7 tests del chatbot
│   ├── test_reports.py      # 8 tests de reportes
│   └── test_reservas.py     # 14 tests de reservas
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

### Reservas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas/mesas` | Listar las 15 mesas del restaurante |
| GET | `/api/reservas/disponibilidad?fecha=&hora=&comensales=` | Consultar mesas disponibles |
| GET | `/api/reservas` | Listar reservas (filtro opcional `?fecha=`) |
| GET | `/api/reservas/{id}` | Obtener una reserva |
| POST | `/api/reservas` | Crear reserva (validación de capacidad y conflicto) |
| POST | `/api/reservas/{id}/cancelar` | Cancelar reserva (baja lógica) |
| DELETE | `/api/reservas/{id}` | Eliminar reserva (baja física) |

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
Inserta 5 ventas con ítems de ejemplo, las 15 mesas y 5 reservas para probar reportes y disponibilidad.

## Pruebas

```bash
# Ejecutar todos los tests
pytest tests/ -v

# Solo tests de reportes
pytest tests/test_reports.py -v

# Solo tests del chatbot
pytest tests/test_chatbot.py -v

# Solo tests de reservas
pytest tests/test_reservas.py -v
```

**29 tests en total**: 8 de reportes (PDF, rendimiento <3s, endpoints), 7 del chatbot y 14 de reservas (CRUD, disponibilidad, cancelación y ciclo completo <3s).

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
