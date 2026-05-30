# syntax=docker/dockerfile:1

FROM node:25.9.0 as assets-builder

COPY blog/_web /app

WORKDIR /app

RUN npm ci && npm run build

FROM ruby:4.0.2 as builder

COPY blog /app

WORKDIR /app

RUN bundle install

RUN bundle exec jekyll b

FROM nginx:1

LABEL org.opencontainers.image.source https://github.com/growse/growse.com-blog

COPY --from=builder /app/_site /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN FRONTPAGE=$(cat /usr/share/nginx/html/frontpage.html) && sed -i 's@%FRONTPAGE%@'"$FRONTPAGE"'@' /etc/nginx/conf.d/default.conf
EXPOSE 80
