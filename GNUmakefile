.PHONY: build clean serve

build: blog/_site searchIndex searchIndexServer/search_server

serve: build
	cd blog && bundle exec jekyll s

blog/assets: $(wildcard blog/_web/**/*.ts) $(wildcard blog/_web/*.ts) blog/_web/package.json blog/_web/package-lock.json
	cd blog/_web && npm ci && npm run build

blog/_site: blog/assets $(wildcard blog/**/*.md) blog/_config.yml
	cd blog && bundle install && bundle exec jekyll b

searchIndexServer/generate_index: $(wildcard searchIndexServer/**/*.go)
	cd searchIndexServer && CGO_ENABLED=0 go build ./cmd/generate_index

searchIndexServer/search_server: $(wildcard searchIndexServer/**/*.go)
	cd searchIndexServer && CGO_ENABLED=0 go build ./cmd/search_server

searchIndex: export SEARCH_INDEXROOT=blog/_site
searchIndex: searchIndexServer/generate_index blog/_site
	./searchIndexServer/generate_index

clean:
	rm -rf blog/_site
	rm -rf blog/assets
	rm -f searchIndexServer/generate_index
	rm -f searchIndexServer/search_server
	rm -rf searchIndex
	rm -rf blog/_web/node_modules
