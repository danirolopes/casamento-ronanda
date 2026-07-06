FROM nginx:1.27-alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY custom.css /usr/share/nginx/html/custom.css
COPY rsvp.css /usr/share/nginx/html/rsvp.css
COPY rsvp.js /usr/share/nginx/html/rsvp.js
COPY inject.js /usr/share/nginx/html/inject.js
COPY og-image.png /usr/share/nginx/html/og-image.png
COPY fonts/ /usr/share/nginx/html/fonts/

RUN chmod +x /docker-entrypoint.sh

ENV CASAR_HOST=noivos.casar.com
ENV CASAR_PATH=/mariafernandaeronaldo
ENV CASAR_PAINEL_HOST=painel.casar.com
ENV SITE_URL=https://mariafernandaeronaldo.com.br
ENV PORT=10000

EXPOSE 10000

ENTRYPOINT ["/docker-entrypoint.sh"]
