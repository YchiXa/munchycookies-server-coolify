	import "dotenv/config";
	import { loadEnv, defineConfig } from "@medusajs/framework/utils";

	loadEnv(process.env.NODE_ENV || "development", process.cwd());

	export default defineConfig({
		projectConfig: {
			databaseUrl: process.env.DATABASE_URL,
			http: {
				storeCors: process.env.STORE_CORS!,
				adminCors: process.env.ADMIN_CORS!,
				authCors: process.env.AUTH_CORS!,
				jwtSecret: process.env.JWT_SECRET || "supersecret",
				cookieSecret: process.env.COOKIE_SECRET || "supersecret",
			},
			workerMode: ["server", "shared", "worker"].includes(
				process.env.MEDUSA_WORKER_MODE as string
			)
				? (process.env.MEDUSA_WORKER_MODE as "server" | "shared" | "worker")
				: "server",
			redisUrl: process.env.REDIS_URL,
		},
		admin: {
			disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
			backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
		},
		plugins: [
			process.env.REDIS_URL
				? {
						resolve: "@medusajs/event-bus-redis",
						options: { redisUrl: process.env.REDIS_URL },
					}
				: undefined,
			process.env.REDIS_URL
				? {
						resolve: "@medusajs/cache-redis",
						options: { redisUrl: process.env.REDIS_URL },
					}
				: undefined,
			process.env.REDIS_URL
				? {
						resolve: "@medusajs/workflow-engine-redis",
						options: { redisUrl: process.env.REDIS_URL },
					}
				: undefined,
			{
				resolve: "@medusajs/file-s3",
				options: {
					s3_url: process.env.S3_URL,
					bucket: process.env.S3_BUCKET,
					region: process.env.S3_REGION,
					access_key_id: process.env.S3_ACCESS_KEY_ID,
					secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
				},
			},
		].filter((p): p is Exclude<typeof p, undefined> => Boolean(p)),
	});
