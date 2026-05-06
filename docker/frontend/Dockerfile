# syntax=docker/dockerfile:1
# Build from repository root: docker build -f docker/frontend/Dockerfile .
# VITE_API_BASE empty → browser uses same-origin /api (nginx proxies to the API service).
FROM node:22-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_BASE=
ENV VITE_API_BASE=$VITE_API_BASE

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

RUN npm ci

COPY frontend ./frontend

RUN npm run build -w frontend

FROM nginx:1.27-alpine AS production

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
