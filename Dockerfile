# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm run check:build

FROM node:24-bookworm-slim
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=10000 \
  COOKIE_SECURE=true
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY src/lib ./src/lib
USER node
EXPOSE 10000
CMD ["node", "server/index.ts"]
