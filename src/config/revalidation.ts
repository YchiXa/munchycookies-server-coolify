// Конфигурация ревалидации для оптимизации производительности

export const REVALIDATION_CONFIG = {
  // Задержки дебаунсинга (в миллисекундах)
  DEBOUNCE_DELAYS: {
    PRICE_EVENTS: 2000, // 2 секунды для цен
    SHIPPING_EVENTS: 3000, // 3 секунды для доставки
    PRODUCT_EVENTS: 1000, // 1 секунда для товаров
    COLLECTION_EVENTS: 1500, // 1.5 секунды для коллекций
    CATEGORY_EVENTS: 1500, // 1.5 секунды для категорий
    GENERAL_EVENTS: 5000, // 5 секунд для общих событий
  },

  // Максимальное количество одновременных ревалидаций
  MAX_CONCURRENT_REVALIDATIONS: 5,

  // Таймаут для HTTP запросов (в миллисекундах)
  HTTP_TIMEOUT: 10000,

  // Логирование
  LOGGING: {
    ENABLED: true,
    LEVEL: "info", // 'debug', 'info', 'warn', 'error'
  },

  // Retry настройки
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
};

// Функция для получения задержки по типу события
export function getDebounceDelay(eventType: string): number {
  const delays = REVALIDATION_CONFIG.DEBOUNCE_DELAYS;

  if (eventType.includes("price") || eventType.includes("discount")) {
    return delays.PRICE_EVENTS;
  }

  if (eventType.includes("shipping") || eventType.includes("fulfillment")) {
    return delays.SHIPPING_EVENTS;
  }

  if (eventType.includes("product")) {
    return delays.PRODUCT_EVENTS;
  }

  if (eventType.includes("collection")) {
    return delays.COLLECTION_EVENTS;
  }

  if (eventType.includes("category")) {
    return delays.CATEGORY_EVENTS;
  }

  return delays.GENERAL_EVENTS;
}

// Функция для проверки, нужно ли логировать событие
export function shouldLogEvent(level: string): boolean {
  if (!REVALIDATION_CONFIG.LOGGING.ENABLED) {
    return false;
  }

  const levels = ["debug", "info", "warn", "error"];
  const configLevel = levels.indexOf(REVALIDATION_CONFIG.LOGGING.LEVEL);
  const eventLevel = levels.indexOf(level);

  return eventLevel >= configLevel;
}
