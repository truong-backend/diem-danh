# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* được nhúng vào JS bundle lúc build
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_MINIO_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_MINIO_URL=$VITE_MINIO_URL

RUN npm run build

# ---- Runtime stage: nginx serve static files ----
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx để handle React Router (SPA)
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
