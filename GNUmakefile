.PHONY: build clean

build: blog/_site searchIndex searchIndexServer/search_server

blog/assets: $(wildcard blog/_yarn/**/*.ts) $(wildcard blog/_yarn/*.ts) blog/_yarn/package.json blog/_yarn/yarn.lock
	cd blog/_yarn && yarn install && yarn build

blog/_site: blog/assets $(wildcard blog/**/*.md) blog/_config.yml
	cd blog && bundle exec jekyll b

searchIndexServer/generate_index: $(wildcard searchIndexServer/**/*.go) 
	cd searchIndexServer && go build ./cmd/generate_index

searchIndexServer/search_server: $(wildcard searchIndexServer/**/*.go)
	cd searchIndexServer && go build ./cmd/search_server

searchIndex: export SEARCH_INDEXROOT=blog/_site
searchIndex: searchIndexServer/generate_index blog/_site
	./searchIndexServer/generate_index

clean:
	rm -rf blog/_site
	rm -rf blog/assets
	rm -f searchIndexServer/generate_index
	rm -f searchIndexServer/search_server
	rm -rf searchIndex
	rm -rf blog/_yarn/node_modules
