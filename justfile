set dotenv-load := true

container_engine := env("CONTAINER_ENGINE", "podman")
image := env("IMAGE", "growse.com-blog:latest")
port := env("PORT", "8080")

default:
	just --list

serve: build
	cd blog && bundle exec jekyll s

build:
	just build-blog-assets
	just build-blog
	just build-search-index

build-blog-assets:
	cd blog/_web && npm ci && npm run build

build-blog:
	cd blog && bundle install && bundle exec jekyll b

build-search-index:
	cd blog/_web && npm run index

build-container:
	{{container_engine}} build -t {{image}} .

run-container: build-container
	@echo "Serving on http://localhost:{{port}}/ - Ctrl-C to stop"
	{{container_engine}} run --rm -it -p {{port}}:80 {{image}}

clean:
	rm -rf blog/_site
	rm -rf blog/assets
	rm -rf blog/_web/node_modules
