# 1. Build
FROM node:20-alpine AS build
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
RUN corepack enable && yarn set version 3.2.3
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --mode=skip-build
COPY . .
RUN yarn build
# Если нужен JS-конфиг:
# RUN yarn tsc medusa-config.ts --outDir ./

# 2. Production
FROM node:20-alpine
RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable && yarn set version 3.2.3
WORKDIR /app
COPY --from=build /app/.medusa/server ./medusa
# COPY --from=build /app/medusa-config.js ./medusa-config.js
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/.yarn /app/.yarn
COPY --from=build /app/.yarnrc.yml /app/.yarnrc.yml
COPY --from=build /app/.yarn/install-state.gz /app/.yarn/install-state.gz
COPY --from=build /app/node_modules ./node_modules
# Если нужны плагины/модули/миграции — раскомментировать ниже
# COPY --from=build /app/plugins ./plugins
# COPY --from=build /app/modules ./modules
# COPY --from=build /app/migrations ./migrations

EXPOSE 9000
ENV NODE_ENV=production \
    MEDUSA_WORKER_MODE=shared \
    DISABLE_MEDUSA_ADMIN=false

# Без повторного yarn install, если node_modules уже скопирован
CMD ["sh", "-c", "yarn predeploy && yarn start"]

# Для безопасности (опционально)
# USER node
