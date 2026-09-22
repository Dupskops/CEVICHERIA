# ============================================================
# Dockerfile — Frontend React (Cevichería D'Peñas)
# Multi-stage: dev + prod (nginx)
# ============================================================

# --- DEV stage ---
FROM node:20-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

# --- PROD stage: build + nginx ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- PROD: nginx ---
FROM nginx:alpine AS prod

# Copiar archivos de configuración de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar SPA (todas las rutas → index.html)
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://backend:8000;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
    gzip on;\n\
    gzip_types text/plain application/json application/javascript text/css;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
