API_SRC := ./docs/api.yaml
API_BUNDLED := ./docs/api-bundled.yaml
DOCS_INTERNAL_DIR := ./docs/web/docs

bundle:
	test -d $(dir $(API_SRC)) || mkdir -p $(dir $(API_SRC))
	test -d $(dir $(API_BUNDLED)) || mkdir -p $(dir $(API_BUNDLED))
	rm -rf $(DOCS_INTERNAL_DIR) && mkdir -p $(DOCS_INTERNAL_DIR)
	npm run bundle