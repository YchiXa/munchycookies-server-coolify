# 1. Сборочный слой
FROM node:20-alpine AS build

# Установим нужные системные зависимости
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Включим Corepack и настроим yarn
RUN corepack enable && yarn set version 3.2.3

# Копируем зависимости
COPY package.json yarn.lock .yarnrc.yml ./

# Установим зависимости (в том числе создаст .yarn/install-state.gz и node_modules)
RUN yarn install --mode=skip-build

# Копируем проект
COPY . .

# Собираем Medusa
RUN yarn build

# 2. Продакшен слой
FROM node:20-alpine

RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable && yarn set version 3.2.3

WORKDIR /app

# Копируем билд и всё необходимое
COPY --from=build /app/.medusa/server ./medusa
COPY --from=build /app/medusa-config.js ./medusa-config.js
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
COPY --from=build /app/plugins ./plugins
COPY --from=build /app/modules ./modules
COPY --from=build /app/migrations ./migrations

# Установка только продакшн-зависимостей
RUN NODE_ENV=production yarn install --mode=update-lockfile

EXPOSE 9000

ENV NODE_ENV=production \
    MEDUSA_WORKER_MODE=shared \
    DISABLE_MEDUSA_ADMIN=false

CMD ["sh", "-c", "yarn predeploy && yarn start"]
