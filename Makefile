API_SRC       := ./openapi/api.yaml
API_BUNDLED   := ./openapi/api-bundled.yaml
OUTPUT_DIR    := ./openapi/web
GEN_DIR       := ./src/generated/openapi
CONFIG_FILE   := ./config.yaml

.PHONY: build-js start-js migrate-up-js migrate-down-js

build-js:
	KV_VIPER_FILE=$(CONFIG_FILE)
	rm -rf dist
	npx tsc -p tsconfig.json
	mkdir -p dist
	printf '{\n  "type": "commonjs"\n}\n' > dist/package.json

start-js:
	KV_VIPER_FILE=$(CONFIG_FILE) node dist/index.js service run

run-service: build-js start-js

run-service-ts:
	KV_VIPER_FILE=$(CONFIG_FILE) npx tsx src/index.ts service run

migrate-up-js: build-js
	KV_VIPER_FILE=$(CONFIG_FILE) node dist/index.js migrate up

migrate-up-ts:
	KV_VIPER_FILE=$(CONFIG_FILE) npx tsx src/index.ts migrate up

migrate-down-js: build-js
	KV_VIPER_FILE=$(CONFIG_FILE) node dist/index.js migrate down

migrate-down-ts:
	KV_VIPER_FILE=$(CONFIG_FILE) npx tsx src/index.ts migrate down