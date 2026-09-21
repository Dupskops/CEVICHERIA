# Reglas del Proyecto — Sistema de Gestión Administrativa Cevichería D'Peñas

> Documento de referencia: `Memoria/Distribucion_Tareas_Cevicheria_DPenas.docx`

---

## 1. Contexto General

- **Proyecto**: Sistema web de gestión administrativa para optimizar la reserva de mesas en la cevichería D'Peñas (Talara, Piura).
- **Objetivo**: Reemplazar el registro manual actual (cuadernillo y Excel) por una plataforma centralizada.
- **Módulos principales**: Usuarios, Platillos, Reservas, Ventas, Reportes y Chatbot IA.

### 🎯 Alcance de este workspace
- **Nuestro módulo**: Chatbot con Gemini API (rol de **Anibal Alejandro Jahuar Chirinos**).
- Todo el código generado en este workspace debe enfocarse en el **módulo del Chatbot / Asistente IA**.
- Tareas clave:
  1. Adaptar la guía del asistente de IA para usar la **API de Google Gemini**.
  2. Configurar el entorno (`.env` con `GEMINI_API_KEY`, dependencias `google-genai` o `google-generativeai`).
  3. Implementar el script del asistente conversacional (instrucciones/rol, recepción de consultas, generación de respuestas).
  4. Definir el rol del chatbot para la cevichería: consultas sobre **disponibilidad, platillos, horarios de atención y estado de reservas**.
  5. Integrar el chatbot como **endpoint dentro de la API de FastAPI** para que el frontend pueda consumirlo.
  6. Realizar **pruebas funcionales** del asistente (mínimo 3 consultas de ejemplo) y registrar las respuestas.

---

## 2. Stack Tecnológico Obligatorio

Todo código generado DEBE respetar el siguiente stack. No introducir tecnologías fuera de esta lista sin aprobación explícita del usuario.

| Capa | Tecnología | Uso |
|---|---|---|
| **Frontend** | React + Vite + TypeScript | Interfaz web para administradores y empleados |
| **Estilos / UI** | Tailwind CSS | Diseño responsivo y accesibilidad (`aria-live`) |
| **Backend** | FastAPI (Python) | API REST, lógica de negocio, validación de datos |
| **ORM** | SQLAlchemy | Mapeo objeto-relacional entre FastAPI y PostgreSQL |
| **Base de Datos** | PostgreSQL (Supabase) | Persistencia de usuarios, reservas, platillos y ventas |
| **Chatbot / IA** | Google Gemini API (Python) | Asistente conversacional para consultas |
| **Reportes PDF** | ReportLab o FPDF | Comprobantes de pago, tickets de comanda, reportes de venta |
| **Contenedores** | Docker + Docker Compose | Estandarización de ambientes (dev, test, prod) |
| **CI/CD** | GitHub Actions | Automatización de pruebas (pytest, vitest, eslint) y despliegue |
| **Deploy Frontend** | Vercel | Alojamiento y despliegue automático del frontend React |

---

## 3. Reglas de Arquitectura

### 3.1 Estructura de capas
- El sistema sigue una arquitectura de **tres capas**: presentación (React), lógica de negocio (FastAPI) y persistencia (PostgreSQL/Supabase).
- No mezclar lógica de negocio en el frontend ni lógica de presentación en el backend.

### 3.2 Base de datos centralizada
- Todos los módulos **deben conectarse a la misma base de datos PostgreSQL (Supabase)** para mantener la información centralizada.
- El modelo de datos debe cubrir: `usuarios`, `platillos`, `reservas` y `ventas`, sin redundancias.

### 3.3 Roles de usuario
- El sistema maneja dos roles diferenciados: **Administrador** y **Empleado**.
- Implementar permisos de acceso diferenciados según el rol.

### 3.4 Chatbot como endpoint interno
- El chatbot (Gemini) se expone como un **endpoint adicional dentro de la API de FastAPI**, integrado al mismo backend y base de datos.
- No crear un servicio separado para el chatbot.
- El chatbot debe responder consultas sobre: disponibilidad, platillos, horarios de atención y estado de reservas.

---

## 4. Reglas de Backend (FastAPI + Python)

- Usar **FastAPI** para todos los endpoints REST.
- Usar **SQLAlchemy** como ORM; no escribir SQL crudo salvo que sea estrictamente necesario.
- La conexión a la base de datos se configura mediante **variables de entorno** (archivo `.env`).
- La API key de Gemini se almacena en variable de entorno `GEMINI_API_KEY`.
- Usar **entornos virtuales** de Python para aislar dependencias.
- Estructura de carpetas del backend debe ser clara y modular (routers, models, schemas, services).
- Los reportes PDF se generan con **ReportLab** o **FPDF** y el tiempo de respuesta debe ser **menor a 3 segundos**.

---

## 5. Reglas de Frontend (React + Vite + TypeScript)

- Usar **React con Vite y TypeScript** — no usar JavaScript plano.
- Usar **Tailwind CSS** para todos los estilos — no usar CSS vanilla ni otras librerías de estilos salvo indicación contraria.
- Consumir los endpoints del backend mediante **peticiones HTTP** (fetch o axios).
- Garantizar **accesibilidad web** (regiones `aria-live`) en todos los módulos.
- Garantizar **diseño responsivo** en todos los módulos.
- El widget del chatbot se integra dentro del frontend consumiendo el endpoint de Gemini expuesto por el backend.

### Módulos del Frontend
1. **Autenticación y Perfiles** — Login y gestión de perfiles (admin/empleado).
2. **CRUD Usuarios** — Alta, baja, modificación y listado de usuarios con permisos diferenciados.
3. **CRUD Platillos** — Gestión del catálogo de platillos.
4. **Reservas** — Calendario/disponibilidad de mesas en tiempo real, creación y cancelación.
5. **Ventas** — Registro y control de ventas.
6. **Reportes** — Visualización y descarga de reportes PDF.
7. **Chatbot** — Widget conversacional integrado.

---

## 6. Reglas de DevOps y Despliegue

- Usar **Docker y Docker Compose** para estandarizar todos los ambientes.
- Configurar un **pipeline CI/CD con GitHub Actions** que incluya:
  - Linting: `eslint` para frontend.
  - Pruebas: `pytest` para backend, `vitest` para frontend.
  - Build de imagen Docker.
  - Despliegue automático.
- El frontend se despliega en **Vercel** con despliegue continuo.
- Las migraciones de base de datos se ejecutan como parte del flujo de despliegue del backend.

---

## 7. Reglas de Pruebas

- Las pruebas de cada módulo **deben incorporarse al pipeline de CI/CD** (GitHub Actions).
- Backend: usar **pytest** para pruebas unitarias y funcionales.
- Frontend: usar **vitest** para pruebas unitarias de componentes.
- Frontend: usar **eslint** como linter obligatorio.
- El módulo de reservas debe validar la **reducción del tiempo de atención por reserva** con pruebas funcionales.

---

## 8. Reglas de Documentación

- Documentar la **fundamentación técnica** de las herramientas elegidas.
- Elaborar diagramas **AS-IS y TO-BE** del proceso de reservas (BPMN).
- Elaborar un **cronograma** de 18 semanas: diseño y arquitectura → backend y BD → frontend → integración y CI/CD → pruebas y cierre.
- Mantener documentación actualizada del API (FastAPI genera Swagger/OpenAPI automáticamente).

---

## 9. Reglas de Colaboración

- Las variables de entorno sensibles (API keys, credenciales de BD) **nunca se commitean al repositorio**. Usar `.env` y `.gitignore`.
- Todo el código debe pasar por el pipeline de CI/CD antes de ser mergeado a la rama principal.
- Se recomienda una reunión semanal de coordinación entre los equipos de backend, frontend, chatbot y DevOps.

---

## 10. Equipo e Integrantes

| # | Integrante | Rol / Módulo |
|---|---|---|
| 1 | Terry Bruno Harhuas Romero | Arquitectura del sistema y configuración del entorno backend |
| 2 | Anibal Alejandro Jahuar Chirinos | Chatbot con Gemini API |
| 3 | Huber Eduardo Remuzgo Tovar | Frontend — Módulos de Usuarios y Platillos |
| 4 | Eddyson Cesar Huamani Pereira | Gestión de Reservas (backend) y planificación del proyecto |
| 5 | Giusseppe Jefferson Tacuchi Chicnes | Frontend — Módulo de Reservas y Ventas |
| 6 | Leonardo Manuel Justo Jurado | Reportes, DevOps y despliegue |
