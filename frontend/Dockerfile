# ============================================================
# Dockerfile — Frontend React (Cevichería D'Peñas)
# ============================================================

FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando de inicio (dev server)
CMD ["npm", "run", "dev", "--", "--host"]
