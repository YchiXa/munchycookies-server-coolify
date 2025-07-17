# 1. Сборочный слой
FROM node:20-alpine AS build

# Установим нужные системные зависимости
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Включим Corepack и настроим yarn
RUN corepack enable && yarn set version 3.2.3

# Копируем зависимости
COPY package.json yarn.lock .yarnrc.yml ./

# Установим зависимости (создаст node_modules и .yarn/install-state.gz)
RUN yarn install --mode=skip-build

# Копируем весь проект
COPY . .

# Собираем Medusa (в .medusa/server)
RUN yarn build


# 2. Продакшен слой
FROM node:20-alpine

RUN apk add --no-cache libc6-compat python3 make g++ \
    && corepack enable && yarn set version 3.2.3

WORKDIR /app

# Копируем собранный backend
COPY --from=build /app/.medusa/server ./medusa

# Основные файлы
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock

# Эти файлы и папки копируй ТОЛЬКО если они есть в проекте
# Если не планируешь их использовать — оставь закомментированными

# COPY --from=build /app/medusa-config.js ./medusa-config.js
# COPY --from=build /app/plugins ./plugins
# COPY --from=build /app/modules ./modules
# COPY --from=build /app/migrations ./migrations

# Установка только продакшн-зависимостей
RUN yarn workspaces focus --production

EXPOSE 9000

ENV NODE_ENV=production \
    MEDUSA_WORKER_MODE=shared \
    DISABLE_MEDUSA_ADMIN=false

# Используем exec-форму команды запуска
CMD ["yarn", "start"]
