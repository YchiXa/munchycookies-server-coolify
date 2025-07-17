# 1. Сборочный слой
FROM node:20-alpine as build

# Добавим нужные зависимости для сборки
RUN apk add --no-cache libc6-compat python3 make g++

# Установим рабочую директорию
WORKDIR /app

# Включим yarn (через corepack)
RUN corepack enable

# Скопируем зависимости
COPY package.json yarn.lock ./

# Установим dev+prod зависимости
RUN yarn install

# Скопируем весь проект
COPY . .

# Соберём Medusa проект
RUN yarn build

# 2. Продакшен слой
FROM node:20-alpine

# Установим базовые зависимости
RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable

WORKDIR /app

# Копируем нужные файлы из build-слоя
COPY --from=build /app/.medusa/server ./ # Собранный сервер
COPY --from=build /app/medusa-config.ts ./medusa-config.ts
COPY --from=build /app/package.json ./
COPY --from=build /app/yarn.lock ./
COPY --from=build /app/plugins ./plugins
COPY --from=build /app/modules ./modules
COPY --from=build /app/migrations ./migrations

# Установим только production зависимости
RUN yarn install --production

# Откроем порт (по умолчанию Medusa использует 9000)
EXPOSE 9000

# ENV по умолчанию (остальные — через Coolify)
ENV NODE_ENV=production \
    MEDUSA_WORKER_MODE=shared \
    DISABLE_MEDUSA_ADMIN=false

# Миграции и запуск сервера
CMD yarn predeploy && yarn start
