set dotenv-load := true

default:
	just --list

serve: build
	cd blog && bundle exec jekyll s

build:
	just build-blog-assets
	just build-blog

build-blog-assets:
	cd blog/_web && npm ci && npm run build

build-blog:
	cd blog && bundle install && bundle exec jekyll b

clean:
	rm -rf blog/_site
	rm -rf blog/assets
	rm -f searchIndexServer/generate_index
	rm -f searchIndexServer/search_server
	rm -rf searchIndex
	rm -rf blog/_web/node_modules
