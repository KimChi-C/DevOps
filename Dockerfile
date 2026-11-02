# Build React/Vite frontend
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Install production backend dependencies
FROM node:24-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Single runtime image: Express serves both API and React build
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=5000
WORKDIR /app
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
EXPOSE 5000
WORKDIR /app/backend
CMD ["npm", "start"]
