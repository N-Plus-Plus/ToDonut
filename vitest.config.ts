import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify("0.1.0"),
    __BUILD_ID__: JSON.stringify("test-build"),
    __BUILD_TIMESTAMP__: JSON.stringify("2026-07-01T00:00:00.000Z"),
    __SOURCE_COMMIT__: JSON.stringify(null),
  },
  test: {
    environment: "jsdom",
    globals: true,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    fileParallelism: false,
    isolate: true,
  },
});
