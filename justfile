set dotenv-load := true

default:
	just --list

serve:
	cd blog && bundle exec jekyll s

build:
	just build-blog-assets
	just build-blog
	just build-index-generator
	just build-search-server
	just make-search-index

build-blog-assets:
	cd blog/_web && npm ci && npm run build

build-blog:
	cd blog && bundle install && bundle exec jekyll b

build-index-generator:
	cd searchIndexServer && CGO_ENABLED=0 go build ./cmd/generate_index

build-search-server:
	cd searchIndexServer && CGO_ENABLED=0 go build ./cmd/search_server

make-search-index:
	SEARCH_INDEXROOT=blog/_site ./searchIndexServer/generate_index

clean:
	rm -rf blog/_site
	rm -rf blog/assets
	rm -f searchIndexServer/generate_index
	rm -f searchIndexServer/search_server
	rm -rf searchIndex
	rm -rf blog/_web/node_modules
