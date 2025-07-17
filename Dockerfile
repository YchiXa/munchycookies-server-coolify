# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Устанавливаем только необходимые файлы для установки зависимостей
COPY package.json yarn.lock ./
# Включаем corepack и устанавливаем нужную версию yarn
RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install --immutable

# Копируем исходники и конфиги
COPY tsconfig.json ./
COPY src ./src
COPY medusa-config.ts ./

# Собираем проект (если TypeScript)
RUN yarn build || true

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Копируем только production-зависимости
COPY package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install --immutable

# Копируем собранный код и конфиги
COPY --from=builder /app/src ./src
COPY --from=builder /app/medusa-config.ts ./
COPY static ./static

# Открываем порт Medusa
EXPOSE 9000

# Запуск сервера
CMD ["yarn", "start"] 
