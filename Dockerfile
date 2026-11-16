# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_PUBLIC_DEMO=true
RUN npm run build && npm run check:build

FROM debian:bookworm-slim AS litestream
ARG LITESTREAM_VERSION=0.5.18
ARG LITESTREAM_SHA256=d3687b9fd0f2e9426bbd3da828429ff3f1dfc5c9b74d54fdf028e4ee510e7dea
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && curl -fsSLo /tmp/litestream.tar.gz "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-x86_64.tar.gz" \
  && echo "${LITESTREAM_SHA256}  /tmp/litestream.tar.gz" | sha256sum -c - \
  && tar -xzf /tmp/litestream.tar.gz -C /usr/local/bin litestream \
  && /usr/local/bin/litestream version

FROM node:24-bookworm-slim
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=10000 \
  DATA_DIR=/data \
  COOKIE_SECURE=true
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/lib ./src/lib
COPY litestream.yml /etc/litestream.yml
COPY docker/entrypoint.sh /usr/local/bin/medivault-entrypoint
COPY --from=litestream /usr/local/bin/litestream /usr/local/bin/litestream
RUN chmod 755 /usr/local/bin/medivault-entrypoint \
  && mkdir -p /data \
  && chown node:node /data
USER node
EXPOSE 10000
ENTRYPOINT ["medivault-entrypoint"]
