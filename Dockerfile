FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ENV TREESEED_WEB_RUNTIME_TARGET=managed-node
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4322
COPY --from=build /app/.treeseed/app-dist ./app
EXPOSE 4322
CMD ["node", "./app/server/entry.mjs"]
