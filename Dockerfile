FROM nginx:1

LABEL org.opencontainers.image.source https://github.com/growse/growse.com-blog

COPY blog/_site /usr/share/nginx/html

COPY searchIndex /var/local/searchIndex
COPY searchIndexServer/search_server /usr/local/bin/search_server
RUN chmod +x /usr/local/bin/search_server
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN FRONTPAGE=$(cat /usr/share/nginx/html/frontpage.html) && sed -i 's@%FRONTPAGE%@'"$FRONTPAGE"'@' /etc/nginx/conf.d/default.conf
COPY 40-run-search-server.sh /docker-entrypoint.d/
