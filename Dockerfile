FROM nginx:1-alpine

LABEL org.opencontainers.image.source https://github.com/growse/growse.com-blog

COPY _site /usr/share/nginx/html