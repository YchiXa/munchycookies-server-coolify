# 1. Сборочный слой
FROM node:20-alpine as build

# Поддержка OpenSSL и компиляции зависимостей
RUN apk add --no-cache libc6-compat python3 make g++

# Рабочая директория
WORKDIR /app

# Установка yarn (по умолчанию в Alpine её нет)
RUN corepack enable

# Копируем зависимости
COPY package.json yarn.lock ./

# Устанавливаем зависимости проекта (dev + prod)
RUN yarn install

# Копируем проект
COPY . .

# Собираем Medusa-проект
RUN yarn build

# 2. Продакшн слой
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable

# Копируем production build из предыдущего слоя
COPY --from=build /app/.medusa/server ./
COPY --from=build /app/medusa-config.js ./medusa-config.js
COPY --from=build /app/package.json ./
COPY --from=build /app/yarn.lock ./
COPY --from=build /app/plugins ./plugins
COPY --from=build /app/modules ./modules
COPY --from=build /app/migrations ./migrations

# Устанавливаем только production-зависимости
RUN yarn install --production

# Открываем порт Medusa
EXPOSE 3000

# ENV по умолчанию (все остальные задаёшь через Coolify)
ENV NODE_ENV=production \
    MEDUSA_WORKER_MODE=shared \
    DISABLE_MEDUSA_ADMIN=false

# Миграции и запуск
CMD yarn predeploy && yarn start
