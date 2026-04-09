import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// AICODE-NOTE: Obsidian API is mocked in tests/mocks/obsidian.ts
		// Tests run outside Obsidian runtime — all plugin API must be mocked
		include: ["tests/**/*.test.ts"],
		globals: true,
		environment: "node",
		alias: {
			obsidian: "./tests/mocks/obsidian.ts",
		},
	},
});
