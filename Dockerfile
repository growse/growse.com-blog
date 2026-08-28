# syntax=docker/dockerfile:1

FROM node:26.8.1 as assets-builder

COPY blog/_web /app

WORKDIR /app

RUN --mount=type=cache,target=/root/.npm \
    npm ci && npm run build

FROM ruby:4.0.6 as builder

COPY blog /app
COPY --from=assets-builder /assets /app/assets

WORKDIR /app

RUN --mount=type=cache,target=/usr/local/bundle/cache \
    bundle install

RUN bundle exec jekyll b

FROM node:26.8.1 as search-index-builder

COPY --from=assets-builder /app/node_modules /app/node_modules
COPY --from=builder /app/_site /site

RUN /app/node_modules/.bin/pagefind --site /site

FROM nginx:1-alpine-slim

LABEL org.opencontainers.image.source https://github.com/growse/growse.com-blog

COPY --from=search-index-builder /site /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN FRONTPAGE=$(cat /usr/share/nginx/html/frontpage.html) && sed -i 's@%FRONTPAGE%@'"$FRONTPAGE"'@' /etc/nginx/conf.d/default.conf
EXPOSE 80
