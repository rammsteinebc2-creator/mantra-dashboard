# Usar imagen oficial de Node.js (Debian)
FROM node:20-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Instalar dependencias del backend
RUN cd backend && npm install

# Instalar dependencias del frontend
RUN cd frontend && npm install

# Copiar el resto del código
COPY backend ./backend
COPY frontend ./frontend

# Generar el cliente Prisma (necesario para producción)
RUN cd backend && npx prisma generate

# Construir el frontend (React)
RUN cd frontend && npm run build

# Mover la carpeta build al directorio raíz para que Express sirva los archivos estáticos
RUN mv frontend/dist /app/public

# Exponer el puerto que usará el backend (3001)
EXPOSE 3001

# Establecer variable de entorno para que Express sirva los archivos estáticos
ENV NODE_ENV=production

# Comando para ejecutar el backend
CMD ["node", "backend/index.js"]