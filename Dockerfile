# syntax=docker/dockerfile:1

FROM node:26.13.1 as assets-builder

WORKDIR /blog/_web

# Dependencies first, so a change to a post doesn't reinstall them.
COPY blog/_web/package.json blog/_web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# The whole blog, laid out as in the repo: scripts/fonts.mjs scans the posts
# and pages for the characters in use, and scripts/images.mjs reads
# ../_config.yml.
COPY blog /blog
RUN npm run build

FROM ruby:4.0.7 as builder

COPY blog /app
COPY --from=assets-builder /blog/assets /app/assets

WORKDIR /app

RUN --mount=type=cache,target=/usr/local/bundle/cache \
    bundle install

RUN bundle exec jekyll b

FROM node:26.13.1 as search-index-builder

COPY --from=assets-builder /blog/_web/node_modules /app/node_modules
COPY --from=builder /app/_site /site

RUN /app/node_modules/.bin/pagefind --site /site

FROM nginx:1-alpine-slim

LABEL org.opencontainers.image.source https://github.com/growse/growse.com-blog

COPY --from=search-index-builder /site /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN FRONTPAGE=$(cat /usr/share/nginx/html/frontpage.html) && sed -i 's@%FRONTPAGE%@'"$FRONTPAGE"'@' /etc/nginx/conf.d/default.conf
EXPOSE 80
