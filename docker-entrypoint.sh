#!/bin/sh
set -eu

: "${CASAR_HOST:=noivos.casar.com}"
: "${CASAR_PATH:=/mariafernandaeronaldo}"
: "${PORT:=10000}"

envsubst '${CASAR_HOST} ${CASAR_PATH} ${PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
