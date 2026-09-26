# Sistema de Gestión Administrativa - Cevichería D'Peñas

Sistema web integral desarrollado para optimizar la gestión de reservas, ventas y catálogo de platillos de la Cevichería D'Peñas (Talara, Piura). El sistema cuenta con un panel administrativo completo y un asistente virtual basado en Inteligencia Artificial.

## Arquitectura y Tecnologías

El proyecto sigue una arquitectura de 3 capas:

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS.
*   **Backend**: FastAPI (Python), SQLAlchemy.
*   **Base de Datos**: PostgreSQL (Supabase).
*   **Inteligencia Artificial**: Google Gemini API (para el chatbot y la clasificación automática de emojis).

## Módulos Principales

1.  **Reservas**: Calendario y disponibilidad de mesas en tiempo real. Bloqueo automático de turnos (1 hora y media).
2.  **Ventas**: Punto de venta (POS) para registrar pedidos directos (Dine-in) o para llevar (Takeaway). Emisión de comprobantes y enlace automático con reservas.
3.  **Platillos**: Catálogo dinámico para mantener la carta actualizada (nombres, precios, descripción y emojis autogenerados).
4.  **Usuarios**: Gestión de empleados y administradores con control de acceso y roles.
5.  **Asistente IA (Chatbot)**: Integración con Gemini que recibe contexto en tiempo real de la base de datos (RAG) para responder consultas sobre el menú, ventas y reservas.

## Requisitos Previos

*   Node.js (v18+)
*   Python (3.10+)
*   Cuenta de Supabase (PostgreSQL)
*   Google AI Studio API Key (Gemini)

## Configuración y Ejecución Local

### 1. Backend (FastAPI)

1. Abrir una terminal y navegar a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crear un entorno virtual e instalar las dependencias:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\activate
   # En Mac/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
3. Configurar las variables de entorno. Crea un archivo `.env` basado en `.env.example`:
   ```env
   GEMINI_API_KEY=tu_api_key_de_google
   GEMINI_MODEL=gemini-3.5-flash
   DATABASE_URL=postgresql+psycopg://usuario:password@host:5432/postgres
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload
   ```
   El backend estará disponible en `http://localhost:8000`.

### 2. Frontend (React + Vite)

1. Abrir otra terminal y navegar a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias de Node:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   El frontend estará disponible en `http://localhost:5173`.

## Notas de Desarrollo

*   **Autenticación**: El sistema usa JWT simulado/básico para separar roles de `admin` y `empleado`.
*   **Límites de IA**: El asistente virtual está configurado para manejar errores de límite de cuota (HTTP 429) de la capa gratuita de Gemini. Si excede la cuota diaria, se recomienda cambiar la llave o esperar al reinicio de ciclo.
