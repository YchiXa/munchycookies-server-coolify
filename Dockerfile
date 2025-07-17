# --- Stage 1: сборка ---
	FROM node:20-alpine AS builder

	# Зависимости для сборки
	RUN apk add --no-cache libc6-compat python3 make g++
	
	WORKDIR /app
	
	# Включаем Corepack и фиксируем версию yarn
	RUN corepack enable
	
	# Копируем файлы зависимостей и устанавливаем зависимости
	COPY package.json yarn.lock .yarnrc.yml ./
	RUN yarn install --mode=skip-build
	
	# Копируем всё и строим Medusa
	COPY . .
	RUN yarn build
	
	# --- Stage 2: запуск ---
	FROM node:20-alpine
	
	RUN apk add --no-cache libc6-compat python3 make g++ \
			&& corepack enable
	
	WORKDIR /app
	
	# Копируем основной билд и конфиги
	COPY --from=builder /app/.medusa/server ./medusa
	COPY --from=builder /app/medusa-config.js ./medusa-config.js
	COPY --from=builder /app/package.json ./package.json
	COPY --from=builder /app/yarn.lock ./yarn.lock
	
	# Если есть папки plugins, modules – копируйте аналогично
	# COPY --from=builder /app/plugins ./plugins
	# COPY --from=builder /app/modules ./modules
	# tsconfig.json не требуется для production-образа, если проект уже собран
	
	# Устанавливаем только production‑зависимости
	RUN yarn install --production
	
	EXPOSE 9000
	
	ENV NODE_ENV=production \
			MEDUSA_WORKER_MODE=shared \
			DISABLE_MEDUSA_ADMIN=false
	
	# Миграции и запуск
	ENTRYPOINT ["sh", "-c", "yarn predeploy && yarn start"]
